"""
ChromaDB 向量存储模块
管理向量数据库的构建、持久化和检索
"""
import os
import time
from typing import List, Optional

import chromadb
from chromadb.config import Settings as ChromaSettings
from langchain_core.documents import Document

from config import settings

from chromadb.api.types import EmbeddingFunction, Documents, Embeddings

class DashScopeEmbeddingFunction(EmbeddingFunction):
    """
    使用 DashScope（通义千问）Embedding API 的自定义 Embedding 函数
    通过 OpenAI 兼容接口调用，兼容 ChromaDB 的 EmbeddingFunction 接口
    """

    def __init__(self, api_key: str, model: str = "text-embedding-v3"):
        self.api_key = api_key
        self.model = model
        from openai import OpenAI
        self._client = OpenAI(
            api_key=api_key,
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        )

    def name(self) -> str:
        """ChromaDB 1.5+ 要求的 name 方法"""
        return f"dashscope-{self.model}"

    def __call__(self, input: Documents) -> Embeddings:
        """ChromaDB 调用接口"""
        texts = [str(t) for t in input]
        res = self.embed_documents(texts)
        # 将内部结构严格转为原生列表类型，避免 Pydantic 或 numpy 类型干扰 Rust 绑定
        return [[float(x) for x in emb] for emb in res]

    def embed_documents(self, texts) -> List[List[float]]:
        """批量文本向量化"""
        texts = [str(t) for t in texts]
        all_embeddings = []
        # 每次最多处理 6 条
        batch_size = 6
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            for attempt in range(5):
                try:
                    resp = self._client.embeddings.create(
                        model=self.model,
                        input=batch,
                    )
                    for item in resp.data:
                        all_embeddings.append(item.embedding)
                    break
                except Exception as e:
                    if attempt < 4:
                        print(f"  ⚠ 第 {attempt+1} 次调用失败，{attempt+1}秒后重试... ({e})")
                        time.sleep(attempt + 1)
                    else:
                        raise
            time.sleep(0.3)
        return all_embeddings

    def embed_query(self, input=None, text=None) -> List[float]:
        """单条查询向量化 - 兼容 ChromaDB 1.5+ (传 input) 和旧版 (传 text)"""
        query = str(input) if input is not None else str(text)
        result = self.embed_documents([query])
        return result[0]


# 全局变量
_chroma_client: Optional[chromadb.ClientAPI] = None
_collection = None
_embedding_fn: Optional[DashScopeEmbeddingFunction] = None


def get_embedding_function() -> DashScopeEmbeddingFunction:
    """获取 Embedding 函数实例"""
    global _embedding_fn
    if _embedding_fn is None:
        _embedding_fn = DashScopeEmbeddingFunction(
            api_key=settings.DASHSCOPE_API_KEY,
            model=settings.EMBEDDING_MODEL
        )
    return _embedding_fn


def get_chroma_client() -> chromadb.ClientAPI:
    """获取 ChromaDB 客户端"""
    global _chroma_client
    if _chroma_client is None:
        os.makedirs(settings.CHROMA_DB_PATH, exist_ok=True)
        _chroma_client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
    return _chroma_client


def get_collection():
    """获取或创建 ChromaDB 集合"""
    global _collection
    if _collection is None:
        client = get_chroma_client()
        ef = get_embedding_function()
        _collection = client.get_or_create_collection(
            name="crab_farming_knowledge",
            embedding_function=ef,
            metadata={"description": "大闸蟹养殖知识库"}
        )
    return _collection


def build_vectorstore(chunks: List[Document]) -> None:
    """
    将文档块存入 ChromaDB 向量库
    如果已有数据则清空后重建
    """
    client = get_chroma_client()
    ef = get_embedding_function()

    # 删除旧集合（重建）
    try:
        client.delete_collection("crab_farming_knowledge")
    except Exception:
        pass

    global _collection
    _collection = client.create_collection(
        name="crab_farming_knowledge",
        embedding_function=ef,
        metadata={"description": "大闸蟹养殖知识库"}
    )

    if not chunks:
        print("警告：没有要存入的文档块")
        return

    # 批量添加
    batch_size = 50
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        ids = [f"chunk_{i + j}" for j in range(len(batch))]
        documents = [doc.page_content for doc in batch]
        metadatas = [doc.metadata for doc in batch]

        _collection.add(
            ids=ids,
            documents=documents,
            metadatas=metadatas
        )
        print(f"  已存入 {min(i + batch_size, len(chunks))}/{len(chunks)} 个文本块")

    print(f"向量库构建完成，共 {_collection.count()} 个文本块")


def search_similar(query: str, top_k: int = None) -> List[dict]:
    """
    语义检索：查找与 query 最相关的文档块
    返回格式: [{"content": str, "source": str, "score": float}]
    """
    if top_k is None:
        top_k = settings.RETRIEVER_TOP_K

    collection = get_collection()

    if collection.count() == 0:
        return []

    # ChromaDB 1.5+ Rust 绑定对 query_texts 内部 embedding 类型检查变严格，
    # 手动先获取查询向量，再用 query_embeddings 传入以规避兼容性问题
    ef = get_embedding_function()
    query_embedding = ef.embed_documents([query])[0]
    # 确保是纯 Python float 列表
    query_embedding = [float(x) for x in query_embedding]

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas", "distances"]
    )

    output = []
    if results and results["documents"]:
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0]
        ):
            output.append({
                "content": doc,
                "source": meta.get("source", "未知来源"),
                "score": round(1 - dist, 4)  # 距离转相似度
            })

    return output
