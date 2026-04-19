import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type UserInfo = {
    id: number;
    username: string;
    displayName: string;
    role: string;
    avatar?: string;
};

// 预设的演示用户列表
export const DEMO_USERS: UserInfo[] = [
    { id: 1, username: 'farmer_a', displayName: '养殖户 张伟', role: '技术团队', avatar: '张' },
    { id: 2, username: 'farmer_b', displayName: '养殖户 李明', role: '运营团队', avatar: '李' },
    { id: 3, username: 'admin', displayName: '管理员 王芳', role: '系统管理', avatar: '王' },
];

// 会话有效期：3小时（毫秒）
const SESSION_DURATION = 3 * 60 * 60 * 1000;

type AuthContextType = {
    user: UserInfo | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    switchUser: (user: UserInfo) => void;
    isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserInfo | null>(() => {
        const saved = localStorage.getItem('crab_auth_user');
        const loginTime = localStorage.getItem('crab_auth_time');

        if (saved && loginTime) {
            const elapsed = Date.now() - parseInt(loginTime, 10);
            if (elapsed < SESSION_DURATION) {
                return JSON.parse(saved);
            }
            // 会话已过期，清除
            localStorage.removeItem('crab_auth_user');
            localStorage.removeItem('crab_auth_time');
            return null;
        }
        return null;
    });

    // 持久化用户信息和登录时间
    useEffect(() => {
        if (user) {
            localStorage.setItem('crab_auth_user', JSON.stringify(user));
            // 如果还没有登录时间（首次登录），才设置
            if (!localStorage.getItem('crab_auth_time')) {
                localStorage.setItem('crab_auth_time', Date.now().toString());
            }
        } else {
            localStorage.removeItem('crab_auth_user');
            localStorage.removeItem('crab_auth_time');
        }
    }, [user]);

    // 定时检查会话是否过期（每分钟检查一次）
    useEffect(() => {
        if (!user) return;

        const checkExpiry = () => {
            const loginTime = localStorage.getItem('crab_auth_time');
            if (loginTime) {
                const elapsed = Date.now() - parseInt(loginTime, 10);
                if (elapsed >= SESSION_DURATION) {
                    console.log('会话已超过3小时，自动退出登录');
                    setUser(null);
                }
            }
        };

        const timer = setInterval(checkExpiry, 60 * 1000); // 每60秒检查一次
        return () => clearInterval(timer);
    }, [user]);

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            const response = await fetch('/api/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.user) {
                    localStorage.setItem('crab_auth_time', Date.now().toString());
                    setUser(data.user);
                    return true;
                }
            }
            return false;
        } catch (err) {
            console.error("Login request failed", err);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
    };

    const switchUser = (newUser: UserInfo) => {
        // 切换用户时重置会话时间
        localStorage.setItem('crab_auth_time', Date.now().toString());
        setUser(newUser);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, switchUser, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
