import React, { useState, useMemo } from 'react';
import {
    Search, RefreshCcw, Plus, Sparkles, Download,
    ChevronLeft, ChevronRight, FileText, QrCode, Trash2, Award,
    X, Loader2, Camera, CheckCircle
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

// ========== 类型定义 ==========
interface QualityRecord {
    id: number;
    batchNo: string;
    pondCode: string;
    spec: '公蟹' | '母蟹';
    avgWeight: number; // 两
    fullness: number; // 百分比 0-100
    rating: '特级（蟹王/后）' | '一级精品' | '二级统货' | '不合格';
    inspector: string;
    inspectedAt: string;
}

// ========== Mock 数据 ==========
const MOCK_DATA: QualityRecord[] = [
    {
        id: 1,
        batchNo: 'QC-20261015-01',
        pondCode: 'T-01',
        spec: '公蟹',
        avgWeight: 4.5,
        fullness: 92,
        rating: '特级（蟹王/后）',
        inspector: '张三',
        inspectedAt: '2026-10-15 09:30',
    },
    {
        id: 2,
        batchNo: 'QC-20261015-02',
        pondCode: 'T-02',
        spec: '母蟹',
        avgWeight: 2.5,
        fullness: 75,
        rating: '二级统货',
        inspector: '李四',
        inspectedAt: '2026-10-15 10:45',
    },
    {
        id: 3,
        batchNo: 'QC-20261014-03',
        pondCode: 'T-01',
        spec: '母蟹',
        avgWeight: 3.2,
        fullness: 85,
        rating: '一级精品',
        inspector: '王五',
        inspectedAt: '2026-10-14 14:20',
    },
    {
        id: 4,
        batchNo: 'QC-20261014-04',
        pondCode: 'T-03',
        spec: '公蟹',
        avgWeight: 2.8,
        fullness: 60,
        rating: '不合格',
        inspector: '赵六',
        inspectedAt: '2026-10-14 16:10',
    },
    {
        id: 5,
        batchNo: 'QC-20261013-05',
        pondCode: 'T-04',
        spec: '公蟹',
        avgWeight: 5.0,
        fullness: 96,
        rating: '特级（蟹王/后）',
        inspector: '孙七',
        inspectedAt: '2026-10-13 08:50',
    },
];

const RATING_OPTIONS = ['全部', '特级（蟹王/后）', '一级精品', '二级统货', '不合格'];

// ========== Tag 渲染器 ==========
function SpecTag({ spec }: { spec: '公蟹' | '母蟹' }) {
    if (spec === '公蟹') {
        return <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">公蟹</span>;
    }
    return <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">母蟹</span>;
}

function RatingTag({ rating }: { rating: string }) {
    if (rating === '特级（蟹王/后）') {
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 font-bold shadow-sm shadow-amber-200/50"><Award className="w-3 h-3" /> {rating}</span>;
    }
    if (rating === '一级精品') {
        return <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700">一级精品</span>;
    }
    if (rating === '二级统货') {
        return <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-700">二级统货</span>;
    }
    return <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-500 line-through">不合格</span>;
}

function FullnessProgress({ value }: { value: number }) {
    let label = '一般';
    let color = 'bg-blue-500';
    if (value >= 90) { label = '极佳'; color = 'bg-amber-500'; }
    else if (value >= 80) { label = '良好'; color = 'bg-emerald-500'; }
    else if (value < 65) { label = '较差'; color = 'bg-slate-400'; }

    return (
        <div className="w-full max-w-[120px]">
            <div className="flex justify-between items-end mb-1">
                <span className="text-xs font-medium text-slate-700">{label}</span>
                <span className="text-xs text-slate-500">{value}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }}></div>
            </div>
        </div>
    );
}

// ========== 主组件 ==========
export default function CrabQualityPage() {
    const { pondOptions } = useSettings();
    const POND_OPTIONS = ['全部', ...pondOptions];

    const [records, setRecords] = useState<QualityRecord[]>(MOCK_DATA);

    // 搜索筛选
    const [searchBatch, setSearchBatch] = useState('');
    const [searchPond, setSearchPond] = useState('全部');
    const [searchRating, setSearchRating] = useState('全部');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // 分页
    const PAGE_SIZE = 10;
    const [currentPage, setCurrentPage] = useState(1);

    // 弹窗状态
    const [dialogType, setDialogType] = useState<'add' | 'ai' | 'view' | 'qrcode' | null>(null);
    const [selectedRecord, setSelectedRecord] = useState<QualityRecord | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // 增加表单
    const emptyForm = {
        pondCode: 'T-01',
        spec: '公蟹' as '公蟹' | '母蟹',
        avgWeight: '',
        fullness: '',
        rating: '一级精品' as QualityRecord['rating'],
        inspector: '',
        inspectedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    const [form, setForm] = useState(emptyForm);

    // 筛选计算
    const filtered = useMemo(() => {
        return records.filter(r => {
            const batchMatch = !searchBatch || r.batchNo.toLowerCase().includes(searchBatch.toLowerCase());
            const pondMatch = searchPond === '全部' || r.pondCode === searchPond;
            const ratingMatch = searchRating === '全部' || r.rating === searchRating;
            const dateMatch = (!dateFrom || r.inspectedAt >= dateFrom) && (!dateTo || r.inspectedAt <= dateTo + ' 23:59');
            return batchMatch && pondMatch && ratingMatch && dateMatch;
        });
    }, [records, searchBatch, searchPond, searchRating, dateFrom, dateTo]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pagedItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleReset = () => {
        setSearchBatch('');
        setSearchPond('全部');
        setSearchRating('全部');
        setDateFrom('');
        setDateTo('');
        setCurrentPage(1);
    };

    // ========== 各种操作事件 ==========
    const openAddDialog = () => {
        setForm({ ...emptyForm, inspectedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') });
        setDialogType('add');
    };

    const openAIDialog = () => setDialogType('ai');

    const openViewDialog = (record: QualityRecord) => {
        setSelectedRecord(record);
        setDialogType('view');
    };

    const openQRDialog = (record: QualityRecord) => {
        setSelectedRecord(record);
        setDialogType('qrcode');
    };

    const closeDialog = () => {
        setDialogType(null);
        setSelectedRecord(null);
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await new Promise(r => setTimeout(r, 800)); // 模拟请求

        const newRecord: QualityRecord = {
            id: Date.now(),
            batchNo: `QC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(records.length + 1).padStart(3, '0')}`,
            pondCode: form.pondCode,
            spec: form.spec,
            avgWeight: parseFloat(form.avgWeight) || 0,
            fullness: parseInt(form.fullness) || 0,
            rating: form.rating,
            inspector: form.inspector,
            inspectedAt: form.inspectedAt,
        };
        setRecords([newRecord, ...records]);
        setIsSaving(false);
        closeDialog();
    };

    const handleAIProcess = async () => {
        setIsSaving(true);
        await new Promise(r => setTimeout(r, 2000)); // 模拟AI识别
        const newRecord: QualityRecord = {
            id: Date.now(),
            batchNo: `QC-AI-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
            pondCode: 'T-01',
            spec: Math.random() > 0.5 ? '公蟹' : '母蟹',
            avgWeight: (Math.random() * 3 + 2).toFixed(1) as any * 1,
            fullness: Math.floor(Math.random() * 30 + 70),
            rating: '特级（蟹王/后）',
            inspector: 'AI 质检机器人',
            inspectedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        };
        setRecords([newRecord, ...records]);
        setIsSaving(false);
        closeDialog();
    };

    const handleExport = () => {
        const headers = ['批次号', '来源蟹塘', '抽检规格', '平均体重(两)', '膏黄饱满度(%)', '评定等级', '质检员', '检测时间'];
        const rows = filtered.map(r => [
            r.batchNo, r.pondCode, r.spec, r.avgWeight, r.fullness, r.rating, r.inspector, r.inspectedAt
        ]);
        const csv = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `商品蟹质检报告_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    const handleDelete = (id: number) => {
        if (confirm('确定要删除该抽检记录吗？此操作不可恢复。')) {
            setRecords(records.filter(r => r.id !== id));
        }
    };

    return (
        <div className="p-6 bg-slate-50 min-h-full space-y-5">
            {/* ===== 页面标题 ===== */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 rounded-xl">
                    <Award className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800">商品蟹品质检测与评级</h1>
                    <p className="text-slate-500 text-sm mt-0.5">记录抽样检测数据，自动评估品质等级，支持生成一蟹一码防伪溯源</p>
                </div>
            </div>

            {/* ===== 搜索过滤卡片 ===== */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[160px]">
                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">检测批次号</label>
                        <input
                            value={searchBatch}
                            onChange={e => setSearchBatch(e.target.value)}
                            placeholder="请输入批次号"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">来源蟹塘</label>
                        <select
                            value={searchPond}
                            onChange={e => setSearchPond(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                        >
                            {POND_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[160px]">
                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">评定等级</label>
                        <select
                            value={searchRating}
                            onChange={e => setSearchRating(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                        >
                            {RATING_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="flex-[2] min-w-[280px]">
                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">检测时间</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                            />
                            <span className="text-slate-400 text-xs shrink-0">至</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button onClick={() => setCurrentPage(1)} className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-blue-600/20">
                            <Search className="w-4 h-4" /> 查询
                        </button>
                        <button onClick={handleReset} className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-lg transition-colors">
                            <RefreshCcw className="w-4 h-4" /> 重置
                        </button>
                    </div>
                </div>
            </div>

            {/* ===== 操作区与表格卡片 ===== */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100">
                {/* 操作栏 */}
                <div className="px-5 py-4 flex flex-wrap items-center justify-between border-b border-slate-100 gap-4">
                    <div className="flex items-center gap-2.5">
                        <button onClick={openAddDialog} className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-blue-900/20">
                            <Plus className="w-4 h-4" /> 新增抽检单
                        </button>
                        <button onClick={openAIDialog} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-lg transition-all shadow-sm shadow-purple-500/30">
                            <Sparkles className="w-4 h-4" /> AI 视觉智能分级
                        </button>
                        <button onClick={handleExport} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-emerald-600/20">
                            <Download className="w-4 h-4" /> 导出质检报告
                        </button>
                    </div>
                    <span className="text-xs text-slate-400">共 <span className="font-semibold text-slate-600">{filtered.length}</span> 个质检批次</span>
                </div>

                {/* 数据表格 */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50/80 text-slate-500">
                            <tr>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">批次号</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">来源蟹塘</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">抽检规格</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">平均体重(两)</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap min-w-[140px]">膏黄饱满度</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">评定等级</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">质检员</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">检测时间</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap text-center">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pagedItems.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-16 text-slate-400">
                                        <Award className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                        暂无抽检记录
                                    </td>
                                </tr>
                            ) : pagedItems.map(record => (
                                <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{record.batchNo}</td>
                                    <td className="py-3.5 px-4 font-semibold text-slate-800">{record.pondCode}</td>
                                    <td className="py-3.5 px-4"><SpecTag spec={record.spec} /></td>
                                    <td className="py-3.5 px-4 font-medium text-slate-700">{record.avgWeight}</td>
                                    <td className="py-3.5 px-4"><FullnessProgress value={record.fullness} /></td>
                                    <td className="py-3.5 px-4"><RatingTag rating={record.rating} /></td>
                                    <td className="py-3.5 px-4 text-slate-600">{record.inspector}</td>
                                    <td className="py-3.5 px-4 text-slate-400 text-xs whitespace-nowrap">{record.inspectedAt}</td>
                                    <td className="py-3.5 px-4 text-center">
                                        <div className="flex items-center justify-center gap-3">
                                            <button onClick={() => openViewDialog(record)} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                                                <FileText className="w-3.5 h-3.5" /> 查看报告
                                            </button>
                                            <button onClick={() => openQRDialog(record)} className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-800 transition-colors">
                                                <QrCode className="w-3.5 h-3.5" /> 生成防伪溯源码
                                            </button>
                                            <button onClick={() => handleDelete(record.id)} className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" /> 删除
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 分页 */}
                <div className="px-5 py-4 flex flex-wrap items-center justify-between border-t border-slate-100 gap-4">
                    <p className="text-xs text-slate-400">共 {filtered.length} 条，当前第 {currentPage}/{totalPages} 页</p>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => setCurrentPage(p)}
                                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === currentPage
                                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                                    : 'text-slate-500 hover:bg-slate-100'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ===== 各种弹窗 ===== */}

            {/* 弹窗：新增抽检单 */}
            {dialogType === 'add' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeDialog}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 bg-blue-900">
                            <h3 className="text-base font-bold text-white">新增质检抽检单</h3>
                            <button onClick={closeDialog} className="p-1.5 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5 text-white" /></button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1.5 font-medium">来源蟹塘 <span className="text-red-500">*</span></label>
                                    <select required value={form.pondCode} onChange={e => setForm({ ...form, pondCode: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 bg-white appearance-none cursor-pointer">
                                        {pondOptions.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1.5 font-medium">抽检规格 <span className="text-red-500">*</span></label>
                                    <select required value={form.spec} onChange={e => setForm({ ...form, spec: e.target.value as any })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 bg-white appearance-none cursor-pointer">
                                        <option value="公蟹">公蟹</option>
                                        <option value="母蟹">母蟹</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1.5 font-medium">平均体重 (两) <span className="text-red-500">*</span></label>
                                    <input required type="number" step="0.1" value={form.avgWeight} onChange={e => setForm({ ...form, avgWeight: e.target.value })} placeholder="如：4.5" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1.5 font-medium">膏黄饱满度 (%) <span className="text-red-500">*</span></label>
                                    <input required type="number" min="0" max="100" value={form.fullness} onChange={e => setForm({ ...form, fullness: e.target.value })} placeholder="如：95" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1.5 font-medium">评定等级 <span className="text-red-500">*</span></label>
                                    <select required value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value as any })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 bg-white appearance-none cursor-pointer">
                                        {RATING_OPTIONS.filter(r => r !== '全部').map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1.5 font-medium">质检员 <span className="text-red-500">*</span></label>
                                    <input required value={form.inspector} onChange={e => setForm({ ...form, inspector: e.target.value })} placeholder="质检员姓名" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button type="button" onClick={closeDialog} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">取消</button>
                                <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-blue-600/20 disabled:opacity-60">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {isSaving ? '保存中...' : '提交记录'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 弹窗：AI视觉智能分级 */}
            {dialogType === 'ai' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={closeDialog}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-center p-8">
                        {isSaving ? (
                            <div className="space-y-4 py-6">
                                <div className="relative w-20 h-20 mx-auto">
                                    <div className="absolute inset-0 border-4 border-purple-100 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
                                    <Sparkles className="w-8 h-8 text-purple-600 absolute inset-0 m-auto animate-pulse" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">正在分析图像特征...</h3>
                                <p className="text-sm text-slate-500">已识别背甲纹理、正在精确测算膏黄比例</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                                    <Camera className="w-10 h-10" />
                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                                        <Sparkles className="w-4 h-4 text-amber-500" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">AI 智能称重与评级</h3>
                                    <p className="text-sm text-slate-500 px-4">请将大闸蟹放置于高清摄像头下，AI 将自动分析重量、规格以及背甲特征并出具分级报告。</p>
                                </div>
                                <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-6 hover:bg-slate-100 transition-colors cursor-pointer" onClick={handleAIProcess}>
                                    <p className="text-sm font-semibold text-purple-600">点击此处或连接设备的拍照按钮</p>
                                </div>
                                <div className="pt-2">
                                    <button onClick={closeDialog} className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">取消操作</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 弹窗：查看报告 */}
            {dialogType === 'view' && selectedRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeDialog}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 bg-slate-800">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <FileText className="w-4 h-4" /> 质检报告详情
                            </h3>
                            <button onClick={closeDialog} className="p-1.5 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5 text-white" /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">检验批次</p>
                                    <p className="font-mono font-bold text-slate-800 text-lg">{selectedRecord.batchNo}</p>
                                </div>
                                <div className="text-right">
                                    <RatingTag rating={selectedRecord.rating} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">来源蟹塘</p>
                                    <p className="font-semibold text-slate-800">{selectedRecord.pondCode}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">抽检规格</p>
                                    <SpecTag spec={selectedRecord.spec} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">平均体重</p>
                                    <p className="font-semibold text-slate-800">{selectedRecord.avgWeight} <span className="text-xs text-slate-500 font-normal">两/只</span></p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">膏黄饱满度</p>
                                    <p className="font-semibold text-slate-800">{selectedRecord.fullness}%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">检验员</p>
                                    <p className="font-semibold text-slate-800">{selectedRecord.inspector}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">出具时间</p>
                                    <p className="text-sm text-slate-600">{selectedRecord.inspectedAt}</p>
                                </div>
                            </div>
                            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl flex items-center gap-2 text-sm border border-emerald-100">
                                <CheckCircle className="w-5 h-5 shrink-0" />
                                <p>该批次经质检符合市场流通标准，允许加施防伪蟹扣。</p>
                            </div>
                            <div className="flex justify-end gap-3 pt-3">
                                <button onClick={closeDialog} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">关闭</button>
                                <button onClick={() => { setDialogType('qrcode'); }} className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg transition-colors shadow-sm shadow-amber-500/20">
                                    <QrCode className="w-4 h-4" /> 生成溯源码
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 弹窗：防伪溯源码 */}
            {dialogType === 'qrcode' && selectedRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeDialog}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center">
                        <div className="pt-8 pb-4 px-6 relative">
                            <button onClick={closeDialog} className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X className="w-5 h-5" /></button>
                            <h3 className="text-xl font-black text-amber-600 mb-1 tracking-wider">防伪溯源蟹扣</h3>
                            <p className="text-xs text-slate-400 uppercase tracking-widest">{selectedRecord.batchNo}</p>
                        </div>
                        <div className="px-8 pb-6">
                            <div className="w-48 h-48 mx-auto bg-slate-100 flex items-center justify-center rounded-xl p-2 mb-4 border border-slate-200">
                                {/* 模拟一个二维码界面 */}
                                <QrCode className="w-full h-full text-slate-800 opacity-90" strokeWidth={1} />
                            </div>
                            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mb-4 text-left">
                                <p className="text-sm font-bold text-amber-900 flex items-center justify-between mb-1">
                                    <span>品种：长荡湖大闸蟹</span>
                                    <RatingTag rating={selectedRecord.rating} />
                                </p>
                                <p className="text-xs text-amber-800/70">规格：{selectedRecord.spec} {selectedRecord.avgWeight}两</p>
                                <p className="text-xs text-amber-800/70">产地直发：蟹塘 {selectedRecord.pondCode}</p>
                            </div>
                            <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm shadow-blue-600/30">
                                打印并激活防伪码
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
