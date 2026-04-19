import React, { useState, useMemo } from 'react';
import {
    Search, RefreshCcw, Plus, Upload, Download,
    ChevronLeft, ChevronRight, Edit, Link2, Trash2, X, Loader2, FolderOpen
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

// ========== 类型定义 ==========
interface PondDevice {
    name: string;
    count: number;
}

interface PondRecord {
    id: number;
    pondCode: string;
    area: number;
    avgDepth: number;
    crabBreed: string;
    manager: string;
    devices: PondDevice[];
    status: '养殖中' | '空闲备用' | '清塘消毒';
    createdAt: string;
}

// ========== Mock 数据 ==========
const MOCK_DATA: PondRecord[] = [
    {
        id: 1,
        pondCode: 'T-01',
        area: 15,
        avgDepth: 1.2,
        crabBreed: '长江1号',
        manager: '张三',
        devices: [{ name: '溶解氧探头', count: 2 }, { name: '自动投饵机', count: 1 }],
        status: '养殖中',
        createdAt: '2025-02-15 10:30',
    },
    {
        id: 2,
        pondCode: 'T-02',
        area: 20,
        avgDepth: 1.5,
        crabBreed: '江海21',
        manager: '李四',
        devices: [{ name: '水质探头', count: 3 }, { name: '微孔增氧机', count: 4 }],
        status: '清塘消毒',
        createdAt: '2025-03-01 14:20',
    },
    {
        id: 3,
        pondCode: 'T-03',
        area: 12,
        avgDepth: 1.0,
        crabBreed: '中华绒螯蟹',
        manager: '王五',
        devices: [{ name: '水温传感器', count: 2 }, { name: '自动排水闸', count: 1 }],
        status: '养殖中',
        createdAt: '2025-01-20 09:00',
    },
    {
        id: 4,
        pondCode: 'T-04',
        area: 18,
        avgDepth: 1.3,
        crabBreed: '诺亚1号',
        manager: '赵六',
        devices: [{ name: '微孔增氧机', count: 6 }],
        status: '空闲备用',
        createdAt: '2025-04-05 08:15',
    },
    {
        id: 5,
        pondCode: 'T-05',
        area: 25,
        avgDepth: 1.6,
        crabBreed: '金爪蟹',
        manager: '孙七',
        devices: [{ name: '溶解氧探头', count: 2 }, { name: '微孔增氧机', count: 4 }, { name: '自动投饵机', count: 2 }],
        status: '养殖中',
        createdAt: '2025-03-18 11:45',
    },
];

const STATUS_OPTIONS = ['全部', '养殖中', '空闲备用', '清塘消毒'];

const DEVICE_NAME_OPTIONS = [
    '溶解氧探头', '水质探头', '水温传感器', '微孔增氧机',
    '自动投饵机', '自动排水闸', 'pH传感器', '氨氮传感器',
    '智能摄像头', '气象站',
];

// ========== 状态 Tag ==========
function StatusTag({ value }: { value: string }) {
    const map: Record<string, string> = {
        '养殖中': 'bg-emerald-100 text-emerald-700',
        '空闲备用': 'bg-slate-100 text-slate-700',
        '清塘消毒': 'bg-orange-100 text-orange-700',
    };
    return (
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${map[value] || 'bg-slate-100 text-slate-600'}`}>
            {value}
        </span>
    );
}

// ========== 主组件 ==========
export default function PondArchivePage() {
    const { pondCount } = useSettings();

    // 数据
    const [records, setRecords] = useState<PondRecord[]>(MOCK_DATA);

    // 搜索筛选
    const [searchCode, setSearchCode] = useState('');
    const [searchManager, setSearchManager] = useState('');
    const [searchStatus, setSearchStatus] = useState('全部');

    // 分页
    const PAGE_SIZE = 10;
    const [currentPage, setCurrentPage] = useState(1);

    // 弹窗
    const [dialogType, setDialogType] = useState<'add' | 'edit' | 'device' | null>(null);
    const [selectedRecord, setSelectedRecord] = useState<PondRecord | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // 表单
    const emptyForm = {
        pondCode: '', area: '', avgDepth: '', crabBreed: '',
        manager: '', status: '养殖中' as PondRecord['status'],
    };
    const [form, setForm] = useState(emptyForm);

    // 设备绑定表单
    const [newDeviceName, setNewDeviceName] = useState(DEVICE_NAME_OPTIONS[0]);
    const [newDeviceCount, setNewDeviceCount] = useState('1');

    // ========== 筛选与分页 ==========
    const filtered = useMemo(() => {
        return records.filter(r => {
            const codeMatch = !searchCode || r.pondCode.toLowerCase().includes(searchCode.toLowerCase());
            const managerMatch = !searchManager || r.manager.includes(searchManager);
            const statusMatch = searchStatus === '全部' || r.status === searchStatus;
            return codeMatch && managerMatch && statusMatch;
        });
    }, [records, searchCode, searchManager, searchStatus]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pagedItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleReset = () => {
        setSearchCode('');
        setSearchManager('');
        setSearchStatus('全部');
        setCurrentPage(1);
    };

    // ========== 弹窗操作 ==========
    const openAddDialog = () => {
        setForm(emptyForm);
        setDialogType('add');
    };

    const openEditDialog = (record: PondRecord) => {
        setSelectedRecord(record);
        setForm({
            pondCode: record.pondCode,
            area: record.area.toString(),
            avgDepth: record.avgDepth.toString(),
            crabBreed: record.crabBreed,
            manager: record.manager,
            status: record.status,
        });
        setDialogType('edit');
    };

    const openDeviceDialog = (record: PondRecord) => {
        setSelectedRecord(record);
        setNewDeviceName(DEVICE_NAME_OPTIONS[0]);
        setNewDeviceCount('1');
        setDialogType('device');
    };

    const closeDialog = () => {
        setDialogType(null);
        setSelectedRecord(null);
    };

    // 添加设备
    const handleAddDevice = () => {
        if (!selectedRecord || !newDeviceName) return;
        const count = parseInt(newDeviceCount) || 1;
        const updatedRecords = records.map(r => {
            if (r.id !== selectedRecord.id) return r;
            const existIdx = r.devices.findIndex(d => d.name === newDeviceName);
            let newDevices: PondDevice[];
            if (existIdx >= 0) {
                newDevices = r.devices.map((d, i) => i === existIdx ? { ...d, count: d.count + count } : d);
            } else {
                newDevices = [...r.devices, { name: newDeviceName, count }];
            }
            return { ...r, devices: newDevices };
        });
        setRecords(updatedRecords);
        const updated = updatedRecords.find(r => r.id === selectedRecord.id) || null;
        setSelectedRecord(updated);
        setNewDeviceName(DEVICE_NAME_OPTIONS[0]);
        setNewDeviceCount('1');
    };

    // 删除设备
    const handleRemoveDevice = (deviceName: string) => {
        if (!selectedRecord) return;
        const updatedRecords = records.map(r => {
            if (r.id !== selectedRecord.id) return r;
            return { ...r, devices: r.devices.filter(d => d.name !== deviceName) };
        });
        setRecords(updatedRecords);
        const updated = updatedRecords.find(r => r.id === selectedRecord.id) || null;
        setSelectedRecord(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await new Promise(r => setTimeout(r, 800));

        if (dialogType === 'add') {
            const newRecord: PondRecord = {
                id: Date.now(),
                pondCode: form.pondCode,
                area: parseFloat(form.area) || 0,
                avgDepth: parseFloat(form.avgDepth) || 0,
                crabBreed: form.crabBreed,
                manager: form.manager,
                devices: [],
                status: form.status,
                createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            };
            setRecords([newRecord, ...records]);
        } else if (dialogType === 'edit' && selectedRecord) {
            setRecords(records.map(r => r.id === selectedRecord.id ? {
                ...r,
                pondCode: form.pondCode,
                area: parseFloat(form.area) || r.area,
                avgDepth: parseFloat(form.avgDepth) || r.avgDepth,
                crabBreed: form.crabBreed,
                manager: form.manager,
                status: form.status,
            } : r));
        }

        setIsSaving(false);
        closeDialog();
    };

    const handleDelete = (id: number) => {
        if (confirm('确定要删除该蟹塘档案吗？此操作不可恢复。')) {
            setRecords(records.filter(r => r.id !== id));
        }
    };

    // ========== 导出 ==========
    const handleExport = () => {
        const headers = ['蟹塘编号', '面积(亩)', '平均水深(m)', '蟹苗品种', '负责人', '关联设备', '当前状态', '建档时间'];
        const rows = filtered.map(r => [
            r.pondCode, r.area, r.avgDepth, r.crabBreed, r.manager,
            r.devices.map(d => `${d.name}x${d.count}`).join('/'),
            r.status, r.createdAt,
        ]);
        const csv = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `蟹塘基础档案_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    return (
        <div className="p-6 bg-slate-50 min-h-full space-y-5">
            {/* ===== 页面标题 ===== */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 rounded-xl">
                    <FolderOpen className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800">蟹塘基础档案管理</h1>
                    <p className="text-slate-500 text-sm mt-0.5">管理所有蟹塘的基础信息、设备绑定与运营状态，当前系统配置 <span className="font-semibold text-emerald-600">{pondCount}</span> 口塘</p>
                </div>
            </div>

            {/* ===== 搜索过滤卡片 ===== */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[180px]">
                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">蟹塘编号</label>
                        <input
                            value={searchCode}
                            onChange={e => setSearchCode(e.target.value)}
                            placeholder="请输入塘号，如 T-01"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex-1 min-w-[180px]">
                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">负责人</label>
                        <input
                            value={searchManager}
                            onChange={e => setSearchManager(e.target.value)}
                            placeholder="请输入员工姓名"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex-1 min-w-[160px]">
                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">当前状态</label>
                        <select
                            value={searchStatus}
                            onChange={e => setSearchStatus(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer"
                        >
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button onClick={() => setCurrentPage(1)} className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-emerald-600/20">
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
                        <button onClick={openAddDialog} className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-emerald-600/20">
                            <Plus className="w-4 h-4" /> 新增蟹塘
                        </button>
                        <button className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-blue-600/20">
                            <Upload className="w-4 h-4" /> 批量导入
                        </button>
                        <button onClick={handleExport} className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-lg transition-colors">
                            <Download className="w-4 h-4" /> 导出数据
                        </button>
                    </div>
                    <span className="text-xs text-slate-400">共 <span className="font-semibold text-slate-600">{filtered.length}</span> 条档案</span>
                </div>

                {/* 数据表格 */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50/80 text-slate-500">
                            <tr>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">蟹塘编号</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">面积(亩)</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">平均水深(m)</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">蟹苗品种</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">负责人</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">关联设备</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">当前状态</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap">建档时间</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 whitespace-nowrap text-center">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pagedItems.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-16 text-slate-400">
                                        <FolderOpen className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                        暂无符合条件的蟹塘档案
                                    </td>
                                </tr>
                            ) : pagedItems.map(record => (
                                <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="py-3.5 px-4 font-semibold text-slate-800">{record.pondCode}</td>
                                    <td className="py-3.5 px-4 text-slate-600">{record.area}</td>
                                    <td className="py-3.5 px-4 text-slate-600">{record.avgDepth}</td>
                                    <td className="py-3.5 px-4 text-slate-700 font-medium">{record.crabBreed}</td>
                                    <td className="py-3.5 px-4 text-slate-600">{record.manager}</td>
                                    <td className="py-3.5 px-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {record.devices.length === 0 ? (
                                                <span className="text-xs text-slate-400">暂无设备</span>
                                            ) : record.devices.map((d, i) => (
                                                <span key={i} className="inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
                                                    {d.name} x{d.count}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-4"><StatusTag value={record.status} /></td>
                                    <td className="py-3.5 px-4 text-slate-400 text-xs whitespace-nowrap">{record.createdAt}</td>
                                    <td className="py-3.5 px-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button onClick={() => openEditDialog(record)} className="px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors">编辑</button>
                                            <button onClick={() => openDeviceDialog(record)} className="px-2.5 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors">设备绑定</button>
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
                                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
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
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600">
                            <h3 className="text-base font-bold text-white">{dialogType === 'add' ? '新增蟹塘档案' : '编辑蟹塘档案'}</h3>
                            <button onClick={closeDialog} className="p-1.5 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5 text-white" /></button>
                        </div>

                        {/* 表单内容 */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1.5 font-medium">蟹塘编号 <span className="text-red-500">*</span></label>
                                    <input required value={form.pondCode} onChange={e => setForm({ ...form, pondCode: e.target.value })} placeholder="如 T-01" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1.5 font-medium">面积(亩) <span className="text-red-500">*</span></label>
                                    <input required type="number" step="0.1" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} placeholder="如 15" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1.5 font-medium">平均水深(m)</label>
                                    <input type="number" step="0.1" value={form.avgDepth} onChange={e => setForm({ ...form, avgDepth: e.target.value })} placeholder="如 1.2" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1.5 font-medium">蟹苗品种</label>
                                    <input value={form.crabBreed} onChange={e => setForm({ ...form, crabBreed: e.target.value })} placeholder="如 长江1号" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1.5 font-medium">负责人</label>
                                    <input value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })} placeholder="请输入员工姓名" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1.5 font-medium">当前状态</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as PondRecord['status'] })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 bg-white appearance-none cursor-pointer">
                                        <option value="养殖中">养殖中</option>
                                        <option value="空闲备用">空闲备用</option>
                                        <option value="清塘消毒">清塘消毒</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button type="button" onClick={closeDialog} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">取消</button>
                                <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-emerald-600/20 disabled:opacity-60">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {isSaving ? '保存中...' : '保存'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== 弹窗：设备绑定 ===== */}
            {dialogType === 'device' && selectedRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeDialog}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
                            <h3 className="text-base font-bold text-white">设备绑定 — {selectedRecord.pondCode}</h3>
                            <button onClick={closeDialog} className="p-1.5 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5 text-white" /></button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                <p className="text-xs text-blue-700 leading-relaxed">管理 {selectedRecord.pondCode} 池塘关联的物联网设备。当设备在线时，水质数据将自动同步到预警看板。</p>
                            </div>

                            {/* 已绑定设备列表 */}
                            <div>
                                <p className="text-xs font-bold text-slate-500 mb-2">已绑定设备（{selectedRecord.devices.length}）</p>
                                {selectedRecord.devices.length === 0 ? (
                                    <div className="text-center py-6 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                                        <Link2 className="w-7 h-7 mx-auto mb-1.5 text-slate-300" />
                                        <p className="text-xs">暂未绑定任何设备</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                        {selectedRecord.devices.map((d, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-100/60 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                        <Link2 className="w-3.5 h-3.5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">{d.name}</p>
                                                        <p className="text-xs text-slate-400">数量：{d.count} 台</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">在线</span>
                                                    <button onClick={() => handleRemoveDevice(d.name)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="移除设备">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 添加新设备 */}
                            <div className="pt-3 border-t border-slate-100">
                                <p className="text-xs font-bold text-slate-500 mb-2">添加新设备</p>
                                <div className="flex items-end gap-2">
                                    <div className="flex-1">
                                        <label className="block text-[11px] text-slate-400 mb-1">设备名称</label>
                                        <select value={newDeviceName} onChange={e => setNewDeviceName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 bg-white appearance-none cursor-pointer">
                                            {DEVICE_NAME_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="w-20">
                                        <label className="block text-[11px] text-slate-400 mb-1">数量</label>
                                        <input type="number" min="1" value={newDeviceCount} onChange={e => setNewDeviceCount(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-center focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
                                    </div>
                                    <button onClick={handleAddDevice} className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-blue-600/20 shrink-0">
                                        <Plus className="w-4 h-4" /> 添加
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end pt-3 border-t border-slate-100">
                                <button onClick={closeDialog} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">完成</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
