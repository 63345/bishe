import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Image as ImageIcon, BookOpen, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { QUICK_QUESTIONS } from '../data/mockData';

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  sources?: { title: string; score?: number }[];
  imageUrl?: string;
};

export default function ChatPage() {
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: '您好！我是大闸蟹精准养殖智能决策助手。请问有什么我可以帮您的？您可以直接提问，或者点击下方的快捷问题。',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = ''; // Reset input

    // 生成本地预览地址
    const imageUrl = URL.createObjectURL(file);

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: '请帮我识别一下这张照片中的病害情况。',
      timestamp: new Date().toISOString(),
      imageUrl: imageUrl, // 显示上传的图片
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    const aiMsgId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMsgId,
      role: 'ai',
      content: '',
      timestamp: new Date().toISOString(),
      sources: [],
    };
    setMessages(prev => [...prev, aiMessage]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/recognition/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('请求失败');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('无法获取响应流');

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'sources') {
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === aiMsgId
                      ? { ...msg, sources: data.data.map((s: any) => ({ title: s.title, score: s.score })) }
                      : msg
                  )
                );
              } else if (data.type === 'content') {
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === aiMsgId
                      ? { ...msg, content: msg.content + data.data }
                      : msg
                  )
                );
              } else if (data.type === 'done') {
                setIsTyping(false);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      console.error('图片识别请求失败:', error);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMsgId
            ? {
              ...msg,
              content: `抱歉，病害识别服务暂时不可用。\n\n错误信息：${error instanceof Error ? error.message : '未知错误'}`,
            }
            : msg
        )
      );
    }
    setIsTyping(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // 从后端获取历史消息进行持久化展示
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/chat/history');
        if (res.ok) {
          const data = await res.json();
          if (data.history && data.history.length > 0) {
            const historyMessages: Message[] = [];
            // 后端是按时间倒序返回的，为了在聊天界面中正常展示，先整体反转
            [...data.history].reverse().forEach((item: any) => {
              // 处理返回时间可能没有时区标识导致的本地时间解析错误 (SQLite CURRENT_TIMESTAMP 默认为UTC)
              const dateStr = String(item.created_at);
              const createdAtUTC = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z';

              // 用户的提问
              historyMessages.push({
                id: `user_${item.id}`,
                role: 'user',
                content: item.question,
                timestamp: createdAtUTC,
              });

              // 尝试解析存放的引用来源
              let parsedSources = [];
              try {
                if (item.sources) parsedSources = JSON.parse(item.sources);
              } catch (e) {
                // 解析失败则忽略
              }

              // AI的回答
              historyMessages.push({
                id: `ai_${item.id}`,
                role: 'ai',
                content: item.answer,
                timestamp: new Date(new Date(createdAtUTC).getTime() + 1000).toISOString(), // 让AI回答比用户提问稍微晚一秒排序更好看
                sources: parsedSources,
              });
            });

            setMessages([
              {
                id: '1',
                role: 'ai',
                content: '您好！我是大闸蟹精准养殖智能决策助手。请问有什么我可以帮您的？您可以直接提问，或者点击下方的快捷问题。',
                timestamp: new Date(new Date().getTime() - 86400000).toISOString(),
              },
              ...historyMessages
            ]);
          }
        }
      } catch (err) {
        console.error("加载历史消息失败:", err);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    if (location.state?.initialQuery) {
      handleSend(location.state.initialQuery);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleSend = async (text: string = inputValue) => {
    if (!text.trim()) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);

    // 创建一个空的AI消息用于流式填充
    const aiMsgId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMsgId,
      role: 'ai',
      content: '',
      timestamp: new Date().toISOString(),
      sources: [],
    };

    setMessages(prev => [...prev, aiMessage]);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      });

      if (!response.ok) throw new Error('请求失败');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('无法获取响应流');

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'sources') {
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === aiMsgId
                      ? { ...msg, sources: data.data.map((s: any) => ({ title: s.title, score: s.score })) }
                      : msg
                  )
                );
              } else if (data.type === 'content') {
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === aiMsgId
                      ? { ...msg, content: msg.content + data.data }
                      : msg
                  )
                );
              } else if (data.type === 'done') {
                setIsTyping(false);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      console.error('聊天请求失败:', error);
      // 回退到模拟响应
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMsgId
            ? {
              ...msg,
              content: `抱歉，AI 服务暂时不可用。请检查后端服务是否已启动。\n\n错误信息：${error instanceof Error ? error.message : '未知错误'}`,
            }
            : msg
        )
      );
    }

    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
        {messages.map((msg) => {
          // 正在输入时，跳过空的 AI 消息气泡（由下方 typing indicator 代替显示）
          if (isTyping && msg.role === 'ai' && msg.content === '') return null;
          return (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] lg:max-w-[70%] flex gap-3 sm:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                {/* Avatar */}
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold shadow-sm text-sm sm:text-base
                ${msg.role === 'user' ? 'bg-emerald-600' : 'bg-blue-900'}`}>
                  {msg.role === 'user' ? '我' : 'AI'}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-sm text-sm sm:text-base
                  ${msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-sm'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'}`}>

                    {msg.role === 'ai' ? (
                      <div className="flex flex-col">
                        <div className="prose prose-sm prose-emerald max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>

                        {/* Advanced Feature: Knowledge Relationship Linking */}
                        {msg.content.includes("颤抖病") && (
                          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-emerald-600" />
                              <span className="text-sm font-medium text-emerald-800">发现相关百科知识：颤抖病</span>
                            </div>
                            <a href="/encyclopedia?keyword=颤抖病" className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors">
                              查看图文讲解
                            </a>
                          </div>
                        )}
                        {msg.content.includes("伊乐藻") && (
                          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-emerald-600" />
                              <span className="text-sm font-medium text-emerald-800">发现相关百科知识：伊乐藻</span>
                            </div>
                            <a href="/encyclopedia?keyword=伊乐藻" className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors">
                              查看水草管理
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {msg.imageUrl && (
                          <img
                            src={msg.imageUrl}
                            alt="上传的图片"
                            className="mt-2 max-w-[200px] max-h-[200px] object-cover rounded-lg border border-emerald-500/30"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {msg.sources.map((source, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100">
                          <BookOpen className="w-3 h-3" />
                          {source.title}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="text-xs text-slate-400 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && messages[messages.length - 1]?.content === '' && (
          <div className="flex justify-start">
            <div className="max-w-[80%] flex gap-3 sm:gap-4 flex-row">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold shadow-sm bg-blue-900 text-sm sm:text-base">
                AI
              </div>
              <div className="px-5 py-4 rounded-2xl bg-white border border-slate-200 rounded-tl-sm shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area & Quick Questions */}
      <div className="bg-white border-t border-slate-200 p-3 sm:p-4 shrink-0">
        <div className="max-w-5xl mx-auto">
          {/* Quick Questions */}
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="whitespace-nowrap px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-50 border border-slate-200 text-slate-600 text-xs sm:text-sm rounded-full hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="flex items-end gap-2 sm:gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 sm:p-2 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleImageUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 sm:p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors shrink-0"
              title="上传病害照片"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="描述您遇到的养殖问题，或上传病害照片..."
              className="flex-1 bg-transparent border-none outline-none resize-none py-2.5 sm:py-3 max-h-32 min-h-[40px] sm:min-h-[44px] text-sm sm:text-base text-slate-700"
              rows={1}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isTyping}
              className={`p-2 sm:p-3 rounded-xl shrink-0 transition-colors flex items-center justify-center
                ${inputValue.trim() && !isTyping
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            >
              {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
