"""
预警看板 API 路由
提供水质数据、24小时溶氧预测、视觉检测和 RAG 诊断
"""
import json
import math
import random
from datetime import datetime, timedelta
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from rag.chain import rag_chat_stream, simple_chat_stream

router = APIRouter(prefix="/api/warning", tags=["预警看板"])


@router.get("/water-quality")
async def get_water_quality():
    """
    获取实时水质数据和24小时溶氧预测曲线
    实际生产中应对接物联网传感器
    """
    from utils import get_current_sensor_data
    
    # 实时数据 (调用共享的模拟传感器，保证各看板一致)
    realtime = get_current_sensor_data().copy()

    # 判断预警
    realtime["doWarning"] = realtime["dissolvedOxygen"] < 5.0
    realtime["ammoniaWarning"] = realtime["ammonia"] > 0.5

    # 24小时溶氧预测曲线：基于当前真实时间
    prediction_data = []
    now = datetime.now()
    current_hour = now.hour
    
    # 我们生成过去 12 小时（包含当前）到未来 11 小时的数据，共 24 个点
    start_time = now - timedelta(hours=12)
    
    current_index = 12  # 当前时间对应的索引
    
    for i in range(24):
        target_time = start_time + timedelta(hours=i)
        hour = target_time.hour
        is_future = i > current_index
        is_current = i == current_index
        
        # 溶氧量基础曲线模拟（下午最高，清晨最低）
        base_do = 6.0 + math.sin((hour - 6) / 24 * math.pi * 2) * 2

        entry = {
            "time": f"{hour:02d}:00",
            "actualDO": None if is_future else round(base_do + random.uniform(0, 0.5), 2),
            "predictedDO": round(base_do - 1.5 + random.uniform(0, 0.5), 2) if (is_future or is_current) else None,
        }
        
        # 为了让两条线连接起来，将当前时间的 actualDO 赋给 predictedDO
        if is_current:
            entry["predictedDO"] = entry["actualDO"]
            
        prediction_data.append(entry)

    # 气象数据（模拟）
    weather = {
        "pressure": 998 + random.randint(-5, 5),
        "pressureStatus": "偏低",
        "windDirection": "东南风",
        "windLevel": "2级"
    }

    # 异常分析
    analysis = None
    if realtime["doWarning"]:
        analysis = {
            "title": "异常根源分析",
            "predictedLow": True,
            "reasons": [
                f"当前气压突降（{weather['pressure']}hPa），导致水体溶氧能力下降",
                "夜间水草及藻类呼吸作用将消耗大量氧气"
            ]
        }

    return {
        "realtime": realtime,
        "predictionData": prediction_data,
        "weather": weather,
        "analysis": analysis
    }


class DiagnoseRequest(BaseModel):
    ph: float
    ammonia: float


@router.post("/diagnose")
async def diagnose_water_quality(request: DiagnoseRequest):
    """
    根据手动录入的水质数据，使用 RAG 生成诊断报告（流式输出）
    """
    prompt = f"""作为大闸蟹养殖水质专家，请对以下检测数据进行诊断分析：

检测数据：
- pH值：{request.ph}
- 氨氮：{request.ammonia} mg/L

请按以下格式输出：
1. 各项指标是否正常（与标准范围对比）
2. 可能的原因分析
3. 具体的处理建议（包含用量和方法）
"""

    def generate():
        for text, src_list in rag_chat_stream(prompt):
            if text == "__SOURCES__":
                yield f"data: {json.dumps({'type': 'sources', 'data': src_list}, ensure_ascii=False)}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'content', 'data': text}, ensure_ascii=False)}\n\n"
        yield f"data: {json.dumps({'type': 'done', 'data': ''})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


from fastapi import UploadFile, File

@router.post("/visual-analyze")
async def visual_analyze(file: UploadFile = File(...)):
    """
    视觉辅助检测：接收前端真实上传的池塘照片，调用阿里云 Qwen-VL-Plus 多模态大模型
    进行真实的水色和生物行为分析。
    """
    import io, base64
    from PIL import Image
    from openai import OpenAI
    from config import settings
    import json

    # 压缩图片，防止 Base64 过长被拒绝
    contents = await file.read()
    try:
        img = Image.open(io.BytesIO(contents))
        if img.mode != 'RGB': img = img.convert('RGB')
        img.thumbnail((1024, 1024))
        buf = io.BytesIO()
        img.save(buf, format='JPEG', quality=85)
        image_base64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        file_content_type = "image/jpeg"
    except Exception as e:
        print(f"压缩失败: {e}")
        image_base64 = base64.b64encode(contents).decode("utf-8")
        file_content_type = file.content_type if file.content_type else "image/jpeg"

    client = OpenAI(
        api_key=settings.DASHSCOPE_API_KEY,
        base_url=settings.LLM_BASE_URL,
    )
    
    prompt = """作为水产养殖视觉诊断专家，请根据我上传的这张池塘/螃蟹照片，分析水色和生物行为。
必须仅输出一个严格格式化的 JSON 对象，不要输出任何额外的 markdown、```json 等说明性文字。
严格返回的JSON结构必须为（如果照片与水产无关，请在 conclusion 中提醒）：
{
  "color": "水质及颜色（例如：暗绿色，透明度低）",
  "behavior": "生物行为分布特征（例如：边缘发现大闸蟹上岸吐泡泡）",
  "conclusion": "针对该照片的综合结论和养殖建议"
}"""

    try:
        resp = client.chat.completions.create(
            model="qwen-vl-plus",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:{file_content_type};base64,{image_base64}"}}
                    ]
                }
            ],
            temperature=0.2,
        )
        
        result_text = resp.choices[0].message.content.strip()
        
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()
            
        return json.loads(result_text)
    except Exception as e:
        print(f"多模态模型分析异常: {e}")
        return {
            "color": "无法识别画面水色",
            "behavior": "画面无特征行为",
            "conclusion": f"大模型视觉分析失败，请检查模型密钥或稍后重试。原因：{str(e)[:50]}"
        }
