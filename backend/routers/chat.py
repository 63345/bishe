"""
智能咨询 API 路由
实现 RAG 问答、流式输出、聊天历史
"""
import json
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from rag.chain import rag_chat, rag_chat_stream
from database import save_chat_record, get_chat_history, clear_chat_history

router = APIRouter(prefix="/api/chat", tags=["智能咨询"])


class ChatRequest(BaseModel):
    question: str
    user_id: int = 1


class ChatResponse(BaseModel):
    answer: str
    sources: list


@router.post("")
async def chat(request: ChatRequest):
    """
    RAG 智能问答（非流式）
    """
    answer, sources = rag_chat(request.question)

    # 保存聊天记录
    sources_str = json.dumps(sources, ensure_ascii=False)
    save_chat_record(request.user_id, request.question, answer, sources_str)

    return {
        "answer": answer,
        "sources": sources
    }


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    """
    RAG 智能问答（SSE 流式输出）
    前端通过 EventSource 或 fetch 接收
    """

    def generate():
        full_answer = ""
        sources = []

        for text, src_list in rag_chat_stream(request.question):
            if text == "__SOURCES__":
                sources = src_list
                # 发送来源信息
                yield f"data: {json.dumps({'type': 'sources', 'data': sources}, ensure_ascii=False)}\n\n"
            else:
                full_answer += text
                yield f"data: {json.dumps({'type': 'content', 'data': text}, ensure_ascii=False)}\n\n"

        # 发送完成信号
        yield f"data: {json.dumps({'type': 'done', 'data': ''})}\n\n"

        # 保存聊天记录
        sources_str = json.dumps(sources, ensure_ascii=False)
        save_chat_record(request.user_id, request.question, full_answer, sources_str)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.get("/history")
async def chat_history_api(user_id: int = 1, limit: int = 50):
    """获取聊天历史"""
    history = get_chat_history(user_id, limit)
    return {"history": history}

@router.delete("/history")
async def clear_chat_history_api(user_id: int = 1):
    """清空聊天历史"""
    clear_chat_history(user_id)
    return {"success": True}
