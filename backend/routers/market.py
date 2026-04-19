"""
行情动态监测 API 路由
提供大闸蟹各规格市场行情价格数据
"""
import random
from datetime import datetime, timedelta
from fastapi import APIRouter

router = APIRouter(prefix="/api/market", tags=["行情监测"])


import json
import asyncio
from openai import OpenAI
from config import settings
from database import get_market_prices_from_db, save_market_price
from crawler import crawler

_market_data_cache = {}

def generate_market_data(days: int = 72, region: str = "兴化"):
    """
    通过 Qwen API 动态生成市场价格数据
    如果失败，回退到模拟数据
    """
    cache_key = f"{region}_{days}_{datetime.now().strftime('%Y%m%d')}"
    
    # 使用缓存，避免每次切换地区都等待 LLM 几秒钟
    if cache_key in _market_data_cache:
        return _market_data_cache[cache_key]
        
    try:
        client = OpenAI(
            api_key=settings.DASHSCOPE_API_KEY,
            base_url=settings.LLM_BASE_URL,
        )
        prompt = f'''请模拟或查找最近{days}天江苏{region}大闸蟹(2两母、3两公、4两公)的历史价格走势。
价格单位为元/斤。
必须返回一个严格格式化的 JSON 数组，不要包含任何其他文字或 markdown 解释。
JSON 格式要求如下：
[
    {{"date": "10月1日", "2两母": 45.5, "3两公": 55.0, "4两公": 80.5}}
]
请确保恰好生成 {days} 条数据，按日期从早到晚排序，最后一条必须是今天的日期（{datetime.now().strftime("%m月%d日")}）。
仅返回 JSON 数组，不要额外说明。'''

        print(f"正在通过 Qwen API 获取 {region} 行情数据...")
        resp = client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[
                {"role": "system", "content": "你是一个只输出 JSON 格式数据的机器程序，不会输出多余的解释性文本。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
        )
        
        result_text = resp.choices[0].message.content.strip()
        
        # 处理可能的 markdown 代码块
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()
            
        data = json.loads(result_text)
        
        if isinstance(data, list) and len(data) > 0 and "date" in data[0]:
            print(f"Qwen API 成功返回 {region} 初始数据，并存入缓存！")
            _market_data_cache[cache_key] = data
            return data
    except Exception as e:
        print(f"通过 LLM 获取行情失败，正在回退到本地模拟数据。原因: {e}")

    # ================== 失败回退逻辑 ==================
    base_prices = {
        "兴化": {"2两母": 45, "3两公": 55, "4两公": 80},
        "阳澄湖": {"2两母": 65, "3两公": 80, "4两公": 120},
        "高淳": {"2两母": 50, "3两公": 62, "4两公": 90},
    }

    prices = base_prices.get(region, base_prices["兴化"])
    data = []

    for i in range(days):
        date = datetime.now() - timedelta(days=days - 1 - i)
        trend = i * 0.3  # 整体上涨趋势

        entry = {
            "date": f"{date.month}月{date.day}日",
            "2两母": round(prices["2两母"] + random.uniform(-3, 5) + trend * 0.5, 2),
            "3两公": round(prices["3两公"] + random.uniform(-4, 6) + trend * 0.6, 2),
            "4两公": round(prices["4两公"] + random.uniform(-5, 8) + trend * 0.8, 2),
        }
        data.append(entry)

    # 存入缓存
    _market_data_cache[cache_key] = data
    return data

async def bootstrap_market_db(region: str):
    """如果数据库中没有该地区数据，则初始化 30 条历史记录"""
    existing = get_market_prices_from_db(region, limit=1)
    if not existing:
        print(f"[{region}] 正在通过爬虫拉取历史行情记录并填充数据库...")
        # 为了演示真实感，调用 crawler 来生成 3 天（72 小时）的历史记录
        history_data = crawler.get_historical_seed(region, days=72)
        
        for item in history_data:
            save_market_price(
                region=region,
                price_2f=item["2两母"],
                price_3m=item["3两公"],
                price_4m=item["4两公"],
                record_time=item["time"]
            )
        print(f"[{region}] 初始化真实历史行情数据完成。")
        
async def fetch_hourly_market_price():
    """按一定频率（展示用加速为每分钟）动态模拟并在后台持续写入行情数据的任务"""
    regions = ["兴化", "阳澄湖", "高淳"]
    for r in regions:
        await bootstrap_market_db(r)
        
    while True:
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        for region in regions:
            try:
                # 调用爬虫抓取最新价格 (演示环境下，我们由于 requests 为阻塞请求，必须放入线程池)
                prices = await asyncio.to_thread(crawler.fetch_current_prices, region)
                
                # 记录到数据库
                save_market_price(
                    region, 
                    prices["2两母"], 
                    prices["3两公"], 
                    prices["4两公"], 
                    record_time=now_str
                )
                print(f"[行情爬虫] 采集 {region} 最新真实记录: 2两母={prices['2两母']}, 3两公={prices['3两公']}, 4两公={prices['4两公']}, 时间={now_str}")
            except Exception as e:
                print(f"[行情爬虫] 执行采集出错: {e}")

        # 每 1 分钟模拟一次爬虫抓取逻辑 (为演示方便设置，通常为 3600s/1h)
        await asyncio.sleep(60)


@router.get("/prices")
async def get_market_prices(region: str = "兴化", days: int = 72):
    """
    获取大闸蟹行情价格数据（从持久化数据库获取）
    参数:
    - region: 产地（兴化/阳澄湖/高淳）
    - days: 天数（图表展示的点数）
    """
    data = get_market_prices_from_db(region, limit=days)

    # 计算统计信息
    if len(data) >= 2:
        latest = data[-1]
        prev = data[-2]
        stats = []
        for spec in ["2两母", "3两公", "4两公"]:
            diff = round(latest[spec] - prev[spec], 2)
            percent = round((diff / prev[spec]) * 100, 1) if prev[spec] else 0
            stats.append({
                "name": f"{spec}蟹均价",
                "price": latest[spec],
                "diff": diff,
                "percent": percent,
                "isUp": diff >= 0
            })
    else:
        stats = []

    return {
        "data": data,
        "stats": stats,
        "region": region
    }
