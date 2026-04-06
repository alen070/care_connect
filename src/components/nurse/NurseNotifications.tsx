import { useState, useEffect } from 'react';
import { useAuth } from '@/store/AuthContext';
import { NotificationDB } from '@/store/database';
import { Card, Spinner, EmptyState, Badge } from '@/components/ui';
import { Bell, CheckCircle, AlertTriangle, Info, Check } from 'lucide-react';
import type { Notification } from '@/types';
import { cn } from '@/utils/cn';

export function NurseNotifications({ active }: { active?: boolean }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && active !== false) {
            loadNotifications();
        }
    }, [user, active]);

    const loadNotifications = async () => {
        const data = await NotificationDB.getByUserId(user!.id);
        setNotifications(data);
        setLoading(false);
    };

    const markAsRead = async (id: string) => {
        await NotificationDB.markAsRead(id);
        loadNotifications();
    };

    const markAllAsRead = async () => {
        await NotificationDB.markAllAsRead(user!.id);
        loadNotifications();
    };

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    if (loading) {
        return <Card className="p-8 text-center"><Spinner size="sm" /><p className="text-gray-500 mt-2">Loading notifications...</p></Card>;
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        Notifications {unreadCount > 0 && <Badge variant="danger">{unreadCount} New</Badge>}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Updates on your bookings, verification, and payments.</p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <Check className="w-4 h-4" /> Mark all read
                    </button>
                )}
            </div>

            {notifications.length > 0 ? (
                <div className="space-y-3">
                    {notifications.map(notification => (
                        <Card
                            key={notification.id}
                            className={cn(
                                'p-4 transition-all',
                                !notification.read ? 'bg-blue-50/30 border-blue-200' : 'opacity-80'
                            )}
                        >
                            <div className="flex gap-4">
                                <div className="shrink-0 mt-1">
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className={cn("text-sm font-semibold mb-1", !notification.read ? "text-gray-900" : "text-gray-700")}>
                                            {notification.title || (notification.type === 'success' ? 'Update' : 'Alert')}
                                        </h4>
                                        <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                                            {new Date(notification.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className={cn("text-sm leading-snug", !notification.read ? "text-gray-700 font-medium" : "text-gray-500")}>
                                        {notification.message}
                                    </p>

                                    {!notification.read && (
                                        <button
                                            onClick={() => markAsRead(notification.id)}
                                            className="text-xs text-blue-600 font-medium mt-2 hover:text-blue-800 cursor-pointer"
                                        >
                                            Mark as read
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="No notifications"
                    description="You're all caught up! New alerts will appear here."
                    icon={<Bell className="w-8 h-8 text-gray-300" />}
                />
            )}
        </div>
    );
}
