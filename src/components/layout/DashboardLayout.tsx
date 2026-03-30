import { useState, useEffect, type ReactNode } from 'react';
import { useAuth } from '@/store/AuthContext';
import { NotificationDB } from '@/store/database';
import { cn } from '@/utils/cn';
import { Menu, Bell, LogOut, User, Stethoscope, Shield, Building } from 'lucide-react';
import type { Notification } from '@/types';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import logo from '@/assets/logo.png';

export interface TabItem {
    id: string;
    label: string;
    icon: ReactNode;
}

interface DashboardLayoutProps {
    tabs: TabItem[];
    activeTab: string;
    onTabChange: (id: string) => void;
    children: ReactNode;
    onGoToLanding: () => void;
}

export function DashboardLayout({ tabs, activeTab, onTabChange, children, onGoToLanding }: DashboardLayoutProps) {
    const { user, isAuthenticated, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Notification state
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);

    // Poll for notifications efficiently
    useEffect(() => {
        if (!user) return;
        const fetchNotifs = async () => {
            if (document.visibilityState === 'visible') {
                const data = await NotificationDB.getByUserId(user.id);
                setNotifications(data);
            }
        };
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Logout handler passed from App (or handled here via useAuth)
    const handleLogout = async () => {
        setSidebarOpen(false);
        setShowNotifications(false);
        try {
            await logout();
            // the global listener in App.tsx will catch the auth state change and redirect to landing
        } finally {
            // fallback just in case
        }
    };

    if (!isAuthenticated || !user) return null;

    const roleConfig = {
        user: { label: 'Patient', color: 'from-blue-500 to-blue-600', icon: <User className="w-4 h-4" />, bgColor: 'bg-blue-50 text-blue-700' },
        nurse: { label: 'Nurse', color: 'from-emerald-500 to-emerald-600', icon: <Stethoscope className="w-4 h-4" />, bgColor: 'bg-emerald-50 text-emerald-700' },
        admin: { label: 'Admin', color: 'from-indigo-500 to-indigo-600', icon: <Shield className="w-4 h-4" />, bgColor: 'bg-indigo-50 text-indigo-700' },
        shelter: { label: 'Shelter', color: 'from-amber-500 to-amber-600', icon: <Building className="w-4 h-4" />, bgColor: 'bg-amber-50 text-amber-700' },
    } as const;

    const config = roleConfig[user.role];

    return (
        <div className="flex bg-gray-50 min-h-screen">
            {/* 
        ========================================
        LEFT SIDEBAR
        ========================================
      */}
            {/* Mobile Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar Content */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Brand / Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
                    <button onClick={onGoToLanding} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity text-left">
                        <div className="p-1 bg-white rounded-lg shadow-sm">
                            <img src={logo} alt="CareConnect" className="w-7 h-7 object-contain" />
                        </div>
                        <div>
                            <h1 className="text-white font-bold tracking-wide">CareConnect</h1>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider -mt-0.5">Care Assistant Finder</p>
                        </div>
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    onTabChange(tab.id);
                                    setSidebarOpen(false); // auto-close on mobile
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <div className={cn(
                                    "flex items-center justify-center transition-colors",
                                    isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                                )}>
                                    {tab.icon}
                                </div>
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom Sidebar: Role Indicator */}
                <div className="p-4 border-t border-slate-800 shrink-0">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-800/50">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm bg-gradient-to-br", config.color)}>
                            {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user.name}</p>
                            <p className="text-xs text-slate-400 truncate capitalize">{user.role}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* 
        ========================================
        RIGHT CONTENT AREA
        ========================================
      */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Top Header */}
                <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shrink-0">

                    {/* Mobile menu toggle */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-2 rounded-xl text-gray-500 hover:bg-gray-100 lg:hidden cursor-pointer"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Right side items */}
                    <div className="flex items-center gap-3 ml-auto">
                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors relative cursor-pointer"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                )}
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 sm:w-96 origin-top-right">
                                    <NotificationPanel
                                        notifications={notifications}
                                        onClose={() => setShowNotifications(false)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="w-px h-6 bg-gray-200 hidden sm:block" />

                        {/* Profile Menu Area (Simplified) */}
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => handleLogout()}
                                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>

                            {/* Avatar Only */}
                            {user.profile_photo && user.profile_photo.length > 10 ? (
                                <img
                                    src={user.profile_photo}
                                    alt={user.name}
                                    className="w-8 h-8 rounded-full object-cover border border-gray-200 shadow-sm"
                                />
                            ) : (
                                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm bg-gradient-to-br', config.color)}>
                                    {user.name[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto w-full animate-fade-in-up">
                        {children}
                    </div>
                </main>
            </div>

        </div>
    );
}
