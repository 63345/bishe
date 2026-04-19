"""
生长周期看板 API 路由
提供当前生长阶段、管理建议和水质数据
"""
from datetime import datetime
from fastapi import APIRouter

router = APIRouter(prefix="/api/dashboard", tags=["生长周期看板"])

# 生长阶段数据
GROWTH_STAGES = [
    {
        "id": "stage-1", "name": "扣蟹入池", "months": [2, 3],
        "description": "放养准备与早期适应"
    },
    {
        "id": "stage-2", "name": "第一次蜕壳", "months": [4],
        "description": "体质恢复与促生长"
    },
    {
        "id": "stage-3", "name": "第二次蜕壳", "months": [5],
        "description": "水草培育与营养强化"
    },
    {
        "id": "stage-4", "name": "第三次蜕壳", "months": [6],
        "description": "高温期前准备"
    },
    {
        "id": "stage-5", "name": "第四次蜕壳", "months": [7],
        "description": "度夏与溶氧管理"
    },
    {
        "id": "stage-6", "name": "第五次蜕壳", "months": [8],
        "description": "最后冲刺与育肥"
    },
    {
        "id": "stage-7", "name": "成熟采收", "months": [9, 10, 11],
        "description": "品质提升与捕捞上市"
    },
]

# 各阶段管理建议
STAGE_ADVICE = {
    "stage-1": {
        "feeding": "投喂高蛋白配合饲料（蛋白含量40%以上），辅以少量冰鲜鱼，每日投喂量为蟹体重的1-2%。",
        "water": "水位保持在60-80cm，透明度30-40cm，pH值7.5-8.5，溶氧量>5mg/L。",
        "disease": "重点预防纤毛虫病和肠炎。入池前用生石灰或漂白粉彻底清塘，蟹种用3-5%食盐水浸泡消毒。"
    },
    "stage-2": {
        "feeding": "增加植物性饵料比例，如南瓜、煮熟的玉米等，保持蛋白含量在38%左右。",
        "water": "逐渐加深水位至80-100cm，注意补充钙磷等微量元素，促进蜕壳。",
        "disease": "注意观察蜕壳情况，预防蜕壳不遂。保持水质清新，避免使用刺激性强的药物。"
    },
    "stage-3": {
        "feeding": "增加动物性饵料，如螺蛳、小鱼虾，促进营养积累。",
        "water": "保持水体高溶氧，定期使用微生态制剂调节水质。",
        "disease": "重点预防黑鳃病和水肿病，定期巡塘观察。"
    },
    "stage-4": {
        "feeding": "加大投喂量，以动物性饲料为主，辅以植物性饲料，占比6:4。",
        "water": "水位加深至1.0-1.2m，高温天气注意换水降温和增氧。",
        "disease": "夏季高温注意预防烂鳃病和细菌性感染，定期使用微生物制剂维持水质。"
    },
    "stage-5": {
        "feeding": "继续高蛋白投喂，可添加免疫增强剂（如维生素C、多糖）。",
        "water": "密切监测溶氧，确保>5mg/L。必要时启动增氧设备。高温期加深水位至1.2-1.5m。",
        "disease": "重点检查蜕壳死亡率，减少应激，避免高温时段操作。"
    },
    "stage-6": {
        "feeding": "以冰鲜鱼、螺蛳等高蛋白饵料为主，适量添加玉米，促进育肥。",
        "water": "保持水质稳定，适当降低水位至0.8-1.0m，促进性腺发育。",
        "disease": "注意观察活力和摄食量，发现异常及时排查。"
    },
    "stage-7": {
        "feeding": "减少投喂量，逐步停喂，准备捕捞。",
        "water": "保持水质清新，便于大闸蟹上岸活动，利于捕捞。",
        "disease": "捕捞期避免机械损伤，暂养池要做好消毒工作。"
    }
}


@router.get("/stage")
async def get_current_stage():
    """获取当前月份对应的生长阶段和管理建议"""
    current_month = datetime.now().month

    # 查找当前阶段
    current_stage = None
    current_stage_index = -1
    for idx, stage in enumerate(GROWTH_STAGES):
        if current_month in stage["months"]:
            current_stage = stage
            current_stage_index = idx
            break

    # 如果没找到（如冬季 12, 1 月），返回休养期
    if current_stage is None:
        return {
            "stages": GROWTH_STAGES,
            "currentStageIndex": -1,
            "currentStage": {
                "id": "stage-rest", "name": "越冬休养", "months": [12, 1],
                "description": "大闸蟹越冬管理"
            },
            "advice": {
                "feeding": "适当投喂少量饲料，保持基础营养需求。",
                "water": "保持水位稳定，防止结冰伤害大闸蟹。",
                "disease": "做好越冬前的体质调理，减少应激。"
            },
            "waterQuality": {
                "temperature": 8.0,
                "dissolvedOxygen": 7.5
            }
        }

    advice = STAGE_ADVICE.get(current_stage["id"], {
        "feeding": "根据水温和天气情况，适时调整投喂量。",
        "water": "保持水质清新，定期检测氨氮、亚硝酸盐等指标。",
        "disease": "坚持'预防为主,防重于治'的原则,定期巡塘。"
    })

    from utils import get_current_sensor_data
    sensor_data = get_current_sensor_data()
    temp = sensor_data["temperature"]
    do = sensor_data["dissolvedOxygen"]

    return {
        "stages": GROWTH_STAGES,
        "currentStageIndex": current_stage_index,
        "currentStage": current_stage,
        "advice": advice,
        "waterQuality": {
            "temperature": temp,
            "dissolvedOxygen": do
        }
    }
