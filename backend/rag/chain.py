"""
RAG 对话链模块
基于检索增强生成（RAG）实现智能问答
"""
from typing import Generator, Tuple, List
from openai import OpenAI

from config import settings
from rag.vectorstore import search_similar


def get_llm_client() -> OpenAI:
    """获取 OpenAI 兼容的 LLM 客户端（DashScope）"""
    return OpenAI(
        api_key=settings.DASHSCOPE_API_KEY,
        base_url=settings.LLM_BASE_URL,
    )


def build_rag_prompt(question: str, contexts: List[dict]) -> str:
    """
    构建 RAG 增强 Prompt
    将检索到的知识片段作为上下文注入 prompt
    """
    context_text = "\n\n---\n\n".join([
        f"【来源: {ctx['source']}】\n{ctx['content']}"
        for ctx in contexts
    ])

    return f"""请根据以下参考资料回答用户的问题。

## 参考资料
{context_text}

## 用户问题
{question}

## 回答要求
1. 仅根据参考资料中的内容回答，不得编造
2. 如果参考资料中没有相关信息，请明确告知用户
3. 回答要专业、详细、有条理
4. 使用 Markdown 格式
"""


def rag_chat(question: str) -> Tuple[str, List[dict]]:
    """
    RAG 问答（非流式）
    返回: (回答文本, 引用来源列表)
    """
    # 1. 语义检索
    contexts = search_similar(question)

    # 2. 构建 prompt
    user_prompt = build_rag_prompt(question, contexts)

    # 3. 调用 LLM
    client = get_llm_client()
    response = client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[
            {"role": "system", "content": settings.SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.7,
        max_tokens=2000,
    )

    answer = response.choices[0].message.content or ""

    # 4. 提取来源
    sources = [
        {"title": ctx["source"], "score": ctx["score"]}
        for ctx in contexts
    ]

    return answer, sources


def rag_chat_stream(question: str) -> Generator[Tuple[str, List[dict]], None, None]:
    """
    RAG 问答（流式输出）
    Yield: (文本片段, 引用来源列表)
    第一次 yield 返回来源信息, 后续 yield 返回文本片段
    """
    # 1. 语义检索
    contexts = search_similar(question)

    # 2. 提取来源
    sources = [
        {"title": ctx["source"], "score": ctx["score"]}
        for ctx in contexts
    ]

    # 先 yield 来源信息（第一个 yield）
    yield ("__SOURCES__", sources)

    # 3. 构建 prompt
    user_prompt = build_rag_prompt(question, contexts)

    # 4. 流式调用 LLM
    client = get_llm_client()
    stream = client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[
            {"role": "system", "content": settings.SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.7,
        max_tokens=2000,
        stream=True,
    )

    for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield (chunk.choices[0].delta.content, [])


def simple_chat_stream(question: str, system_prompt: str = None):
    """
    简单对话（不走 RAG，直接调用 LLM）
    用于预警诊断等场景
    """
    if system_prompt is None:
        system_prompt = settings.SYSTEM_PROMPT

    client = get_llm_client()
    stream = client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question}
        ],
        temperature=0.7,
        max_tokens=2000,
        stream=True,
    )

    for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
