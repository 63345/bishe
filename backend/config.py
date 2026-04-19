"""
配置管理模块
从 .env 文件加载配置，并提供统一的配置访问接口
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# 加载 .env 文件
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


class Settings:
    """应用配置"""

    # DashScope API
    DASHSCOPE_API_KEY: str = os.getenv("DASHSCOPE_API_KEY", "")

    # LLM 配置
    LLM_MODEL: str = os.getenv("LLM_MODEL", "qwen-plus")
    LLM_BASE_URL: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"

    # Embedding 配置
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "text-embedding-v3")

    # ChromaDB 配置
    CHROMA_DB_PATH: str = os.getenv("CHROMA_DB_PATH", str(BASE_DIR / "chroma_db"))

    # 知识库配置
    KNOWLEDGE_DIR: str = os.getenv("KNOWLEDGE_DIR", str(BASE_DIR.parent / "养殖知识文件"))

    # 数据库配置
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", str(BASE_DIR / "data" / "app.db"))

    # 检索参数
    RETRIEVER_TOP_K: int = int(os.getenv("RETRIEVER_TOP_K", "3"))
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "500"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "50"))

    # System Prompt
    SYSTEM_PROMPT: str = (
        "你是一位拥有20年经验的大闸蟹养殖专家。"
        "请仅根据提供的上下文回答问题。"
        "如果库中无相关内容，请告知用户咨询人工专家，不得编造。"
        "回答要专业、详细、有逻辑，使用 Markdown 格式。"
    )


settings = Settings()
