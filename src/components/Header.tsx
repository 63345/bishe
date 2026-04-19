import { useState, useEffect, useRef } from 'react';
import { Bell, User, Menu, AlertTriangle, Info, CheckCircle, X, LogOut, ChevronDown, Users } from 'lucide-react';
import { useAuth, DEMO_USERS } from '../contexts/AuthContext';

export default function Header({ title, onMenuClick }: { title: string, onMenuClick?: () => void }) {
  const { user, logout, switchUser } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'warning',
      title: '水质异常预警',
      message: '1号池塘溶氧量持续低于 4.5 mg/L，请立即开启增氧机。',
      time: '10分钟前',
      read: false
    },
    {
      id: 2,
      type: 'info',
      title: '市场行情更新',
      message: '江苏阳澄湖产区 大闸蟹(3两母) 价格上涨 1.2 元/斤。',
      time: '2小时前',
      read: true
    },
    {
      id: 3,
      type: 'success',
      title: '设备离线恢复',
      message: '2号池塘水温传感器已重新连接成功。',
      time: '昨天 15:30',
      read: true
    }
  ]);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // 模拟发送一个新的紧急告警消息以供您查看效果
  useEffect(() => {
    const timer = setTimeout(() => {
      const newNotif = {
        id: Date.now(),
        type: 'warning',
        title: '【紧急预警】氨氮超标',
        message: '检测到 3号塘 氨氮指标突增至 0.8 mg/L，水草出现轻微腐烂迹象，请及时使用底质改良剂！',
        time: '刚刚',
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
    }, 5000); // 5秒后推入新警报

    return () => clearTimeout(timer);
  }, []);

  // 点击外部关闭弹出层
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      default: return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* removed search box */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500 border-2 border-white"></span>
              </span>
            )}
          </button>

          {/* Notification Dropdown Panel */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  通知中心
                  {unreadCount > 0 && (
                    <span className="bg-orange-100 text-orange-600 text-[10px] px-2 py-0.5 rounded-full font-medium">
                      {unreadCount} 未读
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                    全部标为已读
                  </button>
                )}
              </div>

              <div className="max-h-[380px] overflow-y-auto scrollbar-hide">
                {notifications.length > 0 ? (
                  <div className="flex flex-col">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors relative group
                          ${!notif.read ? 'bg-blue-50/20' : 'bg-white'}`}
                      >
                        {!notif.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                        <div className="flex gap-3">
                          <div className="shrink-0 mt-0.5">
                            {getIcon(notif.type)}
                          </div>
                          <div className="flex-1 pr-6">
                            <div className={`text-sm font-bold mb-1 ${!notif.read ? 'text-slate-800' : 'text-slate-600'}`}>
                              {notif.title}
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed mb-2">
                              {notif.message}
                            </p>
                            <div className="text-[10px] text-slate-400 font-medium">
                              {notif.time}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeNotification(notif.id); }}
                          className="absolute right-3 top-4 p-1 text-slate-300 hover:text-slate-500 hover:bg-slate-200 rounded opacity-0 group-hover:opacity-100 transition-all"
                          title="移除此通知"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center flex flex-col items-center justify-center">
                    <Bell className="w-10 h-10 text-slate-200 mb-3" />
                    <p className="text-sm text-slate-500">暂无任何通知历史</p>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                <button onClick={() => { handleMarkAllRead(); setIsNotifOpen(false); }} className="text-sm text-slate-500 hover:text-emerald-600 font-medium transition-colors">
                  查看全部历史记录
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 pl-4 border-l border-slate-200 cursor-pointer hover:bg-slate-50 rounded-lg px-3 py-1.5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              {user?.avatar || <User className="w-4 h-4" />}
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-[100px] truncate">
              {user?.displayName || '未登录'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 hidden sm:block transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* User Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
              {/* Current User Info */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {user?.avatar || '?'}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{user?.displayName}</div>
                    <div className="text-xs text-emerald-600 mt-0.5">{user?.role}</div>
                  </div>
                </div>
              </div>

              {/* Switch User Section */}
              <div className="p-3 border-b border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 px-1">
                  <Users className="w-3 h-3" />
                  切换用户
                </div>
                <div className="space-y-1">
                  {DEMO_USERS.filter(u => u.id !== user?.id).map(u => (
                    <button
                      key={u.id}
                      onClick={() => { switchUser(u); setIsUserMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                        {u.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-slate-700 font-medium">{u.displayName}</div>
                        <div className="text-[11px] text-slate-400">{u.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Logout Button */}
              <div className="p-2">
                <button
                  onClick={() => { logout(); setIsUserMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
