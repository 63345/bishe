"""
知识库构建脚本

运行此脚本将：
1. 从 养殖知识文件/ 目录加载所有 PDF/TXT/MD 文件
2. 进行文本分块
3. 使用 DashScope Embedding 向量化并存入 ChromaDB

使用方法:
  cd backend
  python build_knowledge.py
"""
import sys
import os

# 确保可以导入项目模块
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import settings
from rag.loader import load_documents, split_documents
from rag.vectorstore import build_vectorstore


def main():
    print("=" * 60)
    print("大闸蟹养殖知识库构建工具")
    print("=" * 60)

    # 检查 API Key
    if not settings.DASHSCOPE_API_KEY or settings.DASHSCOPE_API_KEY == "your_dashscope_api_key_here":
        print("\n❌ 错误: 请先在 backend/.env 文件中配置 DASHSCOPE_API_KEY")
        print("   获取方式: https://dashscope.console.aliyun.com/apiKey")
        sys.exit(1)

    print(f"\n配置信息:")
    print(f"  知识库目录: {settings.KNOWLEDGE_DIR}")
    print(f"  ChromaDB 路径: {settings.CHROMA_DB_PATH}")
    print(f"  Embedding 模型: {settings.EMBEDDING_MODEL}")
    print(f"  分块大小: {settings.CHUNK_SIZE} 字符")
    print(f"  分块重叠: {settings.CHUNK_OVERLAP} 字符")

    # 1. 加载文档
    print(f"\n{'='*40}")
    print("步骤 1: 加载文档")
    print(f"{'='*40}")
    documents = load_documents()

    if not documents:
        print("\n❌ 未找到任何文档，请检查知识库目录")
        sys.exit(1)

    # 2. 文本分块
    print(f"\n{'='*40}")
    print("步骤 2: 文本分块")
    print(f"{'='*40}")
    chunks = split_documents(documents)

    # 3. 存入向量库
    print(f"\n{'='*40}")
    print("步骤 3: 向量化并存入 ChromaDB")
    print(f"{'='*40}")
    build_vectorstore(chunks)

    print(f"\n{'='*60}")
    print("✅ 知识库构建完成！")
    print(f"{'='*60}")
    print(f"\n现在可以启动后端服务:")
    print(f"  cd backend")
    print(f"  uvicorn main:app --reload --port 8000")


if __name__ == "__main__":
    main()
