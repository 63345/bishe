"""
智能拍照识病 API 路由
通过图片上传 + LLM 多模态分析大闸蟹病害
"""
import json
import base64
import os
import uuid
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse

from database import save_recognition_record, get_recognition_history
from rag.chain import rag_chat_stream, simple_chat_stream

router = APIRouter(prefix="/api/recognition", tags=["拍照识病"])


@router.post("/analyze")
async def analyze_disease(file: UploadFile = File(...)):
    """
    病害识别：接收大闸蟹病害图片，返回识别结果和治疗建议
    使用 Qwen VL 多模态模型或 RAG 文本分析
    """
    # 读取上传的图片
    contents = await file.read()
    
    # 压缩图片以防止 Base64 过长导致大模型 API 拒绝 (Payload Too Large)
    import io
    from PIL import Image
    try:
        img = Image.open(io.BytesIO(contents))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        img.thumbnail((1024, 1024))
        buf = io.BytesIO()
        img.save(buf, format='JPEG', quality=85)
        # 用压缩后的内容替换原始内容用于大模型调用
        optimized_contents = buf.getvalue()
        image_base64 = base64.b64encode(optimized_contents).decode("utf-8")
        file_content_type = "image/jpeg"
    except Exception as e:
        print(f"图片压缩失败，直接使用原图: {e}")
        image_base64 = base64.b64encode(contents).decode("utf-8")
        file_content_type = file.content_type if file.content_type else "image/jpeg"
    
    # 保存图片到静态目录
    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    os.makedirs("data/uploads", exist_ok=True)
    file_path = f"data/uploads/{unique_filename}"
    img_url = f"/api/uploads/{unique_filename}" # 前端访问路径，由于加了代理，实际由 /uploads 提供服务

    with open(file_path, "wb") as f:
        f.write(contents)
    
    # 尝试使用 Qwen VL 多模态模型
    from openai import OpenAI
    from config import settings
    
    client = OpenAI(
        api_key=settings.DASHSCOPE_API_KEY,
        base_url=settings.LLM_BASE_URL,
    )
    
    def generate():
        try:
            # 使用多模态模型分析图片
            stream = client.chat.completions.create(
                model="qwen-vl-plus",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text", 
                                "text": "你是一个水产助手。现在用户上传了一张螃蟹的照片让你看看。"
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{file_content_type};base64,{image_base64}"
                                }
                            },
                            {
                                "type": "text",
                                "text": """请仔细观察这张大闸蟹/养殖照片，对大闸蟹可能的健康状况、病害或养殖环境问题进行分析。
【非常重要的输出要求】：
无论图片里的大闸蟹有病还是健康，你都**必须严格按照以下格式**输出分析报告卡片。
如果大闸蟹看起来非常健康，或者只是一点轻微的异常，你可以将病害名称写为“亚健康状态”、“疑似缺氧”、“轻微甲壳磨损”、“水肿初期症状”或干脆写“暂无明显特异性病体体征”，并在“病症描述”和“治疗/预防建议”中给出合理的解释和日常预防管理建议。不要编造极其严重的病（如肝胰腺坏死）来吓唬人，必须结合你观察到的图片实际情况（水质、蟹壳颜色、步足完整度等）来“圆”这个分析结果。

必须包含且仅包含以下四个模块：

## 🔍 病害/状态分析结果
- **病害名称/状态**：[依据图像特征识别出的情况]
- **置信度**：[百分比]
- **严重程度**：[轻微/中度/重度/健康]

## 📋 症状与特征描述
[详细描述你确切观察到的体征，例如鳃部颜色、附肢是否缺损、水质浑浊度、甲壳表面状态等]

## 💊 处置与建议
1. [具体的养殖调整或用药步骤1]
2. [具体的养殖调整或用药步骤2]
3. [具体的养殖调整或用药步骤3]

## ⚠️ 注意事项
[相关注意事项]"""
                            }
                        ]
                    }
                ],
                stream=True,
                max_tokens=2000,
                temperature=0.4,
            )
            
            full_text = ""
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_text += content
                    yield f"data: {json.dumps({'type': 'content', 'data': content}, ensure_ascii=False)}\n\n"
            
            # 保存到数据库
            save_recognition_record(1, img_url, full_text)

            yield f"data: {json.dumps({'type': 'done', 'data': ''})}\n\n"
            
        except Exception as e:
            # 如果多模态模型调用失败，回退到纯文本 RAG 分析
            print(f"多模态模型调用失败: {e}，回退到 RAG 文本分析")
            fallback_prompt = """用户上传了一张大闸蟹的照片进行病害诊断。
请根据你的专业知识，列出大闸蟹最常见的3种病害（黑鳃病、水肿病、烂肢病），并给出：
1. 如何通过外观辨别该病害
2. 详细的治疗方案
3. 预防措施

请使用 Markdown 格式输出。"""
            
            full_text = ""
            for text, src_list in rag_chat_stream(fallback_prompt):
                if text == "__SOURCES__":
                    yield f"data: {json.dumps({'type': 'sources', 'data': src_list}, ensure_ascii=False)}\n\n"
                else:
                    full_text += text
                    yield f"data: {json.dumps({'type': 'content', 'data': text}, ensure_ascii=False)}\n\n"
            
            # 保存到数据库
            save_recognition_record(1, img_url, full_text)
            
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

@router.get("/history")
async def get_history_api(user_id: int = 1, limit: int = 10):
    """获取病害识别历史记录"""
    history = get_recognition_history(user_id, limit)
    return {"history": history}
