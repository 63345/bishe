import React, { useState, useEffect } from 'react';
import { ChevronDown, Search, Plus, Download, KeyRound, Edit, X, FileMinus, Trash2, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

const roleOptions = ['养殖场主', '水质分析师', '自动喂投操作员', '系统管理员'];
const teamOptions = ['系统管理', '运营团队', '技术团队', '喂投小组', '水质监控小组'];

// 自定义复选框组件
function Checkbox({ label, checked, onChange }: { label: string, checked: boolean, onChange: (c: boolean) => void }) {
    return (
        <div onClick={() => onChange(!checked)} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 hover:text-emerald-700 transition select-none">
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300'}`}>
                {checked && <div className="w-2 h-2 bg-white rounded-sm" />}
            </div>
            {label}
        </div>
    );
}

export default function UserManagementPage() {
    const { user: currentUser } = useAuth();
    const { pondOptions } = useSettings();
    const isAdmin = currentUser?.role === '系统管理';

    const [selectedTeam, setSelectedTeam] = useState('全部');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);

    // 分页状态
    const PAGE_SIZE = 10;
    const [currentPage, setCurrentPage] = useState(1);

    const loadUsers = async () => {
        try {
            const res = await fetch('/api/user/list');
            const data = await res.json();
            if (data.success) {
                setUsers(data.data);
            }
        } catch (e) {
            console.error("加载用户列表失败", e);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    // 搜索状态过滤
    const [searchName, setSearchName] = useState('');
    const [searchEmpNo, setSearchEmpNo] = useState('');
    const [searchStatus, setSearchStatus] = useState('全部');

    // 应用的过滤状态
    const [appliedFilters, setAppliedFilters] = useState({ name: '', empNo: '', status: '全部' });

    // Form State
    const [form, setForm] = useState({
        empNo: '',
        name: '',
        account: '',
        passwordReset: false,
        phone: '',
        team: '',
        roles: [] as string[],
        ponds: [] as string[]
    });

    const handleEdit = (user: any) => {
        setEditingUser(user);
        const userPonds = Array.isArray(user.ponds) ? user.ponds : [];
        setForm({
            empNo: user.empNo || '',
            name: user.name || '',
            account: user.account || '',
            passwordReset: false,
            phone: user.phone || '',
            team: user.team || '',
            roles: Array.isArray(user.roles) ? user.roles : [],
            ponds: userPonds[0] === '全部池塘' ? [...pondOptions] : userPonds
        });
        setIsDialogOpen(true);
    };

    const handleAdd = () => {
        setEditingUser(null);
        setForm({
            empNo: '',
            name: '',
            account: '',
            passwordReset: false,
            phone: '',
            team: '',
            roles: [],
            ponds: []
        });
        setIsDialogOpen(true);
    };

    const submitForm = async (e: React.FormEvent) => {
        e.preventDefault();

        // 前端先行防重校验
        if (!editingUser) {
            if (users.some(u => u.empNo === form.empNo)) {
                alert(`工号 ${form.empNo} 已存在，工号必须唯一！`);
                return;
            }
            if (users.some(u => u.account === form.account)) {
                alert(`账号名 ${form.account} 已被占用，请更换。`);
                return;
            }
        } else {
            if (users.some(u => u.id !== editingUser.id && u.empNo === form.empNo)) {
                alert(`工号 ${form.empNo} 已存在，工号必须唯一！`);
                return;
            }
            if (users.some(u => u.id !== editingUser.id && u.account === form.account)) {
                alert(`新账号名 ${form.account} 已被其他员工使用！`);
                return;
            }
        }

        setIsLoading(true);

        try {
            let res;
            if (editingUser) {
                res = await fetch(`/api/user/${editingUser.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form)
                });
            } else {
                res = await fetch('/api/user/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form)
                });
            }

            if (!res.ok) {
                const errorData = await res.json();
                alert(`保存失败: ${errorData.detail || '未知原因'}`);
                return;
            }

            await loadUsers();
            setIsDialogOpen(false);
        } catch (err) {
            console.error('保存失败', err);
            alert('服务器网络连接中断，保存数据失败！');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('确定要删除该员工账户吗？本操作不可撤销！')) {
            try {
                await fetch(`/api/user/${id}`, { method: 'DELETE' });
                await loadUsers();
            } catch (err) {
                console.error('删除失败', err);
                alert('删除数据失败！');
            }
        }
    };

    const handleSearch = () => {
        setAppliedFilters({ name: searchName, empNo: searchEmpNo, status: searchStatus });
        setCurrentPage(1);
    };

    const handleReset = () => {
        setSearchName('');
        setSearchEmpNo('');
        setSearchStatus('全部');
        setSelectedTeam('全部');
        setAppliedFilters({ name: '', empNo: '', status: '全部' });
        setCurrentPage(1);
    };

    const handleExport = () => {
        const headers = ['工号', '账号', '姓名', '所属团队', '绑定池塘', '手机号', '状态', '创建时间'];
        const csvContent = [
            headers.join(','),
            ...filteredUsers.map(u => [
                u.empNo, u.account, u.name, u.team,
                (u.ponds || []).join(';'),
                u.phone, u.status, u.createdAt
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `蟹糖员工名单_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 搜索栏回车提交
    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const filteredUsers = users.filter(u => {
        const teamMatch = selectedTeam === '全部' || u.team === selectedTeam;
        const nameMatch = !appliedFilters.name || (u.name || '').includes(appliedFilters.name);
        const empNoMatch = !appliedFilters.empNo || (u.empNo || '').includes(appliedFilters.empNo);
        const statusMatch = appliedFilters.status === '全部' || u.status === appliedFilters.status;
        return teamMatch && nameMatch && empNoMatch && statusMatch;
    });

    // 分页计算
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
    const pagedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // 每个团队的人数统计
    const teamCounts = teamOptions.reduce((acc, t) => {
        acc[t] = users.filter(u => u.team === t).length;
        return acc;
    }, {} as Record<string, number>);

    const toggleArrayItem = (array: string[], item: string, setFn: (arr: string[]) => void) => {
        if (array.includes(item)) {
            setFn(array.filter(i => i !== item));
        } else {
            setFn([...array, item]);
        }
    };

    return (
        <div className="h-full flex flex-col md:flex-row gap-4 p-4 bg-slate-50 text-slate-800">
            {/* 左侧树状图 */}
            <div className="w-full md:w-64 bg-white border border-slate-200 rounded-lg p-4 shadow-sm shrink-0 overflow-y-auto">
                <div className="text-[15px] font-semibold mb-4 text-emerald-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                    组织架构
                </div>

                <div className="space-y-1">
                    <div
                        onClick={() => { setSelectedTeam('全部'); setCurrentPage(1); }}
                        className={`flex items-center gap-1.5 cursor-pointer py-1.5 px-2 rounded text-sm font-medium transition-colors
                        ${selectedTeam === '全部' ? 'bg-emerald-100/50 text-emerald-800' : 'hover:bg-emerald-50 text-slate-800'}`}
                    >
                        <ChevronDown className={`w-4 h-4 transition-transform ${selectedTeam === '全部' ? 'text-emerald-600' : 'text-slate-400'}`} />
                        蟹糖养殖场总控
                        <span className="ml-auto text-xs text-slate-400">{users.length}</span>
                    </div>
                    <div className="pl-6 space-y-1 border-l ml-3.5 border-slate-200 mt-1">
                        {teamOptions.map(team => (
                            <div
                                key={team}
                                onClick={() => { setSelectedTeam(team); setCurrentPage(1); }}
                                className={`flex items-center gap-2 cursor-pointer py-1.5 px-3 rounded text-sm transition-colors relative before:absolute before:-left-[15px] before:top-1/2 before:w-3 before:h-px before:bg-slate-200
                                ${selectedTeam === team ? 'bg-emerald-100/50 text-emerald-700 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'}`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${selectedTeam === team ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                {team}
                                <span className="ml-auto text-xs text-slate-400">{teamCounts[team] || 0}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 右侧主区域 */}
            <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
                {/* 顶部搜索栏 */}
                <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-end bg-slate-50/50">
                    <div>
                        <label className="block text-xs text-slate-500 mb-1.5">员工姓名</label>
                        <input type="text" value={searchName} onChange={e => setSearchName(e.target.value)} onKeyDown={handleSearchKeyDown} placeholder="请输入姓名" className="w-40 px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 placeholder-slate-300" />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1.5">员工工号</label>
                        <input type="text" value={searchEmpNo} onChange={e => setSearchEmpNo(e.target.value)} onKeyDown={handleSearchKeyDown} placeholder="请输入工号" className="w-40 px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 placeholder-slate-300" />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1.5">员工状态</label>
                        <select value={searchStatus} onChange={e => setSearchStatus(e.target.value)} className="w-32 px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-emerald-500 text-slate-600 bg-white">
                            <option>全部</option>
                            <option>正常</option>
                            <option>停用</option>
                        </select>
                    </div>
                    <div className="flex gap-2 ml-auto">
                        <button onClick={handleSearch} className="px-4 py-1.5 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 transition shadow-sm flex items-center gap-1.5">
                            <Search className="w-3.5 h-3.5" />
                            查询
                        </button>
                        <button onClick={handleReset} className="px-4 py-1.5 bg-white border border-slate-300 text-slate-600 text-sm rounded hover:bg-slate-50 transition shadow-sm">
                            重置
                        </button>
                    </div>
                </div>

                {/* 操作栏 */}
                <div className="p-4 flex gap-3 items-center">
                    {isAdmin && (
                        <button onClick={handleAdd} className="px-4 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm rounded hover:bg-emerald-100 transition shadow-sm flex items-center gap-1.5 font-medium">
                            <Plus className="w-4 h-4" />
                            邀请新员工
                        </button>
                    )}
                    <button onClick={handleExport} className="px-4 py-1.5 bg-white border border-slate-300 text-slate-600 text-sm rounded hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5">
                        <Download className="w-4 h-4" />
                        批量导出
                    </button>
                    {isAdmin && (
                        <button onClick={() => alert("功能开发中：已发送重置邮件")} className="px-4 py-1.5 bg-white border border-slate-300 text-slate-600 text-sm rounded hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5">
                            <KeyRound className="w-4 h-4" />
                            重置密码
                        </button>
                    )}
                    {!isAdmin && (
                        <div className="ml-auto flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded border border-amber-200">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            当前账号为普通员工，仅可查看员工列表，编辑操作需管理员权限
                        </div>
                    )}
                </div>

                {/* 数据表格 */}
                <div className="flex-1 overflow-auto px-4 pb-4">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 sticky top-0 z-[1]">
                            <tr>
                                <th className="py-3 px-4 font-medium border-b border-slate-200">序号</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200">工号</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200">账号</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200">姓名</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200">所属团队</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200">绑定池塘</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200">手机号</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200">状态</th>
                                <th className="py-3 px-4 font-medium border-b border-slate-200">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pagedUsers.map((user, idx) => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-3 px-4 text-slate-500">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                                    <td className="py-3 px-4 font-medium text-slate-700">{user.empNo}</td>
                                    <td className="py-3 px-4">{user.account}</td>
                                    <td className="py-3 px-4 font-medium">{user.name}</td>
                                    <td className="py-3 px-4">{user.team}</td>
                                    <td className="py-3 px-4">
                                        <div className="flex flex-wrap gap-1">
                                            {(user.ponds || []).map((p: string) => (
                                                <span key={p} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs border border-slate-200">{p}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">{user.phone}</td>
                                    <td className="py-3 px-4">
                                        {user.status === '正常' ? (
                                            <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-sm text-xs border border-emerald-200">正常</span>
                                        ) : (
                                            <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-sm text-xs border border-red-200">停用</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 flex items-center gap-3">
                                        {isAdmin ? (
                                            <>
                                                <button onClick={() => handleEdit(user)} className="text-emerald-600 hover:text-emerald-800 flex items-center gap-1 transition">
                                                    <Edit className="w-3.5 h-3.5" />
                                                    编辑
                                                </button>
                                                <button onClick={() => handleDelete(user.id)} className="text-red-400 hover:text-red-600 transition flex items-center gap-1">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    删除
                                                </button>
                                            </>
                                        ) : (
                                            <span className="text-xs text-slate-400">只读</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-slate-400">
                                        <FileMinus className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                        抱歉，未找到匹配的员工数据
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 分页 */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 bg-slate-50/50">
                    <div>共 {filteredUsers.length} 条记录</div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                            className="px-2 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed"
                        >
                            <ChevronDown className="w-4 h-4 rotate-90" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1 border rounded font-medium transition-colors ${currentPage === page
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                    : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-600'}`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="px-2 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed"
                        >
                            <ChevronDown className="w-4 h-4 -rotate-90" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 弹窗 */}
            {isDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsDialogOpen(false)}></div>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[720px] z-10 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-[17px] font-semibold text-slate-800 tracking-wide">
                                {editingUser ? '编辑员工权限配置' : '邀请新员工入驻'}
                            </h2>
                            <button onClick={() => setIsDialogOpen(false)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form id="userForm" onSubmit={submitForm} className="space-y-6">
                                {/* 基本信息层 */}
                                <div>
                                    <div className="text-sm font-medium text-emerald-800 mb-4 bg-emerald-50 inline-block px-3 py-1 rounded">基础信息</div>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                                        <div className="flex gap-3">
                                            <label className="w-16 text-sm text-slate-600 text-right mt-1.5 shrink-0"><span className="text-red-500 mr-1">*</span>员工工号</label>
                                            <input type="text" value={form.empNo} onChange={e => setForm({ ...form, empNo: e.target.value })} required placeholder="如：EMP008" className="flex-1 border border-slate-300 rounded px-3 py-1.5 text-sm transition focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 bg-white" />
                                        </div>
                                        <div className="flex gap-3">
                                            <label className="w-16 text-sm text-slate-600 text-right mt-1.5 shrink-0"><span className="text-red-500 mr-1">*</span>员工姓名</label>
                                            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="如：李四" className="flex-1 border border-slate-300 rounded px-3 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition" />
                                        </div>
                                        <div className="flex gap-3">
                                            <label className="w-16 text-sm text-slate-600 text-right mt-1.5 shrink-0"><span className="text-red-500 mr-1">*</span>登录账号</label>
                                            <input type="text" value={form.account} onChange={e => setForm({ ...form, account: e.target.value })} required placeholder="如：lisi_pwd" className="flex-1 border border-slate-300 rounded px-3 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition" />
                                        </div>
                                        <div className="flex gap-3">
                                            <label className="w-16 text-sm text-slate-600 text-right mt-1.5 shrink-0">手机号码</label>
                                            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="联系方式" className="flex-1 border border-slate-300 rounded px-3 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition" />
                                        </div>
                                    </div>
                                    {editingUser && (
                                        <div className="mt-4 flex gap-3 pl-2 sm:pl-[92px]">
                                            <Checkbox label="强制要求该用户下次登录重置密码" checked={form.passwordReset} onChange={c => setForm({ ...form, passwordReset: c })} />
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-slate-100"></div>

                                {/* 权限配置核心 */}
                                <div>
                                    <div className="text-sm font-medium text-amber-800 mb-4 bg-amber-50 inline-block px-3 py-1 rounded">权限配置层（核心）</div>
                                    <div className="space-y-5">
                                        <div className="flex gap-3 items-center">
                                            <label className="w-16 text-sm text-slate-600 text-right shrink-0"><span className="text-red-500 mr-1">*</span>所属团队</label>
                                            <select required value={form.team} onChange={e => setForm({ ...form, team: e.target.value })} className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none bg-white">
                                                <option value="" disabled>请选择树状对应的团队节点</option>
                                                {teamOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>

                                        <div className="flex gap-3">
                                            <label className="w-16 text-sm text-slate-600 text-right mt-1.5 shrink-0">权限角色</label>
                                            <div className="flex-1 flex flex-wrap gap-x-4 gap-y-3 p-2 bg-slate-50 border border-slate-100 rounded">
                                                {roleOptions.map(role => (
                                                    <Checkbox
                                                        key={role}
                                                        label={role}
                                                        checked={form.roles.includes(role)}
                                                        onChange={() => toggleArrayItem(form.roles, role, r => setForm({ ...form, roles: r }))}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <label className="w-16 text-sm text-slate-600 text-right mt-1.5 shrink-0 font-bold text-emerald-700">负责池塘</label>
                                            <div className="flex-1">
                                                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded">
                                                    <div className="text-xs text-slate-500 mb-2">系统仅允许员工查看或操作所绑定池塘（选定范围）内的喂投、水质与数据统计。</div>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-3">
                                                        {pondOptions.map(pond => (
                                                            <Checkbox
                                                                key={pond}
                                                                label={pond}
                                                                checked={form.ponds.includes(pond)}
                                                                onChange={() => toggleArrayItem(form.ponds, pond, p => setForm({ ...form, ponds: p }))}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
                            <button type="button" onClick={() => setIsDialogOpen(false)} className="px-4 py-2 text-sm border border-slate-300 rounded hover:bg-white bg-slate-50 text-slate-600 transition shadow-sm">
                                取消
                            </button>
                            <button type="submit" form="userForm" disabled={isLoading} className="px-5 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 transition shadow-md font-medium disabled:opacity-50 flex items-center gap-2">
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                保存配置
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
