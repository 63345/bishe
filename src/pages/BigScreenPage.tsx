import { useState, useEffect, useRef } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, ReferenceLine
} from 'recharts';
import { Wifi, Droplets, AlertTriangle, Zap, ThermometerSun, Wind, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── Mock Data ───────────────────────────────────────────
const doData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    value: i < 14 ? +(5.8 + Math.random() * 2.5).toFixed(1) : null,
    predict: i >= 13 ? +(5.2 + Math.random() * 2.8).toFixed(1) : null,
}));

const inventoryData = [
    { name: '饵料', value: 42000, color: '#22d3ee' },
    { name: '渔药', value: 18000, color: '#f59e0b' },
    { name: '调水剂', value: 12000, color: '#a78bfa' },
    { name: '其他', value: 8000, color: '#64748b' },
];

const specData = [
    { name: '特级蟹\n(≥4.5两)', count: 320, color: '#22d3ee' },
    { name: '一级蟹\n(3.5-4.5两)', count: 580, color: '#38bdf8' },
    { name: '二级蟹\n(2.5-3.5两)', count: 440, color: '#818cf8' },
    { name: '统货\n(<2.5两)', count: 260, color: '#64748b' },
];

const aiMessages = [
    { level: 'warn', text: '⚠️ T-02塘预测今晚溶氧将降至3.8mg/L，AI建议20:00提前开启微孔增氧机', time: '10分钟前' },
    { level: 'info', text: '📊 RAG知识库匹配建议：当前水温24.5℃适宜投喂冰鲜饲料，投喂量可提升至体重6%', time: '25分钟前' },
    { level: 'warn', text: '⚠️ T-05塘pH值持续偏高(8.9)，建议泼洒有机酸调水剂20kg/亩', time: '40分钟前' },
    { level: 'info', text: '✅ T-01塘水质综合评分98分(优)，为当前全场最优蟹塘', time: '1小时前' },
    { level: 'alert', text: '🚨 氨氮预警：T-04塘氨氮浓度超标(0.35mg/L)，建议立即换水30%', time: '1.5小时前' },
    { level: 'info', text: '📈 AI产量预测：按当前长势本季全场预计总产量可达12.8吨，较上季提升15%', time: '2小时前' },
];

const patrolLogs = [
    { user: '张师傅', avatar: 'Z', action: '完成T-01塘晨间巡查', status: '正常', time: '08:30', color: 'bg-emerald-500' },
    { user: '李技术员', avatar: 'L', action: '提交T-03水质异常报告', status: '异常', time: '09:15', color: 'bg-rose-500' },
    { user: '王场长', avatar: 'W', action: '审批T-02增氧设备启停', status: '已处理', time: '10:00', color: 'bg-cyan-500' },
    { user: '赵饲养员', avatar: 'R', action: '完成全场饵料投喂记录', status: '正常', time: '11:30', color: 'bg-amber-500' },
    { user: '张师傅', avatar: 'Z', action: '巡查T-05塘围网设施', status: '正常', time: '14:00', color: 'bg-emerald-500' },
];

const ponds = [
    { id: 'T-01', x: 80, y: 55, w: 160, h: 110, status: 'normal', do: 7.8, temp: 24.2, area: 18 },
    { id: 'T-02', x: 290, y: 40, w: 150, h: 120, status: 'warning', do: 3.9, temp: 25.1, area: 15 },
    { id: 'T-03', x: 490, y: 55, w: 140, h: 105, status: 'normal', do: 6.5, temp: 23.8, area: 20 },
    { id: 'T-04', x: 130, y: 210, w: 170, h: 115, status: 'alert', do: 5.2, temp: 26.0, area: 22 },
    { id: 'T-05', x: 380, y: 215, w: 155, h: 110, status: 'normal', do: 7.1, temp: 24.0, area: 16 },
];

// ─── Sub-components ──────────────────────────────────────
const PanelHeader = ({ title, accent = 'cyan' }: { title: string; accent?: string }) => {
    const colors: Record<string, string> = { cyan: 'bg-slate-400', amber: 'bg-slate-400', rose: 'bg-slate-400' };
    return (
        <div className="flex items-center gap-2 mb-4">
            <div className={`w-1 h-4 rounded-full ${colors[accent] || colors.cyan}`} />
            <div className={`w-1 h-4 rounded-full ${colors[accent] || colors.cyan} opacity-40`} />
            <h3 className="text-sm font-semibold text-slate-400 tracking-wide">{title}</h3>
        </div>
    );
};

const GaugeBar = ({ label, value, unit, max, color, danger }: { label: string; value: number; unit: string; max: number; color: string; danger?: number }) => {
    const pct = Math.min((value / max) * 100, 100);
    const isAlert = danger !== undefined && value <= danger;
    return (
        <div className="mb-5">
            <div className="flex justify-between items-end mb-2">
                <span className="text-xs text-slate-500 font-medium">{label}</span>
                <span className={`text-2xl font-bold ${isAlert ? 'text-rose-400' : color}`}>{value}<span className="text-xs ml-1 text-slate-500">{unit}</span></span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${isAlert ? 'bg-gradient-to-r from-rose-600 to-rose-400' : `bg-gradient-to-r ${color === 'text-cyan-400' ? 'from-cyan-600 to-cyan-300' : color === 'text-amber-400' ? 'from-amber-600 to-amber-300' : 'from-emerald-600 to-emerald-300'}`}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────
export default function BigScreenPage() {
    const navigate = useNavigate();
    const [now, setNow] = useState(new Date());
    const [hoveredPond, setHoveredPond] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    // Auto-scroll AI messages
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const t = setInterval(() => {
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
                el.scrollTop = 0;
            } else {
                el.scrollTop += 1;
            }
        }, 60);
        return () => clearInterval(t);
    }, []);

    const totalInventory = inventoryData.reduce((s, d) => s + d.value, 0);

    return (
        <div className="h-screen w-screen bg-slate-900 text-white flex flex-col overflow-hidden font-sans select-none">
            {/* ─── Header ─── */}
            <header className="relative z-10 flex items-center justify-between px-8 py-3 border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-center gap-4 text-slate-400 text-sm">
                    <button onClick={() => navigate('/')} className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span>返回系统</span>
                    </button>
                    <span className="hidden md:inline">|</span>
                    <span className="hidden md:flex items-center gap-1"><ThermometerSun className="w-4 h-4 text-amber-300" /> 28℃</span>
                    <span className="hidden md:flex items-center gap-1"><Wind className="w-4 h-4" /> 东南风 3级</span>
                </div>
                <h1 className="absolute left-1/2 -translate-x-1/2 text-lg md:text-xl font-bold tracking-[0.15em] text-slate-100">
                    蟹糖 · 大闸蟹智慧养殖决策大脑
                </h1>
                <div className="text-right text-sm text-slate-400">
                    <div className="font-mono tracking-wider text-slate-300">{now.toLocaleTimeString('zh-CN', { hour12: false })}</div>
                    <div className="text-xs">{now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}</div>
                </div>
            </header>

            {/* ─── Body 3-Column ─── */}
            <div className="flex-1 grid grid-cols-4 gap-3 p-3 overflow-hidden min-h-0">

                {/* ═══ LEFT COLUMN ═══ */}
                <div className="col-span-1 flex flex-col gap-3 overflow-hidden min-h-0">
                    {/* Water Quality Gauges */}
                    <div onClick={() => navigate('/warning')} className="bg-slate-800/60 border border-slate-700/40 hover:border-slate-600/60 rounded-xl p-5 flex-shrink-0 cursor-pointer transition-colors">
                        <PanelHeader title="核心水质实时监测" />
                        <GaugeBar label="全场均值溶氧 (DO)" value={6.8} unit="mg/L" max={12} color="text-cyan-400" danger={4.0} />
                        <GaugeBar label="全场均值 pH" value={7.6} unit="" max={14} color="text-emerald-400" />
                        <GaugeBar label="全场均值氨氮 (NH₃-N)" value={0.18} unit="mg/L" max={1} color="text-amber-400" danger={0.3} />
                    </div>

                    {/* DO Prediction Chart */}
                    <div onClick={() => navigate('/warning')} className="bg-slate-800/60 border border-slate-700/40 hover:border-slate-600/60 rounded-xl p-5 flex-1 flex flex-col overflow-hidden min-h-0 cursor-pointer transition-colors">
                        <PanelHeader title="未来24h溶氧AI预测" accent="amber" />
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={doData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="doGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={[2, 10]} />
                                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }} />
                                    <ReferenceLine y={4.0} stroke="#f43f5e" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: '缺氧阈值 4.0', fill: '#f43f5e', fontSize: 10, position: 'insideTopLeft' }} />
                                    <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} fill="url(#doGrad)" dot={false} name="实测溶氧" connectNulls={false} />
                                    <Area type="monotone" dataKey="predict" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 3" fill="url(#predGrad)" dot={false} name="LSTM预测" connectNulls={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-cyan-400 inline-block" /> 实测值</span>
                            <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-amber-400 inline-block border-dashed" style={{ borderTop: '2px dashed #f59e0b', height: 0 }} /> LSTM预测</span>
                            <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-rose-500 inline-block" /> 危险阈值</span>
                        </div>
                    </div>

                    {/* AI Decision Scroll */}
                    <div onClick={() => navigate('/')} className="bg-slate-800/60 border border-slate-700/40 hover:border-slate-600/60 rounded-xl p-5 flex-shrink-0 max-h-[25%] cursor-pointer transition-colors">
                        <PanelHeader title="AI 智能决策播报" accent="rose" />
                        <div ref={scrollRef} className="overflow-hidden h-28 space-y-2 text-xs">
                            {[...aiMessages, ...aiMessages].map((m, i) => (
                                <div key={i} className={`p-2.5 rounded-lg border ${m.level === 'alert' ? 'border-rose-800/50 bg-rose-950/40' : m.level === 'warn' ? 'border-amber-800/40 bg-amber-950/30' : 'border-slate-800 bg-slate-800/30'}`}>
                                    <div className="text-slate-300 leading-relaxed">{m.text}</div>
                                    <div className="text-slate-600 mt-1 text-[10px]">{m.time}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ═══ CENTER COLUMN ═══ */}
                <div className="col-span-2 flex flex-col gap-3 overflow-hidden min-h-0">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-4 gap-3 flex-shrink-0">
                        {[
                            { label: '养殖总面积', value: '91', unit: '亩', icon: <Droplets className="w-5 h-5" />, text: 'text-blue-300', link: '/pond-archive' },
                            { label: '预计总产量', value: '12.8', unit: '吨', icon: <Zap className="w-5 h-5" />, text: 'text-emerald-300', link: '/dashboard' },
                            { label: '当前活跃设备', value: '28', unit: '台', icon: <Wifi className="w-5 h-5" />, text: 'text-slate-300', link: '/pond-archive' },
                            { label: '异常报警', value: '2', unit: '条', icon: <AlertTriangle className="w-5 h-5" />, text: 'text-amber-300', link: '/warning' },
                        ].map((kpi, i) => (
                            <div key={i} onClick={() => navigate(kpi.link)} className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4 cursor-pointer hover:bg-slate-800/80 transition-colors">
                                <div>
                                    <div className={`${kpi.text} mb-2 opacity-60`}>{kpi.icon}</div>
                                    <div className={`text-2xl font-bold text-white`}>{kpi.value}<span className="text-sm ml-1 text-slate-500 font-normal">{kpi.unit}</span></div>
                                    <div className="text-xs text-slate-500 mt-1">{kpi.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pond Topology SVG */}
                    <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-5 flex-1 flex flex-col overflow-hidden min-h-0">
                        <PanelHeader title="蟹塘空间拓扑分布" />
                        <div className="flex-1 min-h-0 relative">
                            <svg viewBox="0 0 700 380" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                                {/* Grid lines */}
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <line key={`h${i}`} x1="0" y1={i * 50} x2="700" y2={i * 50} stroke="#1e293b" strokeWidth="0.5" />
                                ))}
                                {Array.from({ length: 15 }).map((_, i) => (
                                    <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="380" stroke="#1e293b" strokeWidth="0.5" />
                                ))}

                                {/* Road / path */}
                                <path d="M0,180 Q200,160 350,180 T700,170" fill="none" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
                                <text x="350" y="175" textAnchor="middle" fill="#475569" fontSize="9" fontWeight="bold">—— 主干道 ——</text>

                                {/* Ponds */}
                                {ponds.map((p) => {
                                    const cx = p.x + p.w / 2;
                                    const cy = p.y + p.h / 2;
                                    const statusColor = p.status === 'alert' ? '#ef4444' : p.status === 'warning' ? '#eab308' : '#94a3b8';
                                    const fillColor = p.status === 'alert' ? 'rgba(239,68,68,0.08)' : p.status === 'warning' ? 'rgba(234,179,8,0.06)' : 'rgba(148,163,184,0.05)';
                                    return (
                                        <g key={p.id} onMouseEnter={() => setHoveredPond(p.id)} onMouseLeave={() => setHoveredPond(null)} onClick={() => navigate('/pond-archive')} className="cursor-pointer">
                                            <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="12" fill={fillColor} stroke={statusColor} strokeWidth={hoveredPond === p.id ? 2 : 1} opacity={hoveredPond === p.id ? 1 : 0.7} className="transition-all duration-300" />

                                            {/* Status dot */}
                                            {p.status === 'alert' && <circle cx={cx} cy={cy - 10} r="6" fill="#ef4444" opacity="0.3" />}
                                            <circle cx={cx} cy={cy - 10} r={p.status === 'normal' ? 4 : 5} fill={statusColor} />
                                            <text x={cx} y={cy + 10} textAnchor="middle" fill={statusColor} fontSize="12" fontWeight="bold">{p.id}</text>
                                            <text x={cx} y={cy + 24} textAnchor="middle" fill="#64748b" fontSize="9">{p.area}亩</text>

                                            {/* Hover tooltip */}
                                            {hoveredPond === p.id && (
                                                <foreignObject x={cx - 70} y={p.y - 75} width="140" height="70">
                                                    <div className="bg-slate-800/95 backdrop-blur border border-slate-600 rounded-lg p-2.5 text-[10px] text-slate-300 shadow-lg">
                                                        <div className="font-bold text-slate-200 mb-1">{p.id} · {p.area}亩</div>
                                                        <div>溶氧: <span className={p.do < 4 ? 'text-red-400' : 'text-emerald-400'}>{p.do} mg/L</span></div>
                                                        <div>水温: <span className="text-blue-300">{p.temp}°C</span></div>
                                                    </div>
                                                </foreignObject>
                                            )}
                                        </g>
                                    );
                                })}

                                {/* Legend */}
                                <circle cx="580" cy="350" r="5" fill="#94a3b8" />
                                <text x="592" y="354" fill="#64748b" fontSize="10">正常</text>
                                <circle cx="625" cy="350" r="5" fill="#eab308" />
                                <text x="637" y="354" fill="#64748b" fontSize="10">预警</text>
                                <circle cx="670" cy="350" r="5" fill="#ef4444" />
                                <text x="682" y="354" fill="#64748b" fontSize="10">报警</text>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* ═══ RIGHT COLUMN ═══ */}
                <div className="col-span-1 flex flex-col gap-3 overflow-hidden min-h-0">
                    {/* Inventory Donut */}
                    <div onClick={() => navigate('/inventory')} className="bg-slate-800/60 border border-slate-700/40 hover:border-slate-600/60 rounded-xl p-5 flex-shrink-0 cursor-pointer transition-colors">
                        <PanelHeader title="物资消耗监控" accent="amber" />
                        <div className="h-44 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={inventoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} dataKey="value" paddingAngle={3} stroke="none">
                                        {inventoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }} formatter={(v: number) => `¥${(v / 10000).toFixed(1)}万`} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                                <div className="text-[10px] text-slate-500">本月总消耗</div>
                                <div className="text-xl font-black text-white">¥{(totalInventory / 10000).toFixed(1)}<span className="text-xs text-slate-500">万</span></div>
                            </div>
                        </div>
                        <div className="flex justify-center gap-3 mt-1 text-[10px] text-slate-500 flex-wrap">
                            {inventoryData.map((d, i) => (
                                <span key={i} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: d.color }} />{d.name}</span>
                            ))}
                        </div>
                    </div>

                    {/* Spec Bar Chart */}
                    <div onClick={() => navigate('/crab-quality')} className="bg-slate-800/60 border border-slate-700/40 hover:border-slate-600/60 rounded-xl p-5 flex-1 flex flex-col overflow-hidden min-h-0 cursor-pointer transition-colors">
                        <PanelHeader title="商品蟹规格分布" />
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={specData} margin={{ top: 10, right: 5, left: -20, bottom: 5 }} barSize={28}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }} />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]} name="数量(只)">
                                        {specData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Patrol Timeline */}
                    <div onClick={() => navigate('/inspection')} className="bg-slate-800/60 border border-slate-700/40 hover:border-slate-600/60 rounded-xl p-5 flex-shrink-0 max-h-[30%] overflow-hidden cursor-pointer transition-colors">
                        <PanelHeader title="实时巡塘动态" accent="cyan" />
                        <div className="space-y-3 overflow-y-auto h-[calc(100%-2rem)] pr-1 scrollbar-hide">
                            {patrolLogs.map((log, i) => (
                                <div key={i} className="flex items-start gap-3 group">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-7 h-7 rounded-full ${log.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{log.avatar}</div>
                                        {i < patrolLogs.length - 1 && <div className="w-px h-full bg-slate-800 mt-1" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-slate-300">{log.user}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${log.status === '异常' ? 'bg-rose-900/50 text-rose-400' : log.status === '已处理' ? 'bg-cyan-900/50 text-cyan-400' : 'bg-emerald-900/50 text-emerald-400'}`}>{log.status}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">{log.action}</div>
                                        <div className="text-[10px] text-slate-600">{log.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
