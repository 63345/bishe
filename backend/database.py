"""
数据库管理模块
使用 SQLite 存储用户信息和聊天记录
"""
import sqlite3
import os
from datetime import datetime
from config import settings


def get_db_connection():
    """获取数据库连接"""
    os.makedirs(os.path.dirname(settings.DATABASE_PATH), exist_ok=True)
    conn = sqlite3.connect(settings.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """初始化数据库表"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 用户信息表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) DEFAULT '123456',
            display_name VARCHAR(100) DEFAULT '养殖户',
            role VARCHAR(50) DEFAULT '养殖户',
            avatar VARCHAR(10) DEFAULT 'U',
            farm_area FLOAT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 由于 SQLite 不能轻易修改已有表，所以对于已经存在的表，我们尝试尝试增加列
    alter_queries = [
        "ALTER TABLE users ADD COLUMN password VARCHAR(255) DEFAULT '123456'",
        "ALTER TABLE users ADD COLUMN display_name VARCHAR(100) DEFAULT '养殖户'",
        "ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT '养殖户'",
        "ALTER TABLE users ADD COLUMN avatar VARCHAR(10) DEFAULT 'U'",
        "ALTER TABLE users ADD COLUMN emp_no VARCHAR(50)",
        "ALTER TABLE users ADD COLUMN phone VARCHAR(20)",
        "ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT '正常'",
        "ALTER TABLE users ADD COLUMN ponds TEXT"
    ]
    for aq in alter_queries:
        try:
            cursor.execute(aq)
        except sqlite3.OperationalError:
            pass
            
    # 初始化旧用户的预设值，并修正旧版数据库中遗留的老 role（团队）名称
    try:
        cursor.execute("UPDATE users SET emp_no='EMP001', phone='13800138000', ponds='[\"全部\"]' WHERE username='admin' AND emp_no IS NULL")
        cursor.execute("UPDATE users SET emp_no='EMP002', phone='13912345670', ponds='[\"1号塘\"]' WHERE username='farmer_a' AND emp_no IS NULL")
        
        # 强制将老系统的职务头衔修正为新版团队架构标签，防止左侧树状图识别不到
        cursor.execute("UPDATE users SET role='系统管理' WHERE username='admin'")
        cursor.execute("UPDATE users SET role='技术团队' WHERE username='farmer_a'")
        cursor.execute("UPDATE users SET role='运营团队' WHERE username='farmer_b'")
    except sqlite3.OperationalError:
        pass

    # 咨询记录表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER DEFAULT 1,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            sources TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # 拍照识病记录表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recognition_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER DEFAULT 1,
            image_path TEXT NOT NULL,
            result_text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # 行情监测持久化表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS market_prices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            region VARCHAR(50) NOT NULL,
            record_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            price_2f FLOAT,
            price_3m FLOAT,
            price_4m FLOAT
        )
    """)

    # 插入默认用户
    users_to_add = [
        ("farmer_a", "123456", "养殖户 张伟", "技术团队", "张", "EMP002", "13912345678", '["1号塘", "2号塘"]'),
        ("farmer_b", "123456", "养殖户 李明", "运营团队", "李", "EMP003", "13798765432", '["3号塘"]'),
        ("admin", "admin123", "王芳", "系统管理", "王", "EMP001", "13800138000", '["全部池塘"]')
    ]
    for u in users_to_add:
        cursor.execute("SELECT COUNT(*) FROM users WHERE username = ?", (u[0],))
        if cursor.fetchone()[0] == 0:
            cursor.execute(
                "INSERT INTO users (username, password, display_name, role, avatar, emp_no, phone, ponds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                u
            )

    conn.commit()
    conn.close()


def save_chat_record(user_id: int, question: str, answer: str, sources: str = ""):
    """保存聊天记录"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO chat_history (user_id, question, answer, sources) VALUES (?, ?, ?, ?)",
        (user_id, question, answer, sources)
    )
    conn.commit()
    conn.close()


def get_chat_history(user_id: int = 1, limit: int = 50):
    """获取聊天历史"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM chat_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
        (user_id, limit)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def clear_chat_history(user_id: int = 1):
    """清空指定用户的聊天历史"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM chat_history WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()

def save_recognition_record(user_id: int, image_path: str, result_text: str):
    """保存病害识别记录"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO recognition_history (user_id, image_path, result_text) VALUES (?, ?, ?)",
        (user_id, image_path, result_text)
    )
    conn.commit()
    conn.close()

def get_recognition_history(user_id: int = 1, limit: int = 10):
    """获取病害识别历史（默认最新10条）"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM recognition_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
        (user_id, limit)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def save_market_price(region: str, price_2f: float, price_3m: float, price_4m: float, record_time: str = None):
    """保存行情记录（支持指定时间）"""
    conn = get_db_connection()
    cursor = conn.cursor()
    if record_time:
        cursor.execute(
            "INSERT INTO market_prices (region, record_time, price_2f, price_3m, price_4m) VALUES (?, ?, ?, ?, ?)",
            (region, record_time, price_2f, price_3m, price_4m)
        )
    else:
        cursor.execute(
            "INSERT INTO market_prices (region, price_2f, price_3m, price_4m) VALUES (?, ?, ?, ?)",
            (region, price_2f, price_3m, price_4m)
        )
    conn.commit()
    conn.close()

def get_market_prices_from_db(region: str, limit: int = 30):
    """获取最新行情记录（按时间升序返回）"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM market_prices WHERE region = ? ORDER BY record_time DESC LIMIT ?",
        (region, limit)
    )
    rows = cursor.fetchall()
    conn.close()
    # 转换为字典列表并反转为时间升序
    # 由于 SQLite 的返回是 sqlite3.Row，转 dict 处理
    data = []
    for row in reversed(rows):
        dt = row['record_time']
        # 格式化时间为 MM-DD HH:00 (如果是有时间的), 以便适配前端或者原始的MM月DD日
        if isinstance(dt, str):
            # 截取前面的月日部分或者时分部分
            # 为了更易读，我们可以转成 datetime
            try:
                dt_obj = datetime.strptime(dt, "%Y-%m-%d %H:%M:%S")
                # 数据库存储的已经是本地系统时间，直接格式化
                date_str = f"{dt_obj.month}月{dt_obj.day}日 {dt_obj.hour:02d}:{dt_obj.minute:02d}"
            except:
                date_str = str(dt)
        else:
            date_str = str(dt)

        data.append({
            "date": date_str,
            "2两母": row['price_2f'],
            "3两公": row['price_3m'],
            "4两公": row['price_4m']
        })
    return data

def get_user_by_username(username: str):
    """根据用户名获取用户信息"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_all_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def create_user(data: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO users (emp_no, username, password, display_name, role, avatar, phone, status, ponds)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (data.get('empNo'), data.get('account'), '123456', data.get('name'), 
          data.get('team'), data.get('name', 'U')[0], data.get('phone', '--'), '正常', data.get('ponds_json', '[]')))
    conn.commit()
    conn.close()

def update_user(user_id: int, data: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE users 
        SET emp_no=?, username=?, display_name=?, role=?, phone=?, ponds=? 
        WHERE id=?
    """, (data.get('empNo'), data.get('account'), data.get('name'), data.get('team'), data.get('phone'), data.get('ponds_json', '[]'), user_id))
    if data.get('passwordReset'):
        cursor.execute("UPDATE users SET password='123456' WHERE id=?", (user_id,))
    conn.commit()
    conn.close()

def delete_user(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
