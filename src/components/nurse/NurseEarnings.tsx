import { useState, useEffect } from 'react';
import { useAuth } from '@/store/AuthContext';
import { BookingDB, NurseProfileDB } from '@/store/database';
import { Card, Spinner, EmptyState } from '@/components/ui';
import { IndianRupee, Wallet, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import type { Booking, NurseProfile } from '@/types';
import { calculateBookingAmount } from '@/utils/booking';

export function NurseEarnings() {
    const { user } = useAuth();
    const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<NurseProfile | null>(null);

    useEffect(() => {
        if (user) {
            Promise.all([
                BookingDB.getByNurseId(user.id),
                NurseProfileDB.getByUserId(user.id)
            ]).then(([bookingsData, profileData]) => {
                const completed = bookingsData.filter(b => b.status === 'completed');
                completed.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
                setCompletedBookings(completed);
                if (profileData) setProfile(profileData);
                setLoading(false);
            });
        }
    }, [user]);

    if (loading) {
        return <Card className="p-8 text-center"><Spinner size="sm" /><p className="text-gray-500 mt-2">Loading earnings...</p></Card>;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const thisMonthStr = todayStr.substring(0, 7); // YYYY-MM

    const lifetimeEarnings = completedBookings.reduce((sum: number, b: Booking) =>
        sum + calculateBookingAmount(b, profile?.baseRate || 0, profile?.rateType), 0);

    const monthEarnings = completedBookings
        .filter((b: Booking) => b.endDate.startsWith(thisMonthStr) || b.createdAt.startsWith(thisMonthStr))
        .reduce((sum: number, b: Booking) => sum + calculateBookingAmount(b, profile?.baseRate || 0, profile?.rateType), 0);

    const todayEarnings = completedBookings
        .filter((b: Booking) => b.endDate === todayStr)
        .reduce((sum: number, b: Booking) => sum + calculateBookingAmount(b, profile?.baseRate || 0, profile?.rateType), 0);

    // Separate by payment method 
    const codEarnings = completedBookings
        .filter((b: Booking) => b.paymentMethod === 'cod')
        .reduce((sum: number, b: Booking) => sum + calculateBookingAmount(b, profile?.baseRate || 0, profile?.rateType), 0);

    const onlineEarnings = completedBookings
        .filter((b: Booking) => b.paymentMethod === 'online')
        .reduce((sum: number, b: Booking) => sum + calculateBookingAmount(b, profile?.baseRate || 0, profile?.rateType), 0);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-gray-900">Earnings & Payments</h2>
                <p className="text-gray-500 text-sm mt-1">Track your completed jobs and revenue.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-emerald-100" />
                        </div>
                    </div>
                    <p className="text-emerald-100 font-medium text-sm mb-1">Lifetime Earnings</p>
                    <h3 className="text-3xl font-bold">₹{lifetimeEarnings.toLocaleString()}</h3>
                </Card>

                <Card className="p-5 border-emerald-100 shadow-sm">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                        <IndianRupee className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-gray-500 font-medium text-sm mb-1">This Month</p>
                    <h3 className="text-2xl font-bold text-gray-900">₹{monthEarnings.toLocaleString()}</h3>
                </Card>

                <Card className="p-5 shadow-sm">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                        <Wallet className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-gray-500 font-medium text-sm mb-1">Today</p>
                    <h3 className="text-2xl font-bold text-gray-900">₹{todayEarnings.toLocaleString()}</h3>
                </Card>

                <Card className="p-5 shadow-sm">
                    <div className="flex justify-between h-full flex-col">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Online Pay</span>
                                <span className="font-semibold">₹{onlineEarnings.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /> Onsite Payment</span>
                                <span className="font-semibold">₹{codEarnings.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="rounded-full h-1.5 w-full bg-gray-100 mt-4 overflow-hidden flex">
                            <div className="bg-emerald-500 h-full" style={{ width: `${lifetimeEarnings ? (onlineEarnings / lifetimeEarnings) * 100 : 0}%` }} />
                            <div className="bg-amber-500 h-full" style={{ width: `${lifetimeEarnings ? (codEarnings / lifetimeEarnings) * 100 : 0}%` }} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Full Payment History */}
            <Card className="overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                </div>

                {completedBookings.length > 0 ? (
                    <div className="divide-y divide-gray-100 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-sm">
                                    <th className="py-3 px-5 font-medium">Job Ref</th>
                                    <th className="py-3 px-5 font-medium">Patient</th>
                                    <th className="py-3 px-5 font-medium">Date Completed</th>
                                    <th className="py-3 px-5 font-medium">Method</th>
                                    <th className="py-3 px-5 font-medium">Status</th>
                                    <th className="py-3 px-5 font-medium text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {completedBookings.map((booking: Booking) => {
                                    const isPaid = booking.paymentStatus === 'completed' || booking.status === 'completed';
                                    return (
                                        <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-5 font-mono text-gray-500 text-xs">{booking.id.split('-')[0]}</td>
                                            <td className="py-4 px-5 font-medium text-gray-900">{booking.userName}</td>
                                            <td className="py-4 px-5 text-gray-600">{booking.endDate}</td>
                                            <td className="py-4 px-5">
                                                <span className="capitalize text-gray-600">{booking.paymentMethod === 'cod' ? 'Onsite Payment' : 'Online'}</span>
                                            </td>
                                            <td className="py-4 px-5">
                                                {isPaid ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-medium">
                                                        <CheckCircle className="w-3.5 h-3.5" /> Paid
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full text-xs font-medium">
                                                        <Clock className="w-3.5 h-3.5" /> Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-5 font-bold text-gray-900 text-right">
                                                ₹{calculateBookingAmount(booking, profile?.baseRate || 0, profile?.rateType).toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        title="No earnings yet"
                        description="Complete jobs to see your earnings history here."
                        icon={<IndianRupee className="w-6 h-6 text-gray-400" />}
                    />
                )}
            </Card>
        </div>
    );
}
