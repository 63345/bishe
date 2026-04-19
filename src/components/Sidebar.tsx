import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, LayoutDashboard, LineChart, Settings, Camera, AlertTriangle, BookOpen, Users, Package, ClipboardList, FolderOpen, ClipboardPen, Award, ShieldCheck, Monitor } from 'lucide-react';
import SettingsDrawer from './SettingsDrawer';

export default function Sidebar() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navItems = [
    { name: '智慧数据大屏', path: '/big-screen', icon: Monitor },
    { name: '智能咨询中心', path: '/', icon: MessageSquare },
    { name: '预警看板', path: '/warning', icon: AlertTriangle },
    { name: '生长周期看板', path: '/dashboard', icon: LayoutDashboard },
    { name: '行情动态监测', path: '/market', icon: LineChart },
    { name: '蟹塘档案管理', path: '/pond-archive', icon: FolderOpen },
    { name: '蟹塘巡视记录', path: '/inspection', icon: ClipboardList },
    { name: '蟹塘作业记录', path: '/farm-work', icon: ClipboardPen },
    { name: '物资库存管理', path: '/inventory', icon: Package },
    { name: '蟹品质检测', path: '/crab-quality', icon: Award },
    { name: '溯源防伪管理', path: '/traceability', icon: ShieldCheck },
    { name: '智能拍照识病', path: '/recognition', icon: Camera },
    { name: '水产百科', path: '/encyclopedia', icon: BookOpen },
    { name: '员工权限管理', path: '/users', icon: Users },
  ];

  return (
    <>
      <aside className="w-64 bg-slate-900 text-white flex flex-col h-full border-r border-slate-800">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-xl">蟹</div>
          <h1 className="font-bold text-lg leading-tight">大闸蟹精准养殖<br /><span className="text-emerald-400 text-sm">智能决策系统</span></h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                  ? 'bg-emerald-800/50 text-emerald-400 border border-emerald-700/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(true); }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 w-full transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">系统设置</span>
          </button>
        </div>
      </aside>

      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
