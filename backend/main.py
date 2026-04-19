"""
大闸蟹精准养殖智能决策咨询系统 — FastAPI 后端入口

启动命令:
  cd backend
  uvicorn main:app --reload --port 8000

首次运行需要先构建知识库:
  python build_knowledge.py
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_db
from routers import chat, dashboard, market, warning, recognition, user

# 创建 FastAPI 应用
app = FastAPI(
    title="大闸蟹精准养殖智能决策咨询系统 API",
    description="基于 RAG 架构的大闸蟹养殖智能决策后端",
    version="1.0.0"
)

# CORS 中间件（允许前端跨域请求）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 开发阶段允许所有来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.staticfiles import StaticFiles

# 注册路由
app.include_router(chat.router)
app.include_router(dashboard.router)
app.include_router(market.router)
app.include_router(warning.router)
app.include_router(recognition.router)
app.include_router(user.router)

# 挂载静态图片目录
os.makedirs("data/uploads", exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory="data/uploads"), name="uploads")


import asyncio

@app.on_event("startup")
async def startup_event():
    """应用启动时初始化数据库"""
    print("正在初始化数据库...")
    init_db()
    print("数据库初始化完成")
    print(f"LLM 模型: {settings.LLM_MODEL}")
    print(f"Embedding 模型: {settings.EMBEDDING_MODEL}")
    print(f"知识库路径: {settings.KNOWLEDGE_DIR}")
    print(f"ChromaDB 路径: {settings.CHROMA_DB_PATH}")

    # 启动后台行情拉取任务
    asyncio.create_task(market.fetch_hourly_market_price())
    print("后台行情自动监控任务已启动启动")


@app.get("/")
async def root():
    return {
        "name": "大闸蟹精准养殖智能决策咨询系统",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/api/health")
async def health_check():
    """健康检查接口"""
    return {"status": "healthy"}
