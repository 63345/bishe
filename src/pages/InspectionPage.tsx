import React, { useState, useMemo } from 'react';
import {
    Search, RefreshCw, Plus, Download, Eye, Edit, Sparkles,
    ChevronLeft, ChevronRight, ClipboardList, AlertTriangle, X, Loader2
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

// ========== 类型定义 ==========
interface InspectionRecord {
    id: number;
    time: string;
    pondId: string;
    inspector: string;
    waterAndGrass: string;
    crabActivity: string;
    equipmentStatus: string;
    evaluation: '正常' | '需关注' | '严重报警';
}

// ========== Mock 数据 ==========
const MOCK_DATA: InspectionRecord[] = [
    {
        id: 1,
        time: '2026-03-22 06:30',
        pondId: '1号塘',
        inspector: '王建国',
        waterAndGrass: '水色清绿透亮，透明度约35cm；伊乐藻长势良好，覆盖率约60%，未见漂浮腐烂',
        crabActivity: '河蟹摄食旺盛，前日投喂饲料2小时内基本吃完；未见趴边、上岸等异常行为',
        equipmentStatus: '增氧机运转正常，水泵出水流量稳定，进排水口无堵塞',
        evaluation: '正常',
    },
    {
        id: 2,
        time: '2026-03-22 06:45',
        pondId: '2号塘',
        inspector: '李芳',
        waterAndGrass: '水色发红偏浑浊，透明度不足20cm；水草有大面积腐烂迹象，根部发黑',
        crabActivity: '发现约15%河蟹白天趴边上岸，部分蟹体表附着黄绿色丝状藻类，摄食量明显下降',
        equipmentStatus: '1号增氧机叶轮异响，转速不稳；水泵正常',
        evaluation: '严重报警',
    },
    {
        id: 3,
        time: '2026-03-22 07:00',
        pondId: '3号塘',
        inspector: '张伟',
        waterAndGrass: '水色淡黄微绿，透明度约30cm；轮叶黑藻生长正常，局部有少量青苔附着',
        crabActivity: '河蟹活动正常，夜间巡塘观察到沿塘边觅食，摄食量正常',
        equipmentStatus: '所有设备运行正常，溶氧仪读数5.8mg/L',
        evaluation: '正常',
    },
    {
        id: 4,
        time: '2026-03-21 17:00',
        pondId: '1号塘',
        inspector: '王建国',
        waterAndGrass: '水色正常偏绿，轻微起泡沫；水草覆盖率正常但部分区域密度过高需要疏理',
        crabActivity: '少量河蟹在食台附近聚集，环沟处发现2只软壳蟹，疑似脱壳期开始',
        equipmentStatus: '增氧机正常；排水口滤网有少量杂物需清理',
        evaluation: '需关注',
    },
    {
        id: 5,
        time: '2026-03-21 06:30',
        pondId: '2号塘',
        inspector: '李芳',
        waterAndGrass: '水色微黄，透明度约28cm；水草覆盖率约55%，局部伊乐藻顶部开始发白',
        crabActivity: '河蟹活动正常，饵料台上残饵偏多，建议适当减少投喂量',
        equipmentStatus: '所有设备运行正常',
        evaluation: '需关注',
    },
];

// ========== 状态选项 ==========
const STATUS_OPTIONS = ['全部', '正常', '需关注', '严重报警'];

// ========== 综合评估 Tag 渲染 ==========
function EvaluationTag({ value }: { value: InspectionRecord['evaluation'] }) {
    const config: Record<string, string> = {
        '正常': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        '需关注': 'bg-orange-100 text-orange-700 border-orange-200',
        '严重报警': 'bg-red-100 text-red-700 border-red-200',
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border ${config[value] || ''} ${value === '严重报警' ? 'animate-pulse' : ''}`}>
            {value === '严重报警' && <AlertTriangle className="w-3 h-3" />}
            {value}
        </span>
    );
}

// ========== 主组件 ==========
export default function InspectionPage() {
    // 全局设置
    const { pondOptions } = useSettings();
    const PONDS = ['全部', ...pondOptions];

    // 数据状态
    const [records, setRecords] = useState<InspectionRecord[]>(MOCK_DATA);

    // 弹窗状态
    const [dialogType, setDialogType] = useState<'add' | 'edit' | 'view' | 'ai' | null>(null);
    const [selectedRecord, setSelectedRecord] = useState<InspectionRecord | null>(null);
    const [form, setForm] = useState<Partial<InspectionRecord>>({});
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState('');

    // 搜索过滤状态
    const [filterPond, setFilterPond] = useState('全部');
    const [filterDate, setFilterDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('全部');
    const [appliedFilters, setAppliedFilters] = useState({ pond: '全部', date: '', status: '全部' });

    // 分页
    const PAGE_SIZE = 10;
    const [currentPage, setCurrentPage] = useState(1);

    // ========== 过滤逻辑 ==========
    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            const pondMatch = appliedFilters.pond === '全部' || r.pondId === appliedFilters.pond;
            const dateMatch = !appliedFilters.date || r.time.startsWith(appliedFilters.date);
            const statusMatch = appliedFilters.status === '全部' || r.evaluation === appliedFilters.status;
            return pondMatch && dateMatch && statusMatch;
        });
    }, [records, appliedFilters]);

    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
    const pagedRecords = filteredRecords.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // ========== 搜索 & 重置 ==========
    const handleSearch = () => {
        setAppliedFilters({ pond: filterPond, date: filterDate, status: filterStatus });
        setCurrentPage(1);
    };
    const handleReset = () => {
        setFilterPond('全部');
        setFilterDate('');
        setFilterStatus('全部');
        setAppliedFilters({ pond: '全部', date: '', status: '全部' });
        setCurrentPage(1);
    };

    // ========== 弹窗控制 ==========
    const openAddDialog = () => {
        setForm({ pondId: pondOptions.length > 0 ? pondOptions[0] : '1号塘', inspector: '', waterAndGrass: '', crabActivity: '', equipmentStatus: '', evaluation: '正常' });
        setDialogType('add');
    };

    const openEditDialog = (record: InspectionRecord) => {
        setSelectedRecord(record);
        setForm({
            pondId: record.pondId, inspector: record.inspector, waterAndGrass: record.waterAndGrass,
            crabActivity: record.crabActivity, equipmentStatus: record.equipmentStatus, evaluation: record.evaluation
        });
        setDialogType('edit');
    };

    const openViewDialog = (record: InspectionRecord) => {
        setSelectedRecord(record);
        setDialogType('view');
    };

    const openAiDialog = (record: InspectionRecord) => {
        setSelectedRecord(record);
        setDialogType('ai');
        setIsAiLoading(true);
        setAiResponse('');
        // 模拟 AI 接口延迟请求
        setTimeout(() => {
            setIsAiLoading(false);
            setAiResponse(`基于大模型知识库与当前预警模型对【${record.pondId}】的巡视记录进行深度分析：\n\n1. 环境异常判断\n根据记录“${record.waterAndGrass}”等描述：判定水体当前的透明度与藻类平衡度${record.evaluation === '正常' ? '处于健康水平' : '存在风险隐患'}。夜间仍有必要检测溶解氧的绝对值，防止翻塘。\n\n2. 动物行为分析\n根据记录“${record.crabActivity}”：判定当前大闸蟹摄食量与应激水平${record.evaluation === '严重报警' ? '高度异常，需紧急投放抗应激药物' : '符合对应生长周期的常规表现'}。\n\n3. AI 总体建议\n当前蟹塘综合状态为【${record.evaluation}】，整体建议为${record.evaluation === '正常' ? '“平稳投喂，定期泼洒益生菌”' : '“减少乃至停止饲料投喂，检查水底氨氮并加强增氧”'}。`);
        }, 1500);
    };

    const submitForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (dialogType === 'add') {
            const newRecord: InspectionRecord = {
                id: Date.now(),
                time: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-').slice(0, 16),
                ...form as any
            };
            setRecords([newRecord, ...records]);
        } else if (dialogType === 'edit' && selectedRecord) {
            setRecords(records.map(r => r.id === selectedRecord.id ? { ...r, ...form } as InspectionRecord : r));
        }
        setDialogType(null);
    };

    // ========== 导出 CSV ==========
    const handleExport = () => {
        const headers = ['巡视时间', '蟹塘编号', '巡检人', '水色与水草', '河蟹动态', '设备状态', '综合评估'];
        const csvContent = [
            headers.join(','),
            ...filteredRecords.map(r => [
                r.time, r.pondId, r.inspector,
                `"${r.waterAndGrass}"`, `"${r.crabActivity}"`, `"${r.equipmentStatus}"`, r.evaluation,
            ].join(',')),
        ].join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `蟹塘巡视记录_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 bg-slate-50 min-h-full">
            {/* 页面标题 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-emerald-600" />
                        蟹塘日常巡视记录
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">记录每日蟹塘巡检情况，及时发现异常并预警</p>
                </div>
            </div>

            {/* ========== 顶部卡片：搜索过滤区 ========== */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                <div className="flex flex-wrap gap-4 items-end">
                    {/* 蟹塘选择 */}
                    <div>
                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">蟹塘选择</label>
                        <select
                            value={filterPond}
                            onChange={e => setFilterPond(e.target.value)}
                            className="w-36 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-slate-600 bg-white"
                        >
                            {PONDS.map(p => <option key={p}>{p}</option>)}
                        </select>
                    </div>

                    {/* 巡视日期 */}
                    <div>
                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">巡视日期</label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={e => setFilterDate(e.target.value)}
                            className="w-44 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-slate-600"
                        />
                    </div>

                    {/* 异常状态 */}
                    <div>
                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">异常状态</label>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="w-36 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-slate-600 bg-white"
                        >
                            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* 按钮组 */}
                    <div className="flex gap-2 ml-auto">
                        <button
                            onClick={handleSearch}
                            className="px-4 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition shadow-sm flex items-center gap-1.5 font-medium"
                        >
                            <Search className="w-3.5 h-3.5" />
                            查询
                        </button>
                        <button
                            onClick={handleReset}
                            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            重置
                        </button>
                    </div>
                </div>
            </div>

            {/* ========== 底部卡片：操作区与数据表格 ========== */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                {/* 顶部操作栏 */}
                <div className="p-4 flex flex-wrap gap-3 border-b border-slate-100">
                    <button onClick={openAddDialog} className="px-4 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition shadow-sm flex items-center gap-1.5 font-medium">
                        <Plus className="w-4 h-4" />
                        记录今日巡视
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-4 py-1.5 bg-white border border-slate-300 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5"
                    >
                        <Download className="w-4 h-4" />
                        导出巡视日志
                    </button>
                </div>

                {/* 数据表格 */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 sticky top-0 z-[1]">
                            <tr>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">巡视时间</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">蟹塘编号</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">巡检人</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap min-w-[200px]">水色与水草</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap min-w-[200px]">河蟹动态</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap min-w-[160px]">设备状态</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">综合评估</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pagedRecords.map(record => (
                                <tr
                                    key={record.id}
                                    className={`hover:bg-slate-50/50 transition-colors ${record.evaluation === '严重报警' ? 'bg-red-50/30' : ''}`}
                                >
                                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-mono text-xs">{record.time}</td>
                                    <td className="py-3 px-4">
                                        <span className="px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
                                            {record.pondId}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{record.inspector}</td>
                                    <td className="py-3 px-4 text-slate-600 text-xs leading-relaxed max-w-[260px]">
                                        <p className="line-clamp-2">{record.waterAndGrass}</p>
                                    </td>
                                    <td className="py-3 px-4 text-slate-600 text-xs leading-relaxed max-w-[260px]">
                                        <p className="line-clamp-2">{record.crabActivity}</p>
                                    </td>
                                    <td className="py-3 px-4 text-slate-600 text-xs leading-relaxed max-w-[200px]">
                                        <p className="line-clamp-2">{record.equipmentStatus}</p>
                                    </td>
                                    <td className="py-3 px-4">
                                        <EvaluationTag value={record.evaluation} />
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3 whitespace-nowrap">
                                            <button onClick={() => openViewDialog(record)} className="text-blue-600 hover:text-blue-800 text-sm transition flex items-center gap-1">
                                                <Eye className="w-3.5 h-3.5" />查看详情
                                            </button>
                                            <button onClick={() => openAiDialog(record)} className="text-emerald-600 hover:text-emerald-800 text-sm transition flex items-center gap-1 font-semibold">
                                                <Sparkles className="w-3.5 h-3.5" />AI 建议
                                            </button>
                                            <button onClick={() => openEditDialog(record)} className="text-slate-500 hover:text-blue-600 text-sm transition flex items-center gap-1">
                                                <Edit className="w-3.5 h-3.5" />编辑
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredRecords.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center text-slate-400">
                                        <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                        未找到匹配的巡视记录
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 分页 */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 bg-slate-50/50">
                    <div>共 <span className="font-medium text-slate-700">{filteredRecords.length}</span> 条记录</div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                            className="px-2 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1 border rounded font-medium transition-colors ${currentPage === page
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                    : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-600'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="px-2 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ========== 弹窗组件 ========== */}

            {/* 1. 新增/编辑 记录弹窗 */}
            {(dialogType === 'add' || dialogType === 'edit') && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDialogType(null)}></div>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl z-10 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-800">
                                {dialogType === 'add' ? '记录今日巡视' : '编辑巡视记录'}
                            </h2>
                            <button onClick={() => setDialogType(null)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <form id="inspectionForm" onSubmit={submitForm} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1.5 font-medium">蟹塘编号 <span className="text-red-500">*</span></label>
                                        <select required value={form.pondId || ''} onChange={e => setForm({ ...form, pondId: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-slate-700 bg-white">
                                            {PONDS.filter(p => p !== '全部').map(p => <option key={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1.5 font-medium">巡检人 <span className="text-red-500">*</span></label>
                                        <input required type="text" value={form.inspector || ''} onChange={e => setForm({ ...form, inspector: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-slate-700" placeholder="如：王芳" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1.5 font-medium">水色与水草状况 <span className="text-red-500">*</span></label>
                                    <textarea required rows={2} value={form.waterAndGrass || ''} onChange={e => setForm({ ...form, waterAndGrass: e.target.value })} placeholder="描述透明度、水草覆盖率及生长状况..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-slate-700 resize-none" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1.5 font-medium">河蟹活动动态 <span className="text-red-500">*</span></label>
                                    <textarea required rows={2} value={form.crabActivity || ''} onChange={e => setForm({ ...form, crabActivity: e.target.value })} placeholder="描述摄食、活动及蜕壳情况..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-slate-700 resize-none" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1.5 font-medium">设备运行情况 <span className="text-red-500">*</span></label>
                                    <textarea required rows={2} value={form.equipmentStatus || ''} onChange={e => setForm({ ...form, equipmentStatus: e.target.value })} placeholder="描述增氧机、水泵等运转情况..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-slate-700 resize-none" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1.5 font-medium">综合评估 <span className="text-red-500">*</span></label>
                                    <select required value={form.evaluation || '正常'} onChange={e => setForm({ ...form, evaluation: e.target.value as any })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-slate-700 bg-white">
                                        <option value="正常">正常</option>
                                        <option value="需关注">需关注</option>
                                        <option value="严重报警">严重报警</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
                            <button type="button" onClick={() => setDialogType(null)} className="px-5 py-2 text-sm border border-slate-300 rounded-lg hover:bg-white bg-slate-50 text-slate-600 transition shadow-sm font-medium">取消</button>
                            <button type="submit" form="inspectionForm" className="px-6 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-md font-medium">
                                {dialogType === 'add' ? '保存记录' : '保存修改'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. 查看详情弹窗 */}
            {dialogType === 'view' && selectedRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDialogType(null)}></div>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl z-10 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-emerald-600" />
                                巡视详情：{selectedRecord.pondId}
                            </h2>
                            <button onClick={() => setDialogType(null)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div><span className="text-slate-500 mr-2">巡视时间:</span><span className="font-semibold text-slate-800">{selectedRecord.time}</span></div>
                                <div><span className="text-slate-500 mr-2">巡视人员:</span><span className="font-semibold text-slate-800">{selectedRecord.inspector}</span></div>
                                <div><span className="text-slate-500 mr-2">当前评估:</span><EvaluationTag value={selectedRecord.evaluation} /></div>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-700 mb-2 pb-1 border-b border-slate-100">水色与水草状况</h3>
                                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{selectedRecord.waterAndGrass}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-700 mb-2 pb-1 border-b border-slate-100">河蟹摄食及活动动态</h3>
                                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{selectedRecord.crabActivity}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-700 mb-2 pb-1 border-b border-slate-100">设施设备运行情况</h3>
                                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{selectedRecord.equipmentStatus}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. AI 建议分析弹窗 */}
            {dialogType === 'ai' && selectedRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDialogType(null)}></div>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl z-10 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-emerald-800 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-emerald-600" />
                                大模型智能巡查分析：{selectedRecord.pondId}
                            </h2>
                            <button onClick={() => setDialogType(null)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto bg-gradient-to-b from-emerald-50/50 to-white min-h-[300px]">
                            {isAiLoading ? (
                                <div className="py-16 flex flex-col items-center justify-center">
                                    <div className="relative">
                                        <div className="w-16 h-16 border-4 border-emerald-100 rounded-full"></div>
                                        <div className="w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                                        <Sparkles className="w-6 h-6 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                                    </div>
                                    <p className="mt-6 text-emerald-700 font-medium">大模型正在结合知识库分析巡视记录...</p>
                                    <p className="mt-2 text-xs text-emerald-600/60 max-w-xs text-center">系统正在综合评估水色变化、脱壳期特征及相关设备风险</p>
                                </div>
                            ) : (
                                <div className="prose prose-sm prose-emerald max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {aiResponse}
                                </div>
                            )}
                        </div>
                        {!isAiLoading && (
                            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end rounded-b-xl">
                                <button onClick={() => setDialogType(null)} className="px-6 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-md font-medium">
                                    关闭分析报告
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
