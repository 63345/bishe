import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, MapPin, Loader2 } from 'lucide-react';

type MarketEntry = {
  date: string;
  '2两母': number;
  '3两公': number;
  '4两公': number;
};

type StatItem = {
  name: string;
  price: number;
  diff: number;
  percent: number;
  isUp: boolean;
};

export default function MarketPage() {
  const [region, setRegion] = useState('兴化');
  const [spec, setSpec] = useState('all');
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState<MarketEntry[]>([]);
  const [stats, setStats] = useState<StatItem[]>([]);

  useEffect(() => {
    fetchMarketData();
  }, [region]);

  const fetchMarketData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/market/prices?region=${encodeURIComponent(region)}&days=72`);
      if (!res.ok) throw new Error('API 请求失败');
      const json = await res.json();
      setMarketData(json.data);
      setStats(json.stats);
    } catch (err) {
      console.error('获取行情数据失败:', err);
      // 使用本地模拟数据作为 fallback
      const data = Array.from({ length: 72 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (71 - i));
        return {
          date: `${date.getMonth() + 1}月${date.getDate()}日`,
          '2两母': +(45 + Math.random() * 10 + (i * 0.5)).toFixed(2),
          '3两公': +(55 + Math.random() * 12 + (i * 0.6)).toFixed(2),
          '4两公': +(80 + Math.random() * 15 + (i * 0.8)).toFixed(2),
        };
      });
      setMarketData(data);
      const latest = data[data.length - 1];
      const prev = data[data.length - 2];
      setStats([
        { name: '2两母蟹均价', price: latest['2两母'], diff: +(latest['2两母'] - prev['2两母']).toFixed(2), percent: +((latest['2两母'] - prev['2两母']) / prev['2两母'] * 100).toFixed(1), isUp: latest['2两母'] >= prev['2两母'] },
        { name: '3两公蟹均价', price: latest['3两公'], diff: +(latest['3两公'] - prev['3两公']).toFixed(2), percent: +((latest['3两公'] - prev['3两公']) / prev['3两公'] * 100).toFixed(1), isUp: latest['3两公'] >= prev['3两公'] },
        { name: '4两公蟹均价', price: latest['4两公'], diff: +(latest['4两公'] - prev['4两公']).toFixed(2), percent: +((latest['4两公'] - prev['4两公']) / prev['4两公'] * 100).toFixed(1), isUp: latest['4两公'] >= prev['4两公'] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Filters & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 text-slate-800 font-medium">
          <MapPin className="w-5 h-5 text-emerald-600" />
          <span className="text-base sm:text-lg">产地行情监测</span>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 sm:px-4 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="兴化">江苏兴化</option>
            <option value="阳澄湖">苏州阳澄湖</option>
            <option value="高淳">南京高淳</option>
          </select>
          <select
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 sm:px-4 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">全规格</option>
            <option value="2两母">2两母蟹</option>
            <option value="3两公">3两公蟹</option>
            <option value="4两公">4两公蟹</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {stats.filter(stat => spec === 'all' || stat.name.includes(spec === '2两母' ? '2两母' : spec === '3两公' ? '3两公' : '4两公')).map((stat, idx) => (
          <div key={idx} className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-sm text-slate-500 mb-2">{stat.name}</div>
            <div className="flex items-end gap-2 sm:gap-3">
              <div className="text-2xl sm:text-3xl font-bold text-slate-800">¥{stat.price.toFixed(2)}</div>
              <div className="text-sm text-slate-500 mb-1">/斤</div>
            </div>
            <div className={`flex items-center gap-1 mt-3 sm:mt-4 text-xs sm:text-sm font-medium ${stat.isUp ? 'text-red-500' : 'text-emerald-500'}`}>
              {stat.isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(stat.diff).toFixed(2)}元 ({Math.abs(stat.percent).toFixed(1)}%)</span>
              <span className="text-slate-400 ml-1 font-normal">较上一时段</span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 sm:mb-6">近期价格走势 (元/斤)</h3>
        <div className="h-[300px] sm:h-[400px] w-full -ml-4 sm:ml-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={marketData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                dy={10}
                minTickGap={20}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                dx={-10}
                width={40}
              />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontSize: '14px', fontWeight: 500 }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />

              {(spec === 'all' || spec === '2两母') && (
                <Line type="monotone" dataKey="2两母" name="2两母蟹" stroke="#f97316" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
              )}
              {(spec === 'all' || spec === '3两公') && (
                <Line type="monotone" dataKey="3两公" name="3两公蟹" stroke="#0ea5e9" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
              )}
              {(spec === 'all' || spec === '4两公') && (
                <Line type="monotone" dataKey="4两公" name="4两公蟹" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
