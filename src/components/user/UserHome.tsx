import { useState, useEffect } from 'react';
import { useAuth } from '@/store/AuthContext';
import { BookingDB, ShelterReportDB } from '@/store/database';
import { Card, Button, StatsCard } from '@/components/ui';
import { Calendar, Heart, ShieldAlert, Activity, ArrowRight, Bell } from 'lucide-react';
import type { Booking, ShelterReport } from '@/types';

interface Props {
    onNavigate: (tab: string) => void;
}

export function UserHome({ onNavigate }: Props) {
    const { user } = useAuth();
    const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
    const [activeReports, setActiveReports] = useState<ShelterReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!user) return;
            try {
                const [bookings, myReports] = await Promise.all([
                    BookingDB.getByUserId(user.id),
                    ShelterReportDB.getByReporterId(user.id)
                ]);

                const ongoingBookings = bookings.filter(b => ['pending', 'accepted', 'ongoing'].includes(b.status));
                ongoingBookings.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
                setActiveBookings(ongoingBookings);

                setActiveReports(myReports.filter(r => r.status !== 'resolved'));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user]);

    if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-xl" />;

    const nextBooking = activeBookings[0];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Good Morning, {user?.name?.split(' ')[0]}! 👋</h1>
                    <p className="text-gray-600 mt-1">Manage your care bookings, payments, and help reports.</p>
                </div>
                <Button
                    variant="danger"
                    onClick={() => onNavigate('report')}
                    className="flex items-center gap-2"
                >
                    <ShieldAlert className="w-5 h-5" /> Emergency Help Report
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard
                    icon={<Activity className="w-5 h-5 text-blue-600" />}
                    label="Active Care"
                    value={activeBookings.length}
                    color="bg-blue-50"
                />
                <StatsCard
                    icon={<Heart className="w-5 h-5 text-amber-600" />}
                    label="Active Reports"
                    value={activeReports.length}
                    color="bg-amber-50"
                />
            </div>

            <div className="grid md:grid-cols-2 gap-6">

                {/* Next Vist / Active Booking */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            Next Scheduled Visit
                        </h3>
                        <Button variant="outline" onClick={() => onNavigate('bookings')} className="text-sm py-1.5 px-3">
                            View All
                        </Button>
                    </div>

                    {nextBooking ? (
                        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold text-gray-900">{nextBooking.serviceType} Care</h4>
                                    <p className="text-sm text-gray-600 mt-1">Provider: {nextBooking.nurseName}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-indigo-700 block">
                                        {new Date(nextBooking.startDate).toLocaleDateString()}
                                    </span>
                                    <span className="text-xs text-indigo-500 font-medium uppercase mt-1 block">
                                        Status: {nextBooking.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-xl">
                            <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-900">No upcoming visits</p>
                            <p className="text-xs text-gray-500 mb-4">Find a qualified nurse for your needs.</p>
                            <Button onClick={() => onNavigate('search')} className="text-sm">Find Care Providers</Button>
                        </div>
                    )}
                </Card>

                {/* Quick Actions */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Shortcuts</h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => onNavigate('search')}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-200 text-left group"
                        >
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <span className="font-medium text-gray-900 block">Book New Care Service</span>
                                <span className="text-xs text-gray-500 block">Browse verified nurses</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                        </button>

                        <button
                            onClick={() => onNavigate('payments')}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-200 text-left group"
                        >
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <span className="font-medium text-gray-900 block">Pay Invoices</span>
                                <span className="text-xs text-gray-500 block">Manage bookings pending payment</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
                        </button>

                        <button
                            onClick={() => onNavigate('notifications')}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-200 text-left group"
                        >
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <span className="font-medium text-gray-900 block">View Notifications</span>
                                <span className="text-xs text-gray-500 block">Check system alerts</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
