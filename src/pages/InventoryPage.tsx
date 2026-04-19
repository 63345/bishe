import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, Plus, PackagePlus, PackageMinus, Download, Edit, Trash2, ChevronDown, ChevronLeft, ChevronRight, X, Loader2, Package, AlertTriangle, Star, ArrowRight } from 'lucide-react';
import { INITIAL_INVENTORY, getCurrentStageConfig, getStageCriticalAlerts } from '../data/inventoryData';
import type { InventoryItem } from '../data/inventoryData';

// ========== 分类选项 ==========
const CATEGORIES = ['全部', '基础饮料', '动保调水', '渔药', '设备耗材'];

// ========== 主组件 ==========
export default function InventoryPage() {
    // 数据状态
    const [items, setItems] = useState<InventoryItem[]>(INITIAL_INVENTORY);
    const [nextId, setNextId] = useState(INITIAL_INVENTORY.length + 1);

    // 搜索状态
    const [searchName, setSearchName] = useState('');
    const [searchCode, setSearchCode] = useState('');
    const [searchCategory, setSearchCategory] = useState('全部');
    const [appliedFilters, setAppliedFilters] = useState({ name: '', code: '', category: '全部' });

    // 分页
    const PAGE_SIZE = 10;
    const [currentPage, setCurrentPage] = useState(1);

    // 选中行
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // 弹窗状态
    const [dialogType, setDialogType] = useState<'add' | 'edit' | 'in' | 'out' | null>(null);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // 新增/编辑表单
    const [form, setForm] = useState({
        code: '', name: '', category: '基础饲料', spec: 'kg', stock: 0, warningLine: 10, remark: ''
    });

    // 出入库表单
    const [stockForm, setStockForm] = useState({ itemId: 0, quantity: 0, operator: '' });

    // ========== 过滤 & 分页 ==========
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const nameMatch = !appliedFilters.name || item.name.includes(appliedFilters.name);
            const codeMatch = !appliedFilters.code || item.code.includes(appliedFilters.code);
            const catMatch = appliedFilters.category === '全部' || item.category === appliedFilters.category;
            return nameMatch && codeMatch && catMatch;
        });
    }, [items, appliedFilters]);

    const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
    const pagedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // ========== 搜索 ==========
    const handleSearch = () => {
        setAppliedFilters({ name: searchName, code: searchCode, category: searchCategory });
        setCurrentPage(1);
    };
    const handleReset = () => {
        setSearchName(''); setSearchCode(''); setSearchCategory('全部');
        setAppliedFilters({ name: '', code: '', category: '全部' });
        setCurrentPage(1);
    };
    const handleSearchKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };

    // ========== 全选 ==========
    const isAllSelected = pagedItems.length > 0 && pagedItems.every(i => selectedIds.includes(i.id));
    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(prev => prev.filter(id => !pagedItems.some(i => i.id === id)));
        } else {
            setSelectedIds(prev => [...new Set([...prev, ...pagedItems.map(i => i.id)])]);
        }
    };
    const toggleSelectOne = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    // ========== 新增 ==========
    const handleAdd = () => {
        setEditingItem(null);
        setForm({ code: `MAT-2026-${String(nextId).padStart(3, '0')}`, name: '', category: '基础饲料', spec: 'kg', stock: 0, warningLine: 10, remark: '' });
        setDialogType('add');
    };

    // ========== 编辑 ==========
    const handleEdit = (item: InventoryItem) => {
        setEditingItem(item);
        setForm({ code: item.code, name: item.name, category: item.category, spec: item.spec, stock: item.stock, warningLine: item.warningLine, remark: item.remark });
        setDialogType('edit');
    };

    // ========== 删除 ==========
    const handleDelete = (id: number) => {
        if (window.confirm('确定要删除该物料记录吗？')) {
            setItems(prev => prev.filter(i => i.id !== id));
            setSelectedIds(prev => prev.filter(i => i !== id));
        }
    };

    // ========== 入库/出库弹窗 ==========
    const handleStockDialog = (type: 'in' | 'out') => {
        setStockForm({ itemId: items[0]?.id || 0, quantity: 0, operator: '' });
        setDialogType(type);
    };

    // ========== 保存新增/编辑 ==========
    const submitForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) { alert('请输入材料名称'); return; }

        if (editingItem) {
            setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...form } : i));
        } else {
            if (items.some(i => i.code === form.code)) { alert(`编号 ${form.code} 已存在`); return; }
            const newItem: InventoryItem = {
                id: nextId, ...form,
                lastInDate: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-')
            };
            setItems(prev => [newItem, ...prev]);
            setNextId(prev => prev + 1);
        }
        setDialogType(null);
    };

    // ========== 保存出入库 ==========
    const submitStockForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (stockForm.quantity <= 0) { alert('数量必须大于0'); return; }
        if (!stockForm.operator.trim()) { alert('请输入操作人'); return; }

        setItems(prev => prev.map(item => {
            if (item.id === stockForm.itemId) {
                const newStock = dialogType === 'in'
                    ? item.stock + stockForm.quantity
                    : Math.max(0, item.stock - stockForm.quantity);
                const now = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-');
                return { ...item, stock: newStock, lastInDate: dialogType === 'in' ? now : item.lastInDate };
            }
            return item;
        }));
        setDialogType(null);
    };

    // ========== 导出 CSV ==========
    const handleExport = () => {
        const headers = ['物资编号', '材料名称', '物资分类', '规格单位', '当前库存', '预警线', '状态', '最后入库时间', '备注'];
        const csvContent = [
            headers.join(','),
            ...filteredItems.map(i => [
                i.code, i.name, i.category, i.spec, i.stock, i.warningLine,
                i.stock > i.warningLine ? '库存充足' : '库存不足',
                i.lastInDate, `"${i.remark}"`
            ].join(','))
        ].join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `蟹糖物资库存_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ========== 统计数据 ==========
    const totalItems = items.length;
    const lowStockCount = items.filter(i => i.stock <= i.warningLine).length;

    // ========== 生长阶段联动预警 ==========
    const stageAlerts = useMemo(() => getStageCriticalAlerts(items), [items]);
    const stageConfig = stageAlerts.stageConfig;
    const criticalNames = stageConfig?.criticalMaterials || [];

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 bg-slate-50 min-h-full">
            {/* 页面标题 & 概览 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Package className="w-6 h-6 text-blue-600" />
                        物资与材料库存管理
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">管理养殖场全部物资、饲料、药品的库存进出</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-center shadow-sm">
                        <div className="text-xs text-slate-500">物资总数</div>
                        <div className="text-lg font-bold text-blue-700">{totalItems}</div>
                    </div>
                    <div className={`bg-white border rounded-xl px-4 py-2 text-center shadow-sm ${lowStockCount > 0 ? 'border-red-200' : 'border-slate-200'}`}>
                        <div className="text-xs text-slate-500">库存预警</div>
                        <div className={`text-lg font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {lowStockCount > 0 ? (
                                <span className="flex items-center gap-1 justify-center"><AlertTriangle className="w-4 h-4" />{lowStockCount}</span>
                            ) : '0'}
                        </div>
                    </div>
                </div>
            </div>

            {/* 搜索过滤区 */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">材料名称</label>
                        <input type="text" value={searchName} onChange={e => setSearchName(e.target.value)} onKeyDown={handleSearchKeyDown}
                            placeholder="请输入材料名称" className="w-44 px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 placeholder-slate-300" />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">物资编号</label>
                        <input type="text" value={searchCode} onChange={e => setSearchCode(e.target.value)} onKeyDown={handleSearchKeyDown}
                            placeholder="请输入编号" className="w-44 px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 placeholder-slate-300" />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">物资分类</label>
                        <select value={searchCategory} onChange={e => setSearchCategory(e.target.value)}
                            className="w-36 px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 text-slate-600 bg-white">
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2 ml-auto">
                        <button onClick={handleSearch} className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition shadow-sm flex items-center gap-1.5 font-medium">
                            <Search className="w-3.5 h-3.5" />
                            查询
                        </button>
                        <button onClick={handleReset} className="px-4 py-1.5 bg-white border border-slate-300 text-slate-600 text-sm rounded hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5">
                            <RefreshCw className="w-3.5 h-3.5" />
                            重置
                        </button>
                    </div>
                </div>
            </div>

            {/* 操作区 + 表格 */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                {/* 操作栏 */}
                <div className="p-4 flex flex-wrap gap-3 border-b border-slate-100">
                    <button onClick={handleAdd} className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition shadow-sm flex items-center gap-1.5 font-medium">
                        <Plus className="w-4 h-4" />
                        新增
                    </button>
                    <button onClick={() => handleStockDialog('in')} className="px-4 py-1.5 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 transition shadow-sm flex items-center gap-1.5 font-medium">
                        <PackagePlus className="w-4 h-4" />
                        入库
                    </button>
                    <button onClick={() => handleStockDialog('out')} className="px-4 py-1.5 bg-amber-500 text-white text-sm rounded hover:bg-amber-600 transition shadow-sm flex items-center gap-1.5 font-medium">
                        <PackageMinus className="w-4 h-4" />
                        出库
                    </button>
                    <button onClick={handleExport} className="px-4 py-1.5 bg-slate-50 border border-slate-300 text-slate-600 text-sm rounded hover:bg-slate-100 transition shadow-sm flex items-center gap-1.5">
                        <Download className="w-4 h-4" />
                        导出
                    </button>
                </div>

                {/* 数据表格 */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 sticky top-0 z-[1]">
                            <tr>
                                <th className="py-3 px-4 font-medium border-b border-slate-200 w-10">
                                    <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                </th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200">物资编号</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200">材料名称</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200">物资分类</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200">规格单位</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200">当前库存</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200">库存预警线</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200">状态</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200">最后入库时间</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pagedItems.map(item => {
                                const isSafe = item.stock > item.warningLine;
                                return (
                                    <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors ${!isSafe ? 'bg-red-50/30' : ''}`}>
                                        <td className="py-3 px-4">
                                            <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelectOne(item.id)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                        </td>
                                        <td className="py-3 px-4 font-mono text-xs text-slate-500">{item.code}</td>
                                        <td className="py-3 px-4 font-medium text-slate-800">
                                            <div className="flex items-center gap-1.5">
                                                {item.name}
                                                {criticalNames.some(cn => item.name.includes(cn)) && (
                                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded border border-amber-200 font-medium" title={`当前「${stageConfig?.stageName}」阶段关键物资`}>
                                                        <Star className="w-2.5 h-2.5 fill-current" />本期关键
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-100">{item.category}</span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-600">{item.spec}</td>
                                        <td className={`py-3 px-4 font-bold ${isSafe ? 'text-slate-800' : 'text-red-600'}`}>{item.stock}</td>
                                        <td className="py-3 px-4 text-slate-500">{item.warningLine}</td>
                                        <td className="py-3 px-4">
                                            {isSafe ? (
                                                <span className="px-2.5 py-1 rounded-sm text-xs bg-green-100 text-green-700 border border-green-200 font-medium">库存充足</span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-sm text-xs bg-red-100 text-red-700 border border-red-200 font-medium flex items-center gap-1 w-fit">
                                                    <AlertTriangle className="w-3 h-3" />库存不足
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-slate-500 text-xs">{item.lastInDate}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 text-sm transition flex items-center gap-1">
                                                    <Edit className="w-3.5 h-3.5" />编辑
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 text-sm transition flex items-center gap-1">
                                                    <Trash2 className="w-3.5 h-3.5" />删除
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="py-16 text-center text-slate-400">
                                        <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                        未找到匹配的物资数据
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 分页 */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 bg-slate-50/50">
                    <div>共 <span className="font-medium text-slate-700">{filteredItems.length}</span> 条记录</div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}
                            className="px-2 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button key={page} onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1 border rounded font-medium transition-colors ${currentPage === page
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-600'
                                    } `}>
                                {page}
                            </button>
                        ))}
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
                            className="px-2 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ========== 弹窗：新增/编辑 ========== */}
            {(dialogType === 'add' || dialogType === 'edit') && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDialogType(null)}></div>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[560px] z-10 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-[17px] font-semibold text-slate-800">
                                {dialogType === 'edit' ? '编辑物资信息' : '新增物资入库'}
                            </h2>
                            <button onClick={() => setDialogType(null)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form id="inventoryForm" onSubmit={submitForm} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1.5 font-medium"><span className="text-red-500 mr-0.5">*</span>物资编号</label>
                                        <input type="text" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} disabled={dialogType === 'edit'}
                                            className={`w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none transition ${dialogType === 'edit' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'}`} />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1.5 font-medium"><span className="text-red-500 mr-0.5">*</span>材料名称</label>
                                        <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="如：高蛋白颗粒饲料"
                                            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1.5 font-medium"><span className="text-red-500 mr-0.5">*</span>物资分类</label>
                                        <select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 bg-white">
                                            {CATEGORIES.filter(c => c !== '全部').map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">规格单位</label>
                                        <input type="text" value={form.spec} onChange={e => setForm({ ...form, spec: e.target.value })} placeholder="如：kg / 包 / 瓶"
                                            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">当前库存</label>
                                        <input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: +e.target.value })}
                                            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">库存预警线</label>
                                        <input type="number" min="0" value={form.warningLine} onChange={e => setForm({ ...form, warningLine: +e.target.value })}
                                            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1.5 font-medium">备注</label>
                                    <textarea value={form.remark} onChange={e => setForm({ ...form, remark: e.target.value })} rows={2} placeholder="物资说明或注意事项"
                                        className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none" />
                                </div>
                            </form>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
                            <button type="button" onClick={() => setDialogType(null)} className="px-4 py-2 text-sm border border-slate-300 rounded hover:bg-white bg-slate-50 text-slate-600 transition shadow-sm">取消</button>
                            <button type="submit" form="inventoryForm" className="px-5 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition shadow-md font-medium">
                                {dialogType === 'edit' ? '保存修改' : '确认新增'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== 弹窗：入库/出库 ========== */}
            {(dialogType === 'in' || dialogType === 'out') && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDialogType(null)}></div>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[440px] z-10 flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-[17px] font-semibold text-slate-800 flex items-center gap-2">
                                {dialogType === 'in' ? (
                                    <><PackagePlus className="w-5 h-5 text-emerald-600" />物资入库</>
                                ) : (
                                    <><PackageMinus className="w-5 h-5 text-amber-500" />物资出库</>
                                )}
                            </h2>
                            <button onClick={() => setDialogType(null)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="p-6">
                            <form id="stockForm" onSubmit={submitStockForm} className="space-y-4">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1.5 font-medium"><span className="text-red-500 mr-0.5">*</span>选择物资</label>
                                    <select required value={stockForm.itemId} onChange={e => setStockForm({ ...stockForm, itemId: +e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 bg-white">
                                        {items.map(i => (
                                            <option key={i.id} value={i.id}>{i.name}（当前库存：{i.stock} {i.spec}）</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1.5 font-medium"><span className="text-red-500 mr-0.5">*</span>{dialogType === 'in' ? '入库数量' : '出库数量'}</label>
                                    <input type="number" min="1" required value={stockForm.quantity || ''} onChange={e => setStockForm({ ...stockForm, quantity: +e.target.value })} placeholder="请输入数量"
                                        className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1.5 font-medium"><span className="text-red-500 mr-0.5">*</span>操作人</label>
                                    <input type="text" required value={stockForm.operator} onChange={e => setStockForm({ ...stockForm, operator: e.target.value })} placeholder="如：王芳"
                                        className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
                                </div>
                            </form>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
                            <button type="button" onClick={() => setDialogType(null)} className="px-4 py-2 text-sm border border-slate-300 rounded hover:bg-white bg-slate-50 text-slate-600 transition shadow-sm">取消</button>
                            <button type="submit" form="stockForm"
                                className={`px-5 py-2 text-sm text-white rounded transition shadow-md font-medium ${dialogType === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-500 hover:bg-amber-600'}`}>
                                确认{dialogType === 'in' ? '入库' : '出库'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
