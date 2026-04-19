import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Save, Loader2, CheckCircle, Settings,
    Tractor, Bot, BellRing, Upload, ChevronRight,
    Database, ScrollText, Download, FileSpreadsheet,
    Clock, Cpu, HardDrive, Activity, Zap, Users
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

type SettingsDrawerProps = {
    isOpen: boolean;
    onClose: () => void;
};

type TabKey = 'farm' | 'ai' | 'warning' | 'data' | 'logs';

export default function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
    const [activeTab, setActiveTab] = useState<TabKey>('farm');
    const [isSaving, setIsSaving] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const { pondCount: globalPondCount, setPondCount: setGlobalPondCount } = useSettings();

    // 养殖场配置
    const [farmArea, setFarmArea] = useState('120');
    const [farmLocation, setFarmLocation] = useState('jiangsu');
    const [pondCount, setPondCount] = useState(globalPondCount.toString());

    // AI 偏好
    const [temperature, setTemperature] = useState(0.4);
    const [knowledgeFile, setKnowledgeFile] = useState<string | null>(null);
    const [autoReply, setAutoReply] = useState(true);

    // 预警开关
    const [doWarningEnabled, setDoWarningEnabled] = useState(true);
    const [doThreshold, setDoThreshold] = useState('4.0');
    const [tempWarningEnabled, setTempWarningEnabled] = useState(true);
    const [tempThreshold, setTempThreshold] = useState('30');
    const [ammoniaWarningEnabled, setAmmoniaWarningEnabled] = useState(true);
    const [ammoniaThreshold, setAmmoniaThreshold] = useState('0.5');

    // 数据导出
    const [isExporting, setIsExporting] = useState<string | null>(null);

    // 模拟系统日志
    const systemLogs = [
        { time: '16:23:01', level: 'INFO', module: 'API Gateway', message: 'POST /api/chat/stream 响应完成', latency: '2847ms', icon: Zap },
        { time: '16:22:58', level: 'INFO', module: 'RAG Engine', message: 'ChromaDB 向量检索完成，返回 Top-5 文档', latency: '312ms', icon: Database },
        { time: '16:22:55', level: 'WARN', module: 'Sensor Hub', message: '3号塘 溶氧传感器响应超时 (>3s)', latency: '3012ms', icon: Activity },
        { time: '16:22:30', level: 'INFO', module: 'LLM Service', message: 'qwen-plus 流式推理完成，Token: 1247', latency: '2534ms', icon: Cpu },
        { time: '16:21:45', level: 'INFO', module: 'Auth', message: '用户 farmer_a 登录成功', latency: '89ms', icon: Users },
        { time: '16:21:12', level: 'INFO', module: 'Market Sync', message: '行情数据后台同步 (8条记录写入)', latency: '156ms', icon: HardDrive },
        { time: '16:20:30', level: 'ERROR', module: 'VL Model', message: 'qwen-vl-plus 图片分析超时，已触发重试', latency: '5001ms', icon: Cpu },
        { time: '16:19:55', level: 'INFO', module: 'Database', message: 'SQLite WAL checkpoint 完成', latency: '45ms', icon: HardDrive },
    ];

    const apiStats = [
        { name: 'LLM 推理调用', count: 47, avgLatency: '2.1s', quota: '82%' },
        { name: 'RAG 向量检索', count: 47, avgLatency: '280ms', quota: '—' },
        { name: '多模态识图', count: 6, avgLatency: '3.4s', quota: '12%' },
        { name: '水质传感器轮询', count: 1440, avgLatency: '120ms', quota: '—' },
    ];

    const handleSave = async () => {
        setIsSaving(true);
        // 保存全局 Context
        const parsedCount = parseInt(pondCount, 10);
        if (!isNaN(parsedCount) && parsedCount > 0) {
            setGlobalPondCount(parsedCount);
        }
        await new Promise(resolve => setTimeout(resolve, 1200));
        setIsSaving(false);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setKnowledgeFile(file.name);
        }
    };

    const handleExport = async (type: string) => {
        setIsExporting(type);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsExporting(null);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
    };

    const tabs: { key: TabKey; label: string; icon: any }[] = [
        { key: 'farm', label: '养殖场', icon: Tractor },
        { key: 'ai', label: 'AI 偏好', icon: Bot },
        { key: 'warning', label: '预警', icon: BellRing },
        { key: 'data', label: '数据', icon: Database },
        { key: 'logs', label: '日志', icon: ScrollText },
    ];

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose}></div>

            {/* Drawer */}
            <div className="relative w-full sm:w-[540px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center">
                            <Settings className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800 text-lg">系统设置</h2>
                            <p className="text-xs text-slate-400">管理养殖场、AI 及预警参数</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tab Bar */}
                <div className="flex gap-2.5 border-b border-slate-100 px-4 pt-2 shrink-0 bg-white overflow-x-auto scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-none whitespace-nowrap flex items-center justify-center gap-2 py-3 px-5 text-sm font-medium rounded-t-xl transition-all relative
                ${activeTab === tab.key
                                    ? 'text-emerald-700 bg-emerald-50'
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                            {activeTab === tab.key && (
                                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-emerald-500 rounded-full"></div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* 养殖场配置 Tab */}
                    {activeTab === 'farm' && (
                        <div className="space-y-5">
                            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                <p className="text-xs text-emerald-700 leading-relaxed">
                                    配置您的养殖场基础信息，系统将根据这些参数优化 AI 推荐方案和预警阈值。
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">养殖面积（亩）</label>
                                <input
                                    type="number"
                                    value={farmArea}
                                    onChange={e => setFarmArea(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="请输入养殖面积"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">养殖场地点</label>
                                <select
                                    value={farmLocation}
                                    onChange={e => setFarmLocation(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="jiangsu">江苏 · 阳澄湖产区</option>
                                    <option value="anhui">安徽 · 当涂产区</option>
                                    <option value="hubei">湖北 · 洪湖产区</option>
                                    <option value="zhejiang">浙江 · 南太湖产区</option>
                                    <option value="other">其他地区</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">池塘数量</label>
                                <input
                                    type="number"
                                    value={pondCount}
                                    onChange={e => setPondCount(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="请输入池塘数量"
                                />
                            </div>
                        </div>
                    )}

                    {/* AI 偏好 Tab */}
                    {activeTab === 'ai' && (
                        <div className="space-y-6">
                            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    调整 AI 引擎的参数偏好。"回答随机性"越高，AI 输出更多元化；越低则更聚焦和精确。
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-semibold text-slate-700">回答随机性 (Temperature)</label>
                                    <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">{temperature.toFixed(2)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={temperature}
                                    onChange={e => setTemperature(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-500"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-0.5">
                                    <span>精确 (0.0)</span>
                                    <span>均衡 (0.5)</span>
                                    <span>创意 (1.0)</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">更新知识库文件</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.txt,.md"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        id="knowledge-upload"
                                    />
                                    <label
                                        htmlFor="knowledge-upload"
                                        className="flex items-center gap-3 w-full px-4 py-3.5 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-sm cursor-pointer hover:bg-slate-100 hover:border-emerald-300 transition-all"
                                    >
                                        <Upload className="w-5 h-5 text-slate-400" />
                                        <span className="text-slate-500">
                                            {knowledgeFile ? knowledgeFile : '点击上传 PDF / Word / TXT 文件'}
                                        </span>
                                    </label>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-2 pl-1">上传后系统将自动解析并更新 RAG 向量知识库</p>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div>
                                    <div className="text-sm font-semibold text-slate-700">智能自动回复</div>
                                    <div className="text-xs text-slate-400 mt-0.5">当检测到异常时自动生成处置建议</div>
                                </div>
                                <button
                                    onClick={() => setAutoReply(!autoReply)}
                                    className={`relative w-12 h-7 rounded-full transition-colors duration-300 shrink-0 ${autoReply ? 'bg-emerald-500' : 'bg-slate-300'} `}
                                >
                                    <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300 ${autoReply ? 'left-[22px]' : 'left-0.5'} `}></div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 预警开关 Tab */}
                    {activeTab === 'warning' && (
                        <div className="space-y-4">
                            <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                                <p className="text-xs text-orange-700 leading-relaxed">
                                    配置各项水质指标的预警阈值。当实时监测数据超过阈值时，系统将自动推送告警通知。
                                </p>
                            </div>

                            {/* 溶氧预警 */}
                            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <span className="text-sm font-semibold text-slate-700">溶氧量预警</span>
                                    </div>
                                    <button
                                        onClick={() => setDoWarningEnabled(!doWarningEnabled)}
                                        className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${doWarningEnabled ? 'bg-emerald-500' : 'bg-slate-300'} `}
                                    >
                                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${doWarningEnabled ? 'left-[22px]' : 'left-0.5'} `}></div>
                                    </button>
                                </div>
                                {doWarningEnabled && (
                                    <div className="flex items-center gap-3 pt-2">
                                        <span className="text-xs text-slate-500 shrink-0">低于</span>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={doThreshold}
                                            onChange={e => setDoThreshold(e.target.value)}
                                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                                        />
                                        <span className="text-xs text-slate-500 shrink-0">mg/L 时告警</span>
                                    </div>
                                )}
                            </div>

                            {/* 水温预警 */}
                            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        <span className="text-sm font-semibold text-slate-700">水温预警</span>
                                    </div>
                                    <button
                                        onClick={() => setTempWarningEnabled(!tempWarningEnabled)}
                                        className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${tempWarningEnabled ? 'bg-emerald-500' : 'bg-slate-300'} `}
                                    >
                                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${tempWarningEnabled ? 'left-[22px]' : 'left-0.5'} `}></div>
                                    </button>
                                </div>
                                {tempWarningEnabled && (
                                    <div className="flex items-center gap-3 pt-2">
                                        <span className="text-xs text-slate-500 shrink-0">高于</span>
                                        <input
                                            type="number"
                                            step="0.5"
                                            value={tempThreshold}
                                            onChange={e => setTempThreshold(e.target.value)}
                                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                                        />
                                        <span className="text-xs text-slate-500 shrink-0">°C 时告警</span>
                                    </div>
                                )}
                            </div>

                            {/* 氨氮预警 */}
                            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                        <span className="text-sm font-semibold text-slate-700">氨氮预警</span>
                                    </div>
                                    <button
                                        onClick={() => setAmmoniaWarningEnabled(!ammoniaWarningEnabled)}
                                        className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${ammoniaWarningEnabled ? 'bg-emerald-500' : 'bg-slate-300'} `}
                                    >
                                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${ammoniaWarningEnabled ? 'left-[22px]' : 'left-0.5'} `}></div>
                                    </button>
                                </div>
                                {ammoniaWarningEnabled && (
                                    <div className="flex items-center gap-3 pt-2">
                                        <span className="text-xs text-slate-500 shrink-0">高于</span>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={ammoniaThreshold}
                                            onChange={e => setAmmoniaThreshold(e.target.value)}
                                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                                        />
                                        <span className="text-xs text-slate-500 shrink-0">mg/L 时告警</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 数据管理 Tab */}
                    {activeTab === 'data' && (
                        <div className="space-y-5">
                            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                <p className="text-xs text-indigo-700 leading-relaxed">
                                    导出系统采集的历史数据用于离线分析。支持 CSV 和 Excel 格式，满足大数据二次处理和论文数据引用需求。
                                </p>
                            </div>

                            {/* 水质历史数据导出 */}
                            <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <Activity className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-800">水质预测历史数据</div>
                                        <div className="text-[11px] text-slate-400">包含水温、溶氧、pH、氨氮 等全量时序数据</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-2 bg-slate-50 rounded-lg">
                                        <div className="text-lg font-bold text-slate-800">1,440</div>
                                        <div className="text-[10px] text-slate-400">今日采样点</div>
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded-lg">
                                        <div className="text-lg font-bold text-slate-800">43,200</div>
                                        <div className="text-[10px] text-slate-400">本月数据量</div>
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded-lg">
                                        <div className="text-lg font-bold text-emerald-600">98.7%</div>
                                        <div className="text-[10px] text-slate-400">数据完整率</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleExport('wq-csv')}
                                        disabled={isExporting !== null}
                                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        {isExporting === 'wq-csv' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                        导出 CSV
                                    </button>
                                    <button
                                        onClick={() => handleExport('wq-xlsx')}
                                        disabled={isExporting !== null}
                                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        {isExporting === 'wq-xlsx' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                                        导出 Excel
                                    </button>
                                </div>
                            </div>

                            {/* AI 咨询记录导出 */}
                            <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-800">AI 咨询对话记录</div>
                                        <div className="text-[11px] text-slate-400">含问题、回答、RAG 引用来源及响应耗时</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-2 bg-slate-50 rounded-lg">
                                        <div className="text-lg font-bold text-slate-800">47</div>
                                        <div className="text-[10px] text-slate-400">对话总数</div>
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded-lg">
                                        <div className="text-lg font-bold text-slate-800">2.1s</div>
                                        <div className="text-[10px] text-slate-400">平均响应</div>
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded-lg">
                                        <div className="text-lg font-bold text-purple-600">85%</div>
                                        <div className="text-[10px] text-slate-400">RAG 命中率</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleExport('chat-csv')}
                                        disabled={isExporting !== null}
                                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        {isExporting === 'chat-csv' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                        导出 CSV
                                    </button>
                                    <button
                                        onClick={() => handleExport('chat-xlsx')}
                                        disabled={isExporting !== null}
                                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        {isExporting === 'chat-xlsx' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                                        导出 Excel
                                    </button>
                                </div>
                            </div>

                            {/* 行情数据导出 */}
                            <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                        <HardDrive className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-800">市场行情历史数据</div>
                                        <div className="text-[11px] text-slate-400">含各规格蟹种在不同产区的价格时序数据</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleExport('market-csv')}
                                        disabled={isExporting !== null}
                                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        {isExporting === 'market-csv' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                        导出 CSV
                                    </button>
                                    <button
                                        onClick={() => handleExport('market-xlsx')}
                                        disabled={isExporting !== null}
                                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        {isExporting === 'market-xlsx' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                                        导出 Excel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 系统日志 Tab */}
                    {activeTab === 'logs' && (
                        <div className="space-y-5">
                            <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700">
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    系统运行日志实时记录 API 调用链路、数据库检索耗时、传感器往返延迟等关键性能指标，用于系统行为审计与性能瓶颈定位。
                                </p>
                            </div>

                            {/* API 调用统计面板 */}
                            <div className="p-4 bg-white rounded-xl border border-slate-200">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <Cpu className="w-3.5 h-3.5" /> 今日 API 调用统计
                                </h4>
                                <div className="space-y-2">
                                    {apiStats.map((stat, idx) => (
                                        <div key={idx} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                                            <span className="text-xs font-medium text-slate-700">{stat.name}</span>
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs text-slate-500">{stat.count} 次</span>
                                                <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{stat.avgLatency}</span>
                                                {stat.quota !== '—' && (
                                                    <div className="w-16">
                                                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: stat.quota }}></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 实时日志流 */}
                            <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                        <span className="text-xs font-bold text-slate-300">实时运行日志</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-mono">tail -f system.log</span>
                                </div>
                                <div className="p-3 max-h-[320px] overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5">
                                    {systemLogs.map((log, idx) => (
                                        <div key={idx} className="flex items-start gap-2 py-1 px-2 rounded hover:bg-slate-800/50">
                                            <span className="text-slate-500 shrink-0">{log.time}</span>
                                            <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold ${log.level === 'ERROR' ? 'bg-red-500/20 text-red-400' :
                                                log.level === 'WARN' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-emerald-500/20 text-emerald-400'
                                                } `}>
                                                {log.level}
                                            </span>
                                            <span className="text-blue-400 shrink-0">[{log.module}]</span>
                                            <span className="text-slate-300 flex-1">{log.message}</span>
                                            <span className="text-slate-500 shrink-0">{log.latency}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 系统资源概览 */}
                            <div className="p-4 bg-white rounded-xl border border-slate-200">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <HardDrive className="w-3.5 h-3.5" /> 系统资源概览
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <div className="text-[10px] text-slate-400 mb-1">数据库大小</div>
                                        <div className="text-sm font-bold text-slate-800">24.6 MB</div>
                                        <div className="text-[10px] text-slate-400">SQLite (WAL mode)</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <div className="text-[10px] text-slate-400 mb-1">向量库规模</div>
                                        <div className="text-sm font-bold text-slate-800">1,247 条</div>
                                        <div className="text-[10px] text-slate-400">ChromaDB Embedding</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <div className="text-[10px] text-slate-400 mb-1">API 正常运行</div>
                                        <div className="text-sm font-bold text-emerald-600">99.8%</div>
                                        <div className="text-[10px] text-slate-400">近 7 天可用率</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <div className="text-[10px] text-slate-400 mb-1">平均响应延迟</div>
                                        <div className="text-sm font-bold text-slate-800">1.8s</div>
                                        <div className="text-[10px] text-slate-400">P95 分位延迟</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer with Save button */}
                <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSaving ? '保存中...' : '保存配置'}
                    </button>
                </div>

                {/* Toast Notification */}
                {showToast && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300 z-50">
                        <CheckCircle className="w-5 h-5" />
                        设置已成功保存！
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
