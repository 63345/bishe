import { useState } from 'react';
import { useAuth, DEMO_USERS } from '../contexts/AuthContext';
import { Loader2, ShieldCheck, User, Lock, ChevronDown } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showQuickLogin, setShowQuickLogin] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // 模拟网络延时
        await new Promise(resolve => setTimeout(resolve, 800));

        const success = await login(username, password);
        if (!success) {
            setError('用户名或密码错误，请检查您的账号');
        }
        setIsLoading(false);
    };

    const handleQuickLogin = async (u: typeof DEMO_USERS[0]) => {
        setIsLoading(true);
        setError('');
        await new Promise(resolve => setTimeout(resolve, 500));
        // 系统管理员使用的是 admin123 密码，其它为 123456
        const pass = u.username === 'admin' ? 'admin123' : '123456';
        const success = await login(u.username, pass);
        if (!success) {
            setError('快速登录失败，请检查后端是否正常启动');
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 relative overflow-hidden">
            {/* Animated background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 w-full max-w-md px-6">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-5">
                        <span className="text-3xl">🦀</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">智慧蟹塘</h1>
                    <p className="text-emerald-200/60 text-sm">大闸蟹精准养殖智能决策系统</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-medium text-emerald-200/80 mb-2">用户名</label>
                            <div className="relative">
                                <User className="w-4 h-4 text-emerald-300/50 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="请输入用户名"
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-emerald-200/80 mb-2">密码</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-emerald-300/50 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="请输入密码"
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-400 text-xs bg-red-500/10 px-4 py-2.5 rounded-lg border border-red-500/20">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                            {isLoading ? '登录中...' : '登 录'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-white/10"></div>
                        <span className="text-xs text-white/30">或者使用预设账号快速登录</span>
                        <div className="flex-1 h-px bg-white/10"></div>
                    </div>

                    {/* Quick Login Toggle */}
                    <button
                        onClick={() => setShowQuickLogin(!showQuickLogin)}
                        className="w-full flex items-center justify-center gap-2 text-emerald-300/70 hover:text-emerald-300 text-sm transition-colors py-2"
                    >
                        演示快捷登录
                        <ChevronDown className={`w-4 h-4 transition-transform ${showQuickLogin ? 'rotate-180' : ''}`} />
                    </button>

                    {showQuickLogin && (
                        <div className="mt-3 space-y-2">
                            {DEMO_USERS.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => handleQuickLogin(u)}
                                    disabled={isLoading}
                                    className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all text-left group"
                                >
                                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                                        {u.avatar}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-white/90 group-hover:text-white">{u.displayName}</div>
                                        <div className="text-[11px] text-white/40">{u.role}</div>
                                    </div>
                                    <div className="text-[10px] text-emerald-400/50 bg-emerald-500/10 px-2 py-1 rounded font-mono">
                                        {u.username}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-white/20 text-xs mt-8">
                    © 2026 大闸蟹智慧养殖系统 · 毕业设计
                </p>
            </div>
        </div>
    );
}
