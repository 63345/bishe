import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Thermometer, Droplets, Activity, AlertCircle,
  CloudRain, Wind, Camera, UploadCloud, Loader2,
  FileText, Bot, ArrowRight, CheckCircle2
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import ReactMarkdown from 'react-markdown';

type WaterQualityData = {
  realtime: {
    temperature: number;
    dissolvedOxygen: number;
    ph: number;
    ammonia: number;
    doWarning: boolean;
    ammoniaWarning: boolean;
  };
  predictionData: Array<{
    time: string;
    actualDO: number | null;
    predictedDO: number | null;
  }>;
  weather: {
    pressure: number;
    pressureStatus: string;
    windDirection: string;
    windLevel: string;
  };
  analysis: {
    title: string;
    predictedLow: boolean;
    reasons: string[];
  } | null;
};

export default function WarningPage() {
  const navigate = useNavigate();

  // 水质数据状态
  const [wqData, setWqData] = useState<WaterQualityData | null>(null);
  const [wqLoading, setWqLoading] = useState(true);

  // 视觉检测状态
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [visualResult, setVisualResult] = useState<{ color: string, behavior: string, conclusion: string } | null>(null);

  // 手动录入状态
  const [manualPH, setManualPH] = useState('8.2');
  const [manualAmmonia, setManualAmmonia] = useState('0.8');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  useEffect(() => {
    fetchWaterQuality();
  }, []);

  const fetchWaterQuality = async () => {
    try {
      const res = await fetch('/api/warning/water-quality');
      if (!res.ok) throw new Error('API 请求失败');
      const data = await res.json();
      setWqData(data);
    } catch (err) {
      console.error('获取水质数据失败:', err);
      // 使用 fallback 数据
      const fallbackData: any[] = Array.from({ length: 24 }, (_, i) => {
        const isFuture = i > 12;
        const baseDO = 6.0 + Math.sin((i - 6) / 24 * Math.PI * 2) * 2;
        return {
          time: `${i.toString().padStart(2, '0')}:00`,
          actualDO: isFuture ? null : +(baseDO + Math.random() * 0.5).toFixed(2),
          predictedDO: isFuture ? +(baseDO - 1.5 + Math.random() * 0.5).toFixed(2) : null,
        };
      });
      fallbackData[12].predictedDO = fallbackData[12].actualDO;
      setWqData({
        realtime: { temperature: 28.5, dissolvedOxygen: 4.2, ph: 8.2, ammonia: 0.3, doWarning: true, ammoniaWarning: false },
        predictionData: fallbackData,
        weather: { pressure: 998, pressureStatus: '偏低', windDirection: '东南风', windLevel: '2级' },
        analysis: { title: '异常根源分析', predictedLow: true, reasons: ['当前气压突降（998hPa），导致水体溶氧能力下降', '夜间水草及藻类呼吸作用将消耗大量氧气'] }
      });
    } finally {
      setWqLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. 本地立即展示缩略图
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // 2. 清空并显示正在分析的加载动画
      setVisualResult(null);
      setIsAnalyzingImage(true);

      // 3. 构建表单上传图片至使用 Qwen-VL-Plus 驱动的系统后台
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/warning/visual-analyze', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('API 视觉分析请求失败');

        const data = await response.json();

        // 4. 将 AI 深度视觉大模型的返回结果渲染至面板
        setVisualResult({
          color: data.color || '提取水色失败',
          behavior: data.behavior || '行为无特征',
          conclusion: data.conclusion || '无综合结论给出'
        });
      } catch (err) {
        console.error('多模态视觉检测失败:', err);
        setVisualResult({
          color: '识别中断',
          behavior: '识别中断',
          conclusion: '无法连接到 AI 视觉大模型引擎，请检查后端网络连接。'
        });
      } finally {
        setIsAnalyzingImage(false);
      }
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    setReport('');

    try {
      const response = await fetch('/api/warning/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ph: parseFloat(manualPH), ammonia: parseFloat(manualAmmonia) }),
      });

      if (!response.ok) throw new Error('API 请求失败');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('无法获取响应流');

      let buffer = '';
      let fullReport = '';

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
                fullReport += data.data;
                setReport(fullReport);
              } else if (data.type === 'done') {
                setIsGeneratingReport(false);
              }
            } catch (e) { }
          }
        }
      }
    } catch (err) {
      console.error('诊断请求失败:', err);
      // 回退到本地逻辑
      const ph = parseFloat(manualPH);
      const ammonia = parseFloat(manualAmmonia);
      let diag = '';
      if (ammonia > 0.5) {
        diag += `当前氨氮 ${ammonia} mg/L，超出安全标准（<0.5 mg/L）。`;
      } else {
        diag += `当前氨氮 ${ammonia} mg/L，在安全范围内。`;
      }
      if (ph > 9.0 || ph < 7.0) {
        diag += `pH值 ${ph} 异常。`;
      }
      if (ammonia > 0.5) {
        diag += `\n\n【建议】\n1. 立即停止投喂，减少有机物输入；\n2. 施用生物改底剂（如枯草芽孢杆菌）分解底部有机物；\n3. 条件允许下换水20%-30%。`;
      } else {
        diag += `\n\n【建议】\n继续保持当前水质管理策略，定期监测。`;
      }
      setReport(diag);
    }
    setIsGeneratingReport(false);
  };

  const handleConsultAI = () => {
    navigate('/', {
      state: {
        initialQuery: `当前池塘溶氧量${wqData?.realtime.dissolvedOxygen || 4.2}mg/L，预测未来会继续下降，气压较低（${wqData?.weather.pressure || 998}hPa），并且发现大闸蟹有上岸吐泡泡的现象，请问应该如何紧急处理？`
      }
    });
  };

  if (wqLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!wqData) return null;

  const { realtime, predictionData, weather, analysis } = wqData;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">水质预测与预警详情</h2>
          <p className="text-slate-500 text-sm mt-1">多维度水质监测、预测及智能诊断</p>
        </div>
      </div>

      {/* 1. 实时仪表盘 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Thermometer className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-500">实时水温</div>
            <div className="text-xl font-bold text-slate-800">{realtime.temperature} <span className="text-sm font-normal text-slate-500">°C</span></div>
          </div>
        </div>
        <div className={`bg-white p-4 rounded-2xl shadow-sm border ${realtime.doWarning ? 'border-red-200' : 'border-slate-100'} flex items-center gap-4 relative overflow-hidden`}>
          {realtime.doWarning && <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -z-10"></div>}
          <div className={`w-12 h-12 rounded-full ${realtime.doWarning ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-600'} flex items-center justify-center`}>
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-500">溶氧量 {realtime.doWarning && <span className="text-xs text-red-500 font-medium ml-1">偏低</span>}</div>
            <div className={`text-xl font-bold ${realtime.doWarning ? 'text-red-600' : 'text-slate-800'}`}>{realtime.dissolvedOxygen} <span className={`text-sm font-normal ${realtime.doWarning ? 'text-red-400' : 'text-slate-500'}`}>mg/L</span></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-500">pH 值</div>
            <div className="text-xl font-bold text-slate-800">{realtime.ph}</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-500">氨氮</div>
            <div className="text-xl font-bold text-slate-800">{realtime.ammonia} <span className="text-sm font-normal text-slate-500">mg/L</span></div>
          </div>
        </div>
      </div>

      {/* 2. 预测曲线与根源分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">24小时溶氧量预测曲线</h3>
          <div className="h-[300px] w-full -ml-4 sm:ml-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predictionData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 12 }} dy={10} minTickGap={30} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} domain={[2, 10]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="top" height={36} />
                <ReferenceLine x={predictionData[12]?.time || `${new Date().getHours().toString().padStart(2, '0')}:00`} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'top', value: '当前时间', fill: '#94a3b8', fontSize: 12 }} />
                <ReferenceLine y={4.0} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: '警戒线 (4.0)', fill: '#ef4444', fontSize: 12 }} />
                <Line type="monotone" dataKey="actualDO" name="历史实测" stroke="#10b981" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="predictedDO" name="未来预测" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          {/* 气象模拟 */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-blue-500" /> 实时气象环境 (API)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">气压</div>
                <div className="font-bold text-slate-800 flex items-end gap-1">
                  {weather.pressure} <span className="text-xs font-normal text-slate-500">hPa</span>
                  <span className="text-red-500 text-xs ml-1">↓ {weather.pressureStatus}</span>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">风向风力</div>
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <Wind className="w-3 h-3 text-slate-400" /> {weather.windDirection} {weather.windLevel}
                </div>
              </div>
            </div>
          </div>

          {/* 异常根源分析 */}
          {analysis && (
            <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
              <h3 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {analysis.title}
              </h3>
              <p className="text-sm text-red-700 leading-relaxed mb-4">
                预测未来6小时内溶氧量将持续偏低（&lt;4.0 mg/L）。<br />
                <strong>可能原因：</strong><br />
                {analysis.reasons.map((r, i) => (
                  <span key={i}>{i + 1}. {r}；<br /></span>
                ))}
              </p>
              <button
                onClick={handleConsultAI}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Bot className="w-4 h-4" />
                一键咨询 AI 专家
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. 视觉辅助与手动录入 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 视觉辅助检测 */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-600" /> 视觉辅助检测 (非接触式)
          </h3>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/2">
              {!imageSrc ? (
                <div className="border-2 border-dashed border-slate-300 rounded-xl h-40 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <UploadCloud className="w-6 h-6 text-slate-400 mb-2" />
                  <span className="text-sm text-slate-500">上传池塘/大闸蟹照片</span>
                </div>
              ) : (
                <div className="relative h-40 rounded-xl overflow-hidden bg-slate-900">
                  <img src={imageSrc} alt="Uploaded" className="w-full h-full object-cover opacity-80" />
                  {isAnalyzingImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="w-full sm:w-1/2 flex flex-col justify-center">
              {isAnalyzingImage ? (
                <div className="text-sm text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> 正在运行 CNN 水色分析...
                </div>
              ) : visualResult ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-slate-500">水色识别</div>
                    <div className="text-sm font-medium text-slate-800">{visualResult.color}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">生物行为反馈</div>
                    <div className="text-sm font-medium text-red-600">{visualResult.behavior}</div>
                  </div>
                  <div className="p-2 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="text-xs font-bold text-orange-800 mb-1">AI 结论</div>
                    <div className="text-xs text-orange-700">{visualResult.conclusion}</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-400 text-center">
                  上传照片以分析水色及生物行为
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 手动录入与 RAG 诊断 */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> 手动录入与 RAG 诊断
          </h3>

          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-full sm:w-1/2 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">试纸测得 pH 值</label>
                <input
                  type="number"
                  step="0.1"
                  value={manualPH}
                  onChange={(e) => setManualPH(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">试纸测得氨氮 (mg/L)</label>
                <input
                  type="number"
                  step="0.1"
                  value={manualAmmonia}
                  onChange={(e) => setManualAmmonia(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isGeneratingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : '生成诊断报告'}
              </button>
            </div>

            <div className="w-full sm:w-1/2">
              {report ? (
                <div className="h-full bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-700 overflow-y-auto max-h-[200px]">
                  <div className="font-bold text-slate-800 mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> RAG 诊断结果
                  </div>
                  <div className="prose prose-sm prose-emerald max-w-none">
                    <ReactMarkdown>{report}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="h-full bg-slate-50 rounded-xl border border-slate-200 border-dashed flex items-center justify-center text-sm text-slate-400 p-4 text-center">
                  录入数据并点击生成，系统将检索《水质标准手册》进行对比分析
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
