import { Card } from '@/components/ui';
import { NotificationDB } from '@/store/database';
import { cn } from '@/utils/cn';
import type { Notification } from '@/types';

interface NotificationPanelProps {
    notifications: Notification[];
    onClose: () => void;
    mobile?: boolean;
}

export function NotificationPanel({ notifications, onClose, mobile }: NotificationPanelProps) {
    const markRead = (id: string) => {
        NotificationDB.markAsRead(id);
    };

    return (
        <>
            {!mobile && <div className="fixed inset-0" onClick={onClose} />}
            <Card className={cn(
                'shadow-lg border border-gray-200 z-50',
                mobile ? 'w-full' : 'absolute right-0 top-12 w-80'
            )}>
                <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {mobile && (
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <p className="p-4 text-sm text-gray-500 text-center">No notifications</p>
                    ) : (
                        notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10).map(n => (
                            <div key={n.id}
                                className={cn('p-3 border-b border-gray-50 text-sm cursor-pointer hover:bg-gray-50', !n.read && 'bg-blue-50/50')}
                                onClick={() => markRead(n.id)}>
                                <p className={cn('text-gray-700', !n.read && 'font-medium')}>{n.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </>
    );
}
