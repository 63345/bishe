"""
文档加载与分块模块
从养殖知识文件目录加载 PDF/TXT/MD 文件，进行文本清洗和分块处理
"""
import os
from pathlib import Path
from typing import List

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from config import settings


def load_pdf(file_path: str) -> str:
    """从 PDF 文件提取文本"""
    import pdfplumber

    text_parts = []
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    # 清洗：去除多余空白
                    cleaned = page_text.strip()
                    if cleaned:
                        text_parts.append(cleaned)
    except Exception as e:
        print(f"警告: 加载 PDF 失败 {file_path}: {e}")

    return "\n\n".join(text_parts)


def load_text_file(file_path: str) -> str:
    """加载文本文件"""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        with open(file_path, "r", encoding="gbk") as f:
            return f.read()


def load_documents() -> List[Document]:
    """
    从知识库目录加载所有文档
    支持 PDF, TXT, MD 格式
    """
    knowledge_dir = Path(settings.KNOWLEDGE_DIR)
    if not knowledge_dir.exists():
        print(f"警告: 知识库目录不存在: {knowledge_dir}")
        return []

    documents = []
    supported_extensions = {".pdf", ".txt", ".md"}

    for file_path in knowledge_dir.iterdir():
        if file_path.suffix.lower() not in supported_extensions:
            continue

        print(f"正在加载: {file_path.name}")

        if file_path.suffix.lower() == ".pdf":
            text = load_pdf(str(file_path))
        else:
            text = load_text_file(str(file_path))

        if text.strip():
            doc = Document(
                page_content=text,
                metadata={
                    "source": file_path.name,
                    "file_type": file_path.suffix.lower()
                }
            )
            documents.append(doc)
            print(f"  -> 成功加载，文本长度: {len(text)} 字符")
        else:
            print(f"  -> 跳过（无有效内容）")

    print(f"\n共加载 {len(documents)} 个文档")
    return documents


def split_documents(documents: List[Document]) -> List[Document]:
    """
    将文档分块
    使用 RecursiveCharacterTextSplitter，chunk_size=500，overlap=50
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", "。", "；", "，", " ", ""]
    )

    chunks = text_splitter.split_documents(documents)
    print(f"文档分块完成，共 {len(chunks)} 个文本块")
    return chunks
