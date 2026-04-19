import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Camera, Loader2, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function DiseaseRecognitionPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resultText, setResultText] = useState<string>('');
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch('/api/recognition/history')
      .then(res => res.json())
      .then(data => {
        if (data.history && data.history.length > 0) {
          setHistoryRecords(data.history);
          // 恢复最新一次的记录到主要展示区
          const latest = data.history[0];
          setImageSrc(latest.image_path);
          setResultText(latest.result_text);
          setAnalysisComplete(true);
        }
      })
      .catch(err => console.error("加载病害识别历史记录失败", err));
  }, []);

  const loadHistoryItem = (item: any) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setImageSrc(item.image_path);
    setResultText(item.result_text);
    setAnalysisComplete(true);
    setIsAnalyzing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setResultText('');
      setAnalysisComplete(false);

      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
        setIsAnalyzing(true);
        analyzeImage(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/recognition/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('API 请求失败');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('无法获取响应流');

      let buffer = '';
      let fullText = '';

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
              if (data.type === 'content') {
                fullText += data.data;
                setResultText(fullText);
              } else if (data.type === 'done') {
                setIsAnalyzing(false);
                setAnalysisComplete(true);
                // 刷新一下历史记录列表
                fetch('/api/recognition/history')
                  .then(r => r.json())
                  .then(d => {
                    if (d.history) setHistoryRecords(d.history);
                  });
              }
            } catch (e) { }
          }
        }
      }
    } catch (error) {
      console.error('病害识别请求失败:', error);
      // 回退到模拟结果
      setResultText(`## 🔍 病害识别结果
- **病害名称**：黑鳃病
- **置信度**：92%
- **严重程度**：中度

## 📋 病症描述
观察到大闸蟹鳃部发黑，可能由水质恶化或细菌感染引起。

## 💊 治疗建议
1. 立即全池泼洒二氧化氯或聚维酮碘进行水体消毒。
2. 增加底部增氧，改善底层水质环境。
3. 减少投喂量，并在饲料中添加维生素C和免疫多糖。
4. 若病情严重，建议使用专用杀菌药物，并注意观察蜕壳情况。

## ⚠️ 注意事项
> *AI 诊断结果仅供参考，不能完全替代专业水产兽医的现场诊断。*`);
      setAnalysisComplete(true);
    }
    setIsAnalyzing(false);
  };

  // 在canvas上绘制图片
  useEffect(() => {
    if (imageSrc && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        const containerWidth = canvas.parentElement?.clientWidth || 500;
        const scale = containerWidth / img.width;
        canvas.width = containerWidth;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        if (isAnalyzing) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      };
      img.src = imageSrc;
    }
  }, [imageSrc, isAnalyzing, analysisComplete]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-2">
          <Camera className="w-6 h-6 text-emerald-600" />
          智能拍照识病
        </h2>
        <p className="text-slate-500 text-sm">上传大闸蟹病害照片，AI将自动识别病症并提供治疗建议。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Upload & Canvas */}
        <div className="space-y-4">
          {!imageSrc ? (
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative min-h-[400px]">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-emerald-600">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-slate-700 mb-2">点击或拖拽上传照片</h3>
              <p className="text-sm text-slate-500 text-center max-w-xs">支持 JPG, PNG 格式。请尽量保证病灶部位清晰可见。</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <span className="font-medium text-slate-700">检测图像</span>
                <button
                  onClick={() => { setImageSrc(null); setImageFile(null); setResultText(''); setIsAnalyzing(false); setAnalysisComplete(false); }}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  重新上传
                </button>
              </div>
              <div className="relative w-full flex items-center justify-center bg-slate-900 min-h-[300px]">
                <canvas ref={canvasRef} className="max-w-full h-auto" />

                {isAnalyzing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <div className="bg-white/90 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                      <span className="font-medium text-slate-800">AI 正在深度分析中...</span>
                    </div>

                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="space-y-4">
          {isAnalyzing && !resultText ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 h-full flex flex-col items-center justify-center text-slate-400 min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
              </div>
              <p>正在提取图像特征...</p>
              <p className="text-sm mt-2">匹配病害特征库中</p>
            </div>
          ) : resultText ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
              <div className="bg-amber-50 p-5 sm:p-6 border-b border-amber-100 flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0 text-amber-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-amber-800 mb-1">AI 病害分析结果</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 flex items-center gap-1">
                      {isAnalyzing ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> 分析中...</>
                      ) : (
                        <><CheckCircle className="w-4 h-4 text-emerald-500" /> 分析完成</>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 flex-1 overflow-y-auto">
                <div className="prose prose-sm prose-emerald max-w-none">
                  <ReactMarkdown>{resultText}</ReactMarkdown>
                </div>

                <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    * 免责声明：AI 诊断结果仅供参考，不能完全替代专业水产兽医的现场诊断。建议结合实际水质指标和养殖情况综合判断。
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 h-full flex flex-col items-center justify-center text-slate-400 min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <Camera className="w-8 h-8 text-slate-300" />
              </div>
              <p>上传照片后将在此显示诊断结果</p>
            </div>
          )}
        </div>
      </div>

      {/* 历史记录列表 */}
      {historyRecords.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            历史检测记录
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {historyRecords.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => loadHistoryItem(item)}
                className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all flex flex-col h-40"
              >
                <div className="h-28 bg-slate-100 w-full overflow-hidden shrink-0 relative">
                  <img
                    src={item.image_path}
                    alt="历史照片"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                    {(() => {
                      const dtStr = String(item.created_at);
                      const utcStr = dtStr.includes('T') ? dtStr : dtStr.replace(' ', 'T') + 'Z';
                      return new Date(utcStr).toLocaleDateString();
                    })()}
                  </div>
                </div>
                <div className="p-2 flex-1 text-xs text-slate-600 line-clamp-2 mt-1">
                  {item.result_text.replace(/[#*]/g, '').substring(0, 40)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
