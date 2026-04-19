import { useState, useEffect } from 'react';
import { Droplets, Thermometer, ShieldAlert, CheckCircle2, Loader2, AlertTriangle, ArrowRight, Star } from 'lucide-react';
import { INITIAL_INVENTORY, getStageCriticalAlerts } from '../data/inventoryData';

type StageData = {
  id: string;
  name: string;
  months: number[];
  description: string;
};

type StageAdvice = {
  feeding: string;
  water: string;
  disease: string;
};

type DashboardData = {
  stages: StageData[];
  currentStageIndex: number;
  currentStage: StageData;
  advice: StageAdvice;
  waterQuality: {
    temperature: number;
    dissolvedOxygen: number;
  };
};

// 本地 fallback 数据
const FALLBACK_STAGES: StageData[] = [
  { id: 'stage-1', name: '扣蟹入池', months: [2, 3], description: '放养准备与早期适应' },
  { id: 'stage-2', name: '第一次蜕壳', months: [4], description: '体质恢复与促生长' },
  { id: 'stage-3', name: '第二次蜕壳', months: [5], description: '水草培育与营养强化' },
  { id: 'stage-4', name: '第三次蜕壳', months: [6], description: '高温期前准备' },
  { id: 'stage-5', name: '第四次蜕壳', months: [7], description: '度夏与溶氧管理' },
  { id: 'stage-6', name: '第五次蜕壳', months: [8], description: '最后冲刺与育肥' },
  { id: 'stage-7', name: '成熟采收', months: [9, 10, 11], description: '品质提升与捕捞上市' }
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard/stage');
      if (!res.ok) throw new Error('API 请求失败');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('获取生长阶段数据失败:', err);
      // 使用 fallback 数据
      const currentMonth = new Date().getMonth() + 1;
      const idx = FALLBACK_STAGES.findIndex(s => s.months.includes(currentMonth));
      setData({
        stages: FALLBACK_STAGES,
        currentStageIndex: idx >= 0 ? idx : 0,
        currentStage: FALLBACK_STAGES[idx >= 0 ? idx : 0],
        advice: {
          feeding: '根据水温和天气情况，适时调整投喂量。',
          water: '保持水质清新，定期检测氨氮、亚硝酸盐等指标。',
          disease: '坚持预防为主、防重于治的原则，定期巡塘。'
        },
        waterQuality: { temperature: 22.5, dissolvedOxygen: 6.8 }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { stages, currentStageIndex, currentStage, advice, waterQuality } = data;

  // Format today's date
  const today = new Date();
  const dateString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  // 生长阶段物资联动预警
  const stageAlerts = getStageCriticalAlerts(INITIAL_INVENTORY);
  const stageConfig = stageAlerts.stageConfig;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">当前养殖阶段：{currentStage.name}</h2>
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md">{dateString}</span>
          </div>
          <p className="text-sm sm:text-base text-slate-500 mt-1">{currentStage.description}</p>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Thermometer className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="text-xs sm:text-sm text-slate-500">当前水温</div>
              <div className="font-bold text-slate-800 text-sm sm:text-base">{waterQuality.temperature}°C</div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600 shrink-0">
              <Droplets className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="text-xs sm:text-sm text-slate-500">溶氧量</div>
              <div className="font-bold text-slate-800 text-sm sm:text-base">{waterQuality.dissolvedOxygen} mg/L</div>
            </div>
          </div>
        </div>
      </div>

      {/* 生长阶段物资联动预警 */}
      {stageAlerts.alertCount > 0 && stageConfig && (
        <div className="bg-gradient-to-r from-red-50 to-amber-50 border border-red-200 rounded-2xl p-5 flex items-start sm:items-center flex-col sm:flex-row gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0 border border-red-200">
            <AlertTriangle className="w-6 h-6 text-red-600 drop-shadow-sm" />
          </div>
          <div className="flex-1 w-full lg:w-auto">
            <div className="text-base sm:text-lg font-bold text-red-800 mb-1.5 flex items-center gap-2">
              系统智能检测：当前「{stageConfig.stageName}」阶段关键物资库存不足
            </div>
            <div className="text-sm text-red-700 leading-relaxed max-w-4xl">
              <span className="font-semibold">{stageConfig.reason}</span>。<br className="sm:hidden" />
              需立即补充以下 {stageAlerts.alertCount} 种物资，以防影响大闸蟹正常生长：
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {stageAlerts.criticalItems.filter(i => i.isLow).map(item => (
                <span key={item.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-red-700 text-xs sm:text-sm rounded-full border border-red-200 font-medium shadow-sm">
                  <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                  {item.name}（余量: {item.stock} {item.spec}，预警线: {item.warningLine}）
                </span>
              ))}
            </div>
          </div>
          <a href="/inventory" className="self-end sm:self-center shrink-0 w-full sm:w-auto text-center px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition shadow-md shadow-red-600/20 active:scale-95 flex items-center justify-center gap-2 mt-2 sm:mt-0 z-10">
            立即前往采购/入库 <ArrowRight className="w-4 h-4 ml-1" />
          </a>
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto scrollbar-hide">
        <div className="min-w-[800px]">
          <div className="flex justify-between relative">
            {/* Background Line */}
            <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 -z-10"></div>
            {/* Active Line */}
            <div
              className="absolute top-5 left-0 h-1 bg-emerald-500 -z-10 transition-all duration-1000"
              style={{ width: `${(Math.max(0, currentStageIndex) / (stages.length - 1)) * 100}%` }}
            ></div>

            {stages.map((stage: StageData, idx: number) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div key={stage.id} className="flex flex-col items-center gap-3 relative z-10 w-24">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-colors
                    ${isPast ? 'bg-emerald-500 border-emerald-100 text-white' :
                      isCurrent ? 'bg-white border-emerald-500 text-emerald-600 shadow-md ring-4 ring-emerald-50' :
                        'bg-white border-slate-200 text-slate-300'}`}>
                    {isPast ? <CheckCircle2 className="w-5 h-5" /> : <span className="font-bold text-sm">{idx + 1}</span>}
                  </div>
                  <div className="text-center">
                    <div className={`font-medium text-sm ${isCurrent ? 'text-emerald-700 font-bold' : isPast ? 'text-slate-700' : 'text-slate-400'}`}>
                      {stage.name}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {stage.months.join(',')}月
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Advice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Feeding */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800">投喂策略</h3>
          </div>
          <p className="text-slate-600 leading-relaxed text-sm">{advice.feeding}</p>
        </div>

        {/* Water Quality */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Droplets className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">水质标准</h3>
          </div>
          <p className="text-slate-600 leading-relaxed text-sm">{advice.water}</p>
        </div>

        {/* Disease Prevention */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">病害防治</h3>
          </div>
          <p className="text-slate-600 leading-relaxed text-sm">{advice.disease}</p>
        </div>
      </div>
    </div>
  );
}
