import React, { useState, useMemo } from 'react';
import {
    Search, RefreshCcw, Plus, Upload, Download,
    ChevronLeft, ChevronRight, Eye, Edit, Trash2, X, Loader2, Clipboard
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

// ========== 类型定义 ==========
interface FarmWorkRecord {
    id: number;
    recordCode: string;
    pondCode: string;
    workType: '饵料投喂' | '渔药施用' | '水质调控' | '底质改良' | '割草维护';
    materialDetail: string;
    operator: string;
    weather: string;
    executedAt: string;
}

// ========== Mock 数据 ==========
const today = '2026-03-22';
const yesterday = '2026-03-21';

const MOCK_DATA: FarmWorkRecord[] = [
    {
        id: 1,
        recordCode: 'WK-20260322-001',
        pondCode: 'T-01',
        workType: '饵料投喂',
        materialDetail: '全价颗粒饲料 20kg，沿塘四周均匀抛撒',
        operator: '张三',
        weather: '☀️ 晴天 26℃',
        executedAt: `${today} 06:30`,
    },
    {
        id: 2,
        recordCode: 'WK-20260321-002',
        pondCode: 'T-02',
        workType: '水质调控',
        materialDetail: '芽孢杆菌 5瓶，全池泼洒后持续增氧2小时',
        operator: '王五',
        weather: '⛅ 多云 28℃',
        executedAt: `${yesterday} 16:00`,
    },
    {
        id: 3,
        recordCode: 'WK-20260321-003',
        pondCode: 'T-01',
        workType: '渔药施用',
        materialDetail: '过硫酸氢钾复合盐 10包，针对底部区域局部泼洒',
        operator: '李四',
        weather: '🌧️ 阵雨 24℃',
        executedAt: `${yesterday} 09:15`,
    },
    {
        id: 4,
        recordCode: 'WK-20260320-004',
        pondCode: 'T-03',
        workType: '底质改良',
        materialDetail: '生石灰 200kg，干撒于塘底后注入新水浸泡',
        operator: '赵六',
        weather: '☀️ 晴天 30℃',
        executedAt: '2026-03-20 14:00',
    },
    {
        id: 5,
        recordCode: 'WK-20260319-005',
        pondCode: 'T-02',
        workType: '割草维护',
        materialDetail: '割除塘埂杂草约30m²，清理排水沟淤积物',
        operator: '孙七',
        weather: '⛅ 多云 27℃',
        executedAt: '2026-03-19 07:45',
    },
];

const WORK_TYPE_OPTIONS = ['全部', '饵料投喂', '渔药施用', '水质调控', '底质改良', '割草维护'];

const WEATHER_TYPE_OPTIONS = [
    { label: '☀️ 晴天', value: '☀️ 晴天' },
    { label: '⛅ 多云', value: '⛅ 多云' },
    { label: '🌫️ 阴天', value: '🌫️ 阴天' },
    { label: '🌧️ 小雨', value: '🌧️ 小雨' },
    { label: '🌧️ 阵雨', value: '🌧️ 阵雨' },
    { label: '⛈️ 雷阵雨', value: '⛈️ 雷阵雨' },
    { label: '🌬️ 大风', value: '🌬️ 大风' },
    { label: '❄️ 雪', value: '❄️ 雪' },
];

// ========== 作业类型 Tag ==========
function WorkTypeTag({ value }: { value: string }) {
    const map: Record<string, string> = {
        '饵料投喂': 'bg-blue-100 text-blue-700',
        '渔药施用': 'bg-red-100 text-red-700',
        '水质调控': 'bg-emerald-100 text-emerald-700',
        '底质改良': 'bg-amber-100 text-amber-700',
        '割草维护': 'bg-teal-100 text-teal-700',
    };
    return (
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${map[value] || 'bg-slate-100 text-slate-600'}`}>
            {value}
        </span>
    );
}

// ========== 主组件 ==========
export default function FarmWorkPage() {
    const { pondOptions } = useSettings();
    const POND_OPTIONS = ['全部', ...pondOptions];

    // 数据
    const [records, setRecords] = useState<FarmWorkRecord[]>(MOCK_DATA);

    // 搜索筛选
    const [searchPond, setSearchPond] = useState('全部');
    const [searchType, setSearchType] = useState('全部');
    const [searchOperator, setSearchOperator] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // 分页
    const PAGE_SIZE = 10;
    const [currentPage, setCurrentPage] = useState(1);

    // 弹窗
    const [dialogType, setDialogType] = useState<'add' | 'edit' | 'view' | null>(null);
    const [selectedRecord, setSelectedRecord] = useState<FarmWorkRecord | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // 表单
    const emptyForm = {
        pondCode: 'T-01',
        workType: '饵料投喂' as FarmWorkRecord['workType'],
        materialDetail: '',
        operator: '',
        weatherType: '☀️ 晴天',
        weatherTemp: '26',
        executedAt: '',
    };
    const [form, setForm] = useState(emptyForm);

    // ========== 筛选与分页 ==========
    const filtered = useMemo(() => {
        return records.filter(r => {
            const pondMatch = searchPond === '全部' || r.pondCode === searchPond;
            const typeMatch = searchType === '全部' || r.workType === searchType;
            const operatorMatch = !searchOperator || r.operator.includes(searchOperator);
            const dateMatch = (!dateFrom || r.executedAt >= dateFrom) && (!dateTo || r.executedAt <= dateTo + ' 23:59');
            return pondMatch && typeMatch && operatorMatch && dateMatch;
        });
    }, [records, searchPond, searchType, searchOperator, dateFrom, dateTo]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pagedItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleReset = () => {
        setSearchPond('全部');
        setSearchType('全部');
        setSearchOperator('');
        setDateFrom('');
        setDateTo('');
        setCurrentPage(1);
    };

    // ========== 弹窗操作 ==========
    const openAddDialog = () => {
        setForm({ ...emptyForm, executedAt: new Date().toISOString().slice(0, 16) });
        setDialogType('add');
    };

    const openEditDialog = (record: FarmWorkRecord) => {
        setSelectedRecord(record);
        // 解析 "☀️ 晴天 26℃" 格式
        const tempMatch = record.weather.match(/(\d+)℃?$/);
        const temp = tempMatch ? tempMatch[1] : '';
        const wType = record.weather.replace(/\s*\d+℃?$/, '').trim();
        const matched = WEATHER_TYPE_OPTIONS.find(o => o.value === wType);
        setForm({
            pondCode: record.pondCode,
            workType: record.workType,
            materialDetail: record.materialDetail,
            operator: record.operator,
            weatherType: matched ? matched.value : WEATHER_TYPE_OPTIONS[0].value,
            weatherTemp: temp,
            executedAt: record.executedAt.replace(' ', 'T'),
        });
        setDialogType('edit');
    };

    const openViewDialog = (record: FarmWorkRecord) => {
        setSelectedRecord(record);
        setDialogType('view');
    };

    const closeDialog = () => {
        setDialogType(null);
        setSelectedRecord(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await new Promise(r => setTimeout(r, 800));

        const execTime = form.executedAt.replace('T', ' ');
        const weatherStr = form.weatherTemp ? `${form.weatherType} ${form.weatherTemp}℃` : form.weatherType;

        if (dialogType === 'add') {
            const newRecord: FarmWorkRecord = {
                id: Date.now(),
                recordCode: `WK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(records.length + 1).padStart(3, '0')}`,
                pondCode: form.pondCode,
                workType: form.workType,
                materialDetail: form.materialDetail,
                operator: form.operator,
                weather: weatherStr,
                executedAt: execTime,
            };
            setRecords([newRecord, ...records]);
        } else if (dialogType === 'edit' && selectedRecord) {
            setRecords(records.map(r => r.id === selectedRecord.id ? {
                ...r,
                pondCode: form.pondCode,
                workType: form.workType,
                materialDetail: form.materialDetail,
                operator: form.operator,
                weather: weatherStr,
                executedAt: execTime,
            } : r));
        }

        setIsSaving(false);
        closeDialog();
    };

    const handleDelete = (id: number) => {
        if (confirm('确定要删除该作业记录吗？此操作不可恢复。')) {
            setRecords(records.filter(r => r.id !== id));
        }
    };

    // ========== 导出 ==========
    const handleExport = () => {
        const headers = ['记录编号', '蟹塘编号', '作业类型', '消耗物料/详情', '作业人', '天气状况', '执行时间'];
        const rows = filtered.map(r => [
            r.recordCode, r.pondCode, r.workType, r.materialDetail, r.operator, r.weather, r.executedAt,
        ]);
        const csv = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `蟹塘作业记录_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };



    return (
        <div className="p-6 bg-slate-50 min-h-full space-y-5">
            {/* ===== 页面标题 ===== */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-xl">
                    <Clipboard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800">蟹塘作业记录</h1>
                    <p className="text-slate-500 text-sm mt-0.5">记录每日投喂、施药、水质调控等农事操作，实现全链路可追溯管理</p>
                </div>
            </div>

            {/* ===== 搜索过滤卡片 ===== */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="min-w-[140px]">
                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">蟹塘选择</label>
                        <select
                            value={searchPond}
                            onChange={e => setSearchPond(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                        >
                            {POND_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="min-w-[160px]">
                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">作业类型</label>
                        <select
                            value={searchType}
                            onChange={e => setSearchType(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                        >
                            {WORK_TYPE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="min-w-[140px]">
                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">作业人</label>
                        <input
                            value={searchOperator}
                            onChange={e => setSearchOperator(e.target.value)}
                            placeholder="请输入姓名"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                        />
                    </div>
                    <div className="min-w-[280px]">
                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">作业日期</label>
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
                    <div className="flex gap-2 shrink-0 ml-auto">
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
                <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <button onClick={openAddDialog} className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-blue-600/20">
                            <Plus className="w-4 h-4" /> 记录新作业
                        </button>
                        <button className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-emerald-600/20">
                            <Upload className="w-4 h-4" /> 批量导入
                        </button>
                        <button onClick={handleExport} className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-amber-500/20">
                            <Download className="w-4 h-4" /> 导出记录
                        </button>
                    </div>
                    <span className="text-xs text-slate-400">共 <span className="font-semibold text-slate-600">{filtered.length}</span> 条作业记录</span>
                </div>

                {/* 数据表格 */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50/80 text-slate-500">
                            <tr>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">记录编号</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">蟹塘编号</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">作业类型</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap min-w-[220px]">消耗物料/详情</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">作业人</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">天气状况</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">执行时间</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap text-center">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pagedItems.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-16 text-slate-400">
                                        <Clipboard className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                        暂无符合条件的作业记录
                                    </td>
                                </tr>
                            ) : pagedItems.map(record => (
                                <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{record.recordCode}</td>
                                    <td className="py-3.5 px-4 font-semibold text-slate-800">{record.pondCode}</td>
                                    <td className="py-3.5 px-4"><WorkTypeTag value={record.workType} /></td>
                                    <td className="py-3.5 px-4 text-slate-600 max-w-[260px]">
                                        <p className="truncate" title={record.materialDetail}>{record.materialDetail}</p>
                                    </td>
                                    <td className="py-3.5 px-4 text-slate-600">{record.operator}</td>
                                    <td className="py-3.5 px-4 whitespace-nowrap text-sm">{record.weather}</td>
                                    <td className="py-3.5 px-4 text-slate-400 text-xs whitespace-nowrap">{record.executedAt}</td>
                                    <td className="py-3.5 px-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button onClick={() => openViewDialog(record)} className="px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors">查看明细</button>
                                            <button onClick={() => openEditDialog(record)} className="px-2.5 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors">编辑</button>
                                            <button onClick={() => handleDelete(record.id)} className="px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-md transition-colors">删除</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 分页 */}
                <div className="px-5 py-4 flex items-center justify-between border-t border-slate-100">
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

            {/* ===== 弹窗：新增 / 编辑 ===== */}
            {(dialogType === 'add' || dialogType === 'edit') && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeDialog}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        {/* 弹窗头部 */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
                            <h3 className="text-base font-bold text-white">{dialogType === 'add' ? '记录新作业' : '编辑作业记录'}</h3>
                            <button onClick={closeDialog} className="p-1.5 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5 text-white" /></button>
                        </div>

                        {/* 表单 */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1.5 font-medium">蟹塘编号 <span className="text-red-500">*</span></label>
                                    <select required value={form.pondCode} onChange={e => setForm({ ...form, pondCode: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 bg-white appearance-none cursor-pointer">
                                        {pondOptions.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1.5 font-medium">作业类型 <span className="text-red-500">*</span></label>
                                    <select required value={form.workType} onChange={e => setForm({ ...form, workType: e.target.value as FarmWorkRecord['workType'] })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 bg-white appearance-none cursor-pointer">
                                        {WORK_TYPE_OPTIONS.filter(t => t !== '全部').map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-600 mb-1.5 font-medium">消耗物料 / 详情 <span className="text-red-500">*</span></label>
                                <textarea
                                    required
                                    rows={3}
                                    value={form.materialDetail}
                                    onChange={e => setForm({ ...form, materialDetail: e.target.value })}
                                    placeholder="如：全价颗粒饲料 20kg，沿塘四周均匀抛撒"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1.5 font-medium">作业人 <span className="text-red-500">*</span></label>
                                    <input required value={form.operator} onChange={e => setForm({ ...form, operator: e.target.value })} placeholder="请输入员工姓名" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1.5 font-medium">天气状况</label>
                                    <div className="flex items-center gap-2">
                                        <select value={form.weatherType} onChange={e => setForm({ ...form, weatherType: e.target.value })} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 bg-white appearance-none cursor-pointer">
                                            {WEATHER_TYPE_OPTIONS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                                        </select>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <input type="number" value={form.weatherTemp} onChange={e => setForm({ ...form, weatherTemp: e.target.value })} placeholder="28" className="w-16 px-2 py-2 border border-slate-300 rounded-lg text-sm text-center focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
                                            <span className="text-sm text-slate-500">℃</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-600 mb-1.5 font-medium">执行时间 <span className="text-red-500">*</span></label>
                                <input required type="datetime-local" value={form.executedAt} onChange={e => setForm({ ...form, executedAt: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button type="button" onClick={closeDialog} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">取消</button>
                                <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-blue-600/20 disabled:opacity-60">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {isSaving ? '保存中...' : '保存记录'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== 弹窗：查看明细 ===== */}
            {dialogType === 'view' && selectedRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeDialog}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-700 to-slate-800">
                            <h3 className="text-base font-bold text-white">作业明细：{selectedRecord.recordCode}</h3>
                            <button onClick={closeDialog} className="p-1.5 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5 text-white" /></button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* 基础信息卡 */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <p className="text-[10px] text-slate-400 mb-0.5">蟹塘编号</p>
                                    <p className="text-sm font-bold text-slate-800">{selectedRecord.pondCode}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <p className="text-[10px] text-slate-400 mb-0.5">作业类型</p>
                                    <WorkTypeTag value={selectedRecord.workType} />
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <p className="text-[10px] text-slate-400 mb-0.5">作业人</p>
                                    <p className="text-sm font-semibold text-slate-800">{selectedRecord.operator}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <p className="text-[10px] text-slate-400 mb-0.5">天气</p>
                                    <p className="text-sm text-slate-700">{selectedRecord.weather}</p>
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl">
                                <p className="text-[10px] text-slate-400 mb-1">执行时间</p>
                                <p className="text-sm font-semibold text-slate-800">{selectedRecord.executedAt}</p>
                            </div>

                            {/* 详情 */}
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">消耗物料 / 作业详情</p>
                                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedRecord.materialDetail}</p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-3 border-t border-slate-100">
                                <button onClick={closeDialog} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">关闭</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
