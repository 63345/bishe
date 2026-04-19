import React, { useState } from 'react';
import {
    ShieldCheck,
    Search,
    Plus,
    RefreshCcw,
    QrCode,
    Download,
    FileText,
    X,
    Info,
    Activity,
    Fish,
    Award,
    Sparkles,
    ToggleLeft,
    ToggleRight,
    Smartphone
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';

// --- Types ---
interface TraceBatch {
    id: string;
    batchNo: string;
    pond: string;
    spec: string;
    completeness: number;
    status: 'pending' | 'generated' | 'expired';
    createTime: string;
}

// --- Mock Data ---
const initialBatches: TraceBatch[] = [
    {
        id: '1',
        batchNo: 'TR-20231015-001',
        pond: 'T-01',
        spec: '精品公蟹4.5两',
        completeness: 85,
        status: 'pending',
        createTime: '2023-10-15 09:30:00'
    },
    {
        id: '2',
        batchNo: 'TR-20231014-002',
        pond: 'T-02',
        spec: '特级母蟹3.5两',
        completeness: 100,
        status: 'generated',
        createTime: '2023-10-14 14:20:00'
    },
    {
        id: '3',
        batchNo: 'TR-20231010-003',
        pond: 'T-01',
        spec: '优选公蟹4.0两',
        completeness: 100,
        status: 'expired',
        createTime: '2023-10-10 11:15:00'
    }
];

const mockWaterQualityData = [
    { day: '第15天', do: 6.8 },
    { day: '第30天', do: 7.2 },
    { day: '第45天', do: 7.5 },
    { day: '第60天', do: 7.1 },
    { day: '第75天', do: 6.9 },
    { day: '第90天', do: 7.4 },
    { day: '第105天', do: 7.8 },
    { day: '第120天', do: 7.6 }
];

// --- Form Components ---
const ToggleSwitch = ({ checked, onChange, label }: { checked: boolean, onChange: () => void, label: string }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">{label}</span>
        </div>
        <button onClick={onChange} className="text-emerald-500 focus:outline-none">
            {checked ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
        </button>
    </div>
);

export default function TraceabilityPage() {
    const [batches, setBatches] = useState<TraceBatch[]>(initialBatches);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentBatch, setCurrentBatch] = useState<TraceBatch | null>(null);
    const [activeTab, setActiveTab] = useState('basic');

    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [showH5Modal, setShowH5Modal] = useState(false);
    const [currentActionBatch, setCurrentActionBatch] = useState<TraceBatch | null>(null);

    // Toggle states for demonstration
    const [toggles, setToggles] = useState<Record<string, boolean>>({
        basic: true,
        water: true,
        feed: false,
        quality: true,
        ai: true
    });

    const handleToggle = (tab: string) => {
        setToggles(prev => ({ ...prev, [tab]: !prev[tab] }));
    };

    const openDrawer = (batch: TraceBatch) => {
        setCurrentBatch(batch);
        setActiveTab('basic');
        setDrawerOpen(true);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        setTimeout(() => setCurrentBatch(null), 300); // Wait for transition
    };

    const StatusTag = ({ status }: { status: string }) => {
        switch (status) {
            case 'pending':
                return <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg">待配置</span>;
            case 'generated':
                return (
                    <span className="px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-600 rounded-lg shadow-[0_0_8px_rgba(52,211,153,0.5)] border border-emerald-200">
                        已生成
                    </span>
                );
            case 'expired':
                return <span className="px-2.5 py-1 text-xs font-medium bg-red-50 text-red-600 rounded-lg">已失效</span>;
            default:
                return null;
        }
    };

    const tabs = [
        { id: 'basic', label: '基础信息', icon: Info },
        { id: 'water', label: '水质环境', icon: Activity },
        { id: 'feed', label: '饵料投喂', icon: Fish },
        { id: 'quality', label: '品质质检', icon: Award },
        { id: 'ai', label: 'AI 风味评估', icon: Sparkles, highlight: true },
    ];

    const handleAddBatch = (e: React.FormEvent) => {
        e.preventDefault();
        const newBatch: TraceBatch = {
            id: Date.now().toString(),
            batchNo: `TR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-00${batches.length + 1}`,
            pond: 'T-03', // mock
            spec: '精品公蟹4.0两',
            completeness: 0,
            status: 'pending',
            createTime: new Date().toLocaleString()
        };
        setBatches([newBatch, ...batches]);
        setShowAddModal(false);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'basic':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <ToggleSwitch
                            checked={toggles.basic}
                            onChange={() => handleToggle('basic')}
                            label="向消费者展示基础溯源档案"
                        />
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500">蟹塘编号</label>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800">
                                    {currentBatch?.pond || 'T-01'} (生态洁净塘)
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500">蟹苗品种</label>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800">
                                    长江1号优质扣蟹
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500">养殖周期</label>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800">
                                    185天
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500">捕捞日期</label>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800">
                                    2023-10-14
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-500">养殖企业认证</label>
                            <div className="flex items-center gap-3 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                                <ShieldCheck className="w-8 h-8 text-blue-500" />
                                <div>
                                    <h4 className="font-semibold text-blue-900">阳澄湖原产地认证基地</h4>
                                    <p className="text-xs text-blue-600 mt-1">证书编号: YCH-2023-08942</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'water':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <ToggleSwitch
                            checked={toggles.water}
                            onChange={() => handleToggle('water')}
                            label="向消费者展示生长水质曲线"
                        />

                        <div className="bg-white border text-center relative overflow-hidden border-slate-200 rounded-xl p-6">
                            <div className="absolute top-0 right-0 p-3 flex -my-1 -mx-2 items-center rotate-12 justify-center opacity-20 pointer-events-none">
                                <Award className="w-24 h-24 text-emerald-500" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-emerald-500" />
                                生长期优质溶氧趋势 (均值: 7.3 mg/L)
                            </h3>
                            <div className="h-64 mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={mockWaterQualityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={['dataMin - 1', 'dataMax + 1']} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            labelStyle={{ color: '#64748b', fontWeight: 'bold' }}
                                        />
                                        <Line type="monotone" dataKey="do" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="溶氧量 (mg/L)" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl flex items-center gap-4">
                                <div className="bg-emerald-100 p-2 rounded-lg"><Award className="w-6 h-6 text-emerald-600" /></div>
                                <div>
                                    <div className="text-sm text-slate-500">优质水源天数</div>
                                    <div className="text-xl font-bold text-slate-800">180 天</div>
                                </div>
                            </div>
                            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-center gap-4">
                                <div className="bg-blue-100 p-2 rounded-lg"><Activity className="w-6 h-6 text-blue-600" /></div>
                                <div>
                                    <div className="text-sm text-slate-500">水质综合评分</div>
                                    <div className="text-xl font-bold text-slate-800">98 分 (优)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'feed':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <ToggleSwitch
                            checked={toggles.feed}
                            onChange={() => handleToggle('feed')}
                            label="向消费者展示核心饵料来源"
                        />

                        <div className="space-y-4">
                            {[
                                { name: '优质冰鲜带鱼', proportion: '45%', stage: '育肥期核心饵料' },
                                { name: '生态螺蛳', proportion: '30%', stage: '全周期基础底栖饵料' },
                                { name: '高蛋白配合饲料', proportion: '25%', stage: '生长期营养补充' }
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-white shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                            <Fish className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800">{item.name}</h4>
                                            <p className="text-xs text-slate-500 mt-1">{item.stage}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-slate-700">{item.proportion}</div>
                                        <div className="text-xs text-slate-400">投喂占比</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'quality':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <ToggleSwitch
                            checked={toggles.quality}
                            onChange={() => handleToggle('quality')}
                            label="向消费者展示权威质检报告"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-2">
                                <div className="text-sm font-medium text-slate-500">膏黄饱满度</div>
                                <div className="text-3xl font-bold text-orange-500">95%</div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                                    <div className="bg-orange-500 h-full w-[95%]" />
                                </div>
                            </div>
                            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-2">
                                <div className="text-sm font-medium text-slate-500">肥状度指数 (CF)</div>
                                <div className="text-3xl font-bold text-emerald-500">A+ 级</div>
                                <div className="text-xs text-slate-400 mt-2">高于同水域行业标准 12%</div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mt-6">
                            <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                食品安全检测项目
                            </h4>
                            <div className="space-y-3">
                                {['孔雀石绿及隐色孔雀石绿残留', '氯霉素残留检测', '恩诺沙星及环丙沙星残留', '重金属(铅、镉)及农残'].map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0 last:pb-0">
                                        <span className="text-sm text-slate-600">{item}</span>
                                        <span className="text-sm font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">未检出 (合格)</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'ai':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <ToggleSwitch
                            checked={toggles.ai}
                            onChange={() => handleToggle('ai')}
                            label="向消费者展示大模型智能生成的风味卡片"
                        />

                        <div className="relative rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-emerald-50 border border-indigo-100 p-8 shadow-sm overflow-hidden mt-4">
                            <div className="absolute top-10 right-10 flex space-x-2">
                                <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500"></span>
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <Sparkles className="w-8 h-8 text-indigo-500" />
                                    <h3 className="text-xl font-bold text-slate-800 tracking-widest">AI 风味数字鉴定书</h3>
                                </div>

                                <div className="bg-white/80 backdrop-blur-md border border-white rounded-xl p-6 shadow-sm text-slate-700 leading-relaxed font-light text-justify">
                                    <p className="indent-8 text-lg">
                                        基于该溯源批次长达 <span className="text-orange-600 font-bold">60 天的高蛋白冰鲜鱼与生态螺蛳复合投喂</span>，以及 <span className="text-emerald-600 font-bold">180天的优质伊乐藻生境</span>净化，系统综合水质、投喂及品质评估模型得出结论：该批次大闸蟹肉质极致清甜，肌肉纤维紧实富有弹性；<span className="text-amber-600 font-bold">蟹黄具有极其浓郁的坚果与奶油混合香气</span>，回味悠长。此批次属于本产季的顶配奢享级珍品。
                                    </p>
                                </div>

                                <div className="mt-6 flex gap-3 text-sm flex-wrap">
                                    <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200"># 坚果乳香</span>
                                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200"># 弹牙回甘</span>
                                    <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200"># 黄金比例脂膏</span>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-slate-400 text-center mt-4 flex justify-center items-center gap-1">
                            <Sparkles className="w-3 h-3" /> 本评估报告由大模型基于真实养殖数据动态生成
                        </p>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Top Card: Search & Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-4 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">溯源批次编号</label>
                            <div className="relative text-slate-500 focus-within:text-emerald-600">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="请输入批次编号"
                                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">关联蟹塘</label>
                            <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white">
                                <option value="">全部蟹塘</option>
                                <option value="T-01">T-01生长期塘</option>
                                <option value="T-02">T-02暂养塘</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">溯源状态</label>
                            <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white">
                                <option value="">全部状态</option>
                                <option value="pending">待配置</option>
                                <option value="generated">已生成</option>
                                <option value="expired">已失效</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3 h-[42px]">
                        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 font-medium transition-colors shadow-sm">
                            <Search className="w-4 h-4" />
                            查询
                        </button>
                        <button className="px-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors">
                            <RefreshCcw className="w-4 h-4" />
                            重置
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Card: Actions & Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden text-slate-800 flex flex-col h-full min-h-[500px]">
                {/* Action Bar */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                        <FileText className="w-5 h-5 text-emerald-500" />
                        批次管理列表
                    </h2>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm">
                            <Plus className="w-4 h-4" />
                            新增溯源批次
                        </button>
                        <button
                            onClick={() => { setCurrentActionBatch(null); setShowQRModal(true); }}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm">
                            <QrCode className="w-4 h-4" />
                            批量导出防伪码
                        </button>
                    </div>
                </div>

                {/* Table View */}
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
                            <tr>
                                <th className="p-4 font-semibold text-sm w-48">溯源批次号</th>
                                <th className="p-4 font-semibold text-sm w-32">关联蟹塘</th>
                                <th className="p-4 font-semibold text-sm w-48">产品规格</th>
                                <th className="p-4 font-semibold text-sm w-56">溯源信息完整度</th>
                                <th className="p-4 font-semibold text-sm w-32">状态</th>
                                <th className="p-4 font-semibold text-sm w-48">创建时间</th>
                                <th className="p-4 font-semibold text-sm w-64 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {batches.map((batch) => (
                                <tr key={batch.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="p-4 font-medium text-slate-800">{batch.batchNo}</td>
                                    <td className="p-4">
                                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-sm font-medium">{batch.pond}</span>
                                    </td>
                                    <td className="p-4 text-slate-600 text-sm">{batch.spec}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className={`h-1.5 rounded-full ${batch.completeness === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                    style={{ width: `${batch.completeness}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-semibold text-slate-500 w-8">{batch.completeness}%</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <StatusTag status={batch.status} />
                                    </td>
                                    <td className="p-4 text-sm text-slate-500">{batch.createTime}</td>
                                    <td className="p-4 text-right space-x-3">
                                        <button
                                            onClick={() => openDrawer(batch)}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors cursor-pointer"
                                        >
                                            档案配置
                                        </button>
                                        <button
                                            onClick={() => { setCurrentActionBatch(batch); setShowH5Modal(true); }}
                                            className="text-slate-600 hover:text-slate-800 text-sm font-medium transition-colors disabled:opacity-50" disabled={batch.status === 'pending'}>
                                            预览H5页
                                        </button>
                                        <button
                                            onClick={() => { setCurrentActionBatch(batch); setShowQRModal(true); }}
                                            className="text-emerald-600 hover:text-emerald-800 text-sm font-medium transition-colors disabled:opacity-50" disabled={batch.status === 'pending'}>
                                            生成防伪码
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {batches.length === 0 && (
                        <div className="text-center text-slate-500 py-16 flex flex-col items-center">
                            <FileText className="w-12 h-12 text-slate-200 mb-4" />
                            <p>暂无溯源批次数据</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Drawer (Overlay + Panel) */}
            {drawerOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={closeDrawer}
                    />

                    {/* Drawer Panel */}
                    <div className="relative w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 ease-out">
                        {/* Drawer Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                                    溯源档案配置设置
                                </h2>
                                <p className="text-sm text-slate-500 mt-1 font-medium">当前配置批次：<span className="text-blue-600">{currentBatch?.batchNo}</span></p>
                            </div>
                            <button
                                onClick={closeDrawer}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Drawer Body - Split View */}
                        <div className="flex flex-1 overflow-hidden">
                            {/* Sidebar Nav */}
                            <div className="w-48 bg-slate-50/80 border-r border-slate-100 flex flex-col p-3 space-y-1">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium w-full text-left
                        ${activeTab === tab.id
                                                ? tab.highlight
                                                    ? 'bg-gradient-to-r from-indigo-50 to-emerald-50 text-indigo-700 shadow-sm border border-indigo-100'
                                                    : 'bg-white shadow-sm border border-slate-100 text-blue-600'
                                                : 'text-slate-600 hover:bg-slate-200'
                                            }
                     `}
                                    >
                                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id && !tab.highlight ? 'text-blue-500' : ''}`} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Main Content Area */}
                            <div className="flex-1 p-8 overflow-y-auto bg-white/50 pattern-grid-lg">
                                {renderTabContent()}
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                            <button
                                onClick={closeDrawer}
                                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                            >
                                保存草稿
                            </button>
                            <button
                                onClick={() => {
                                    const newBatches = batches.map(b => b.id === currentBatch?.id ? { ...b, status: 'generated', completeness: 100 } : b);
                                    setBatches(newBatches as TraceBatch[]);
                                    closeDrawer();
                                }}
                                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium flex items-center gap-2 shadow-emerald-500/20 shadow-lg transition-all hover:-translate-y-0.5"
                            >
                                <QrCode className="w-4 h-4" />
                                生成最终溯源码
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}

            {/* Add Batch Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">新增溯源批次</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleAddBatch}>
                            <div className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">关联蟹塘</label>
                                    <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white" required>
                                        <option value="T-01">T-01 生态洁净塘</option>
                                        <option value="T-02">T-02 暂养池</option>
                                        <option value="T-03">T-03 成蟹养殖塘</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">产品规格</label>
                                    <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white" required>
                                        <option value="精品公蟹4.0两">精品公蟹4.0两</option>
                                        <option value="特级母蟹3.5两">特级母蟹3.5两</option>
                                        <option value="优选对蟹">优选对蟹 (公4.5/母3.5)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">预计生成数量</label>
                                    <input type="number" min="1" max="5000" defaultValue="500" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" required />
                                </div>
                            </div>
                            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">取消</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">确认创建</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQRModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowQRModal(false)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 animate-in zoom-in-95 duration-200 text-center overflow-hidden">
                        <div className="bg-emerald-500 p-6 text-white relative">
                            <button onClick={() => setShowQRModal(false)} className="absolute top-4 right-4 text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
                            <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-white opacity-90" />
                            <h3 className="text-xl font-bold">大闸蟹防伪溯源码</h3>
                            <p className="text-emerald-50 text-sm mt-1">{currentActionBatch ? currentActionBatch.batchNo : '全部已生成批次'}</p>
                        </div>
                        <div className="p-8 pb-10">
                            <div className="bg-white p-4 inline-block rounded-xl border-2 border-slate-100 shadow-sm relative">
                                {/* Real QR Code */}
                                <div className="w-48 h-48 bg-slate-50 flex items-center justify-center relative overflow-hidden rounded-lg">
                                    <QRCodeSVG
                                        value={currentActionBatch ? `https://dazhaxie.example.com/trace/${currentActionBatch.batchNo}` : "https://dazhaxie.example.com/trace/batch/all"}
                                        size={192}
                                        bgColor={"#f8fafc"}
                                        fgColor={"#0f172a"}
                                        level={"H"}
                                        includeMargin={false}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="bg-white p-1 rounded-lg shadow-md border border-slate-200">
                                            <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center font-bold text-white text-sm">蟹</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-slate-500 text-sm mt-6 mb-4">微信扫一扫 验真伪溯源信息</p>
                            <button className="w-full py-2.5 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                                <Download className="w-4 h-4" />
                                下载 {currentActionBatch ? '本批次防伪码' : '批量导出全部 (ZIP)'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* H5 Preview Modal */}
            {showH5Modal && currentActionBatch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowH5Modal(false)}></div>
                    <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-[320px] h-[650px] relative z-10 animate-in slide-in-from-bottom-[50px] duration-300 overflow-hidden border-8 border-slate-800">
                        {/* Mobile Status bar mock */}
                        <div className="h-6 w-full bg-emerald-600 absolute top-0 left-0 z-20 flex justify-center">
                            <div className="w-32 h-4 bg-slate-900 rounded-b-xl"></div>
                        </div>

                        {/* Mobile Content */}
                        <div className="w-full h-full bg-slate-50 overflow-y-auto pb-6 relative pt-6 scrollbar-hide">
                            <div className="bg-emerald-600 pt-6 pb-12 px-5 text-white rounded-b-3xl">
                                <h2 className="text-center font-bold text-lg mb-4">大闸蟹溯源档案</h2>
                                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                    <div className="font-mono text-sm opacity-90 mb-1">NO. {currentActionBatch.batchNo}</div>
                                    <div className="font-bold text-xl">{currentActionBatch.spec}</div>
                                </div>
                            </div>

                            <div className="px-4 -mt-6">
                                <div className="bg-white rounded-xl shadow-sm p-4 space-y-4 border border-slate-100">
                                    <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                                        <Award className="w-5 h-5 text-emerald-500" />
                                        <span className="font-bold text-slate-800">官方认证正品</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                                        <div className="text-slate-500">养殖塘口</div>
                                        <div className="text-right font-medium text-slate-800">生态一区 {currentActionBatch.pond}</div>
                                        <div className="text-slate-500">养殖周期</div>
                                        <div className="text-right font-medium text-slate-800">185 天</div>
                                        <div className="text-slate-500">水质评级</div>
                                        <div className="text-right font-medium text-emerald-600">优 (全周期)</div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm p-4 mt-4 border border-slate-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles className="w-5 h-5 text-indigo-500" />
                                        <span className="font-bold text-slate-800">AI 风味数字鉴定书</span>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed text-justify">
                                        基于该溯源批次长达60天的高蛋白冰鲜鱼与生态螺蛳复合投喂，以及180天的优质伊乐藻生境。该批次大闸蟹肉质极致清甜...
                                    </p>
                                    <div className="mt-3 flex gap-2 flex-wrap text-[10px]">
                                        <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded"># 坚果乳香</span>
                                        <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded"># 黄金比例</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Close Button out-of-frame */}
                        <button
                            onClick={() => setShowH5Modal(false)}
                            className="absolute -right-12 top-0 text-white hover:text-red-400 p-2"
                        >
                            <X className="w-8 h-8" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
