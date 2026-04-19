import random
from datetime import datetime

_last_update_time = None
_current_sensor_data = {}

def get_current_sensor_data():
    """获取当前模拟的传感器数据，5分钟内保持一致"""
    global _last_update_time, _current_sensor_data
    now = datetime.now()
    
    # 5分钟内数据不频繁跳变，保持各个看板的一致性
    if _last_update_time is None or (now - _last_update_time).total_seconds() > 300:
        current_month = now.month
        if current_month in [12, 1, 2]:
            temp = round(random.uniform(5.0, 10.0), 1)
            do = round(random.uniform(7.5, 9.5), 1)
        elif current_month in [3, 4]:
            temp = round(random.uniform(12.0, 18.0), 1)
            do = round(random.uniform(6.5, 8.5), 1)
        elif current_month in [5, 6]:
            temp = round(random.uniform(20.0, 26.0), 1)
            do = round(random.uniform(5.5, 7.5), 1)
        elif current_month in [7, 8]:
            temp = round(random.uniform(28.0, 33.0), 1)
            do = round(random.uniform(4.5, 6.0), 1) # 高温溶氧降低
        else: # 9, 10, 11
            temp = round(random.uniform(18.0, 25.0), 1)
            do = round(random.uniform(6.0, 8.0), 1)

        _current_sensor_data = {
            "temperature": temp,
            "dissolvedOxygen": do,
            "ph": round(8.2 + random.uniform(-0.2, 0.2), 1),
            "ammonia": round(0.3 + random.uniform(-0.1, 0.2), 1),
        }
        _last_update_time = now
        
    return _current_sensor_data
