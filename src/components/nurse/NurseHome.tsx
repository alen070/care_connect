import { useState, useEffect } from 'react';
import { useAuth } from '@/store/AuthContext';
import { NurseProfileDB, BookingDB, DocumentDB } from '@/store/database';
import { Card, Badge, Spinner } from '@/components/ui';
import { CheckCircle, Clock, XCircle, Calendar, IndianRupee, Activity, Users, FileUp } from 'lucide-react';
import type { NurseProfile, Booking, NurseDocument } from '@/types';
import { cn } from '@/utils/cn';
import { calculateBookingAmount } from '@/utils/booking';

export function NurseHome({ onNavigate, active }: { onNavigate: (tab: string) => void, active?: boolean }) {
    const { user } = useAuth();
    const [profile, setProfile] = useState<NurseProfile | undefined>(undefined);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [documents, setDocuments] = useState<NurseDocument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || active === false) return;

        Promise.all([
            NurseProfileDB.getByUserId(user.id),
            BookingDB.getByNurseId(user.id),
            DocumentDB.getMetadataByNurseId(user.id)
        ]).then(async ([initialProfile, bookingsData, docsData]) => {
            let profileData = initialProfile;
            
            // Auto-repair if nurse profile is missing
            if (!profileData) {
                console.log('[NurseHome] Profile missing, creating default profile.');
                try {
                    const newProfile = await NurseProfileDB.create({
                        userId: user.id, specializations: [], experience: 0,
                        baseRate: 0, rateType: 'hourly', bio: '', location: user.location || '',
                        serviceAreas: [], availability: true, verificationStatus: 'pending', documents: []
                    });
                    profileData = newProfile as any;
                } catch (e) {
                    console.error('[NurseHome] Auto-repair failed:', e);
                }
            }
            
            setProfile(profileData || undefined);
            setBookings(bookingsData);
            setDocuments(docsData);
            setLoading(false);
        });
    }, [user, active]);

    if (loading) {
        return (
            <Card className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
                <Spinner size="lg" />
                <p className="text-gray-500 mt-4">Loading your dashboard...</p>
            </Card>
        );
    }

    // Derived Stats
    const pendingRequests = bookings.filter(b => b.status === 'pending');
    const activeBookings = bookings.filter(b => b.status === 'accepted');
    const completedBookings = bookings.filter(b => b.status === 'completed');

    // Earnings Calc
    const todayStr = new Date().toISOString().split('T')[0];
    const thisMonthStr = todayStr.substring(0, 7); // YYYY-MM

    const thisMonthEarnings = completedBookings
        .filter(b => b.endDate.startsWith(thisMonthStr) || b.createdAt.startsWith(thisMonthStr))
        .reduce((sum, b) => sum + calculateBookingAmount(b, profile?.baseRate || 0, profile?.rateType), 0);

    const todaysVisits = activeBookings.filter(b => {
        return b.startDate <= todayStr && b.endDate >= todayStr;
    });

    return (
        <div className="space-y-6">
            {/* Header Greeting */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}</h2>
                <p className="text-gray-500">Here's what's happening today.</p>
            </div>

            {/* Verification Banner */}
            {!profile ? (
                <Card className="p-4 bg-blue-50 border-blue-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <div>
                            <p className="font-medium text-gray-900">Complete Your Profile</p>
                            <p className="text-sm text-gray-600">Set up your profile and upload documents to get verified.</p>
                        </div>
                    </div>
                    <button onClick={() => onNavigate('profile')} className="text-sm font-medium text-blue-700 bg-white px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 cursor-pointer">
                        Go to Profile
                    </button>
                </Card>
            ) : profile.verificationStatus !== 'approved' ? (
                <Card className={cn('p-4 flex items-center justify-between',
                    profile.verificationStatus === 'pending' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
                )}>
                    <div className="flex items-center gap-3">
                        {profile.verificationStatus === 'pending' ? (
                            documents.length === 0 ? <FileUp className="w-5 h-5 text-amber-600" /> : <Clock className="w-5 h-5 text-amber-600" />
                        ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <div>
                            <p className="font-medium text-gray-900">
                                {profile.verificationStatus === 'pending' 
                                    ? (documents.length === 0 ? 'Action Required: Verification' : 'Status: Pending Review')
                                    : 'Status: Rejected'}
                            </p>
                            <p className="text-sm text-gray-600">
                                {profile.verificationStatus === 'pending'
                                    ? (documents.length === 0 
                                        ? 'Please upload your documents for further verification to start receiving bookings.' 
                                        : 'Your documents are currently under review by our admin team.')
                                    : 'Your verification was rejected. Please review your documents.'}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => onNavigate('documents')} className="text-sm font-medium text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                        {documents.length === 0 ? 'Upload Documents' : 'View Documents'}
                    </button>
                </Card>
            ) : (
                <Card className="p-4 bg-emerald-50 border-emerald-200 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <div>
                        <p className="font-medium text-emerald-900">Profile Verified</p>
                        <p className="text-sm text-emerald-700">You are visible to patients searching for care providers.</p>
                    </div>
                </Card>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-5 flex flex-col gap-2 cursor-pointer hover:border-blue-300 transition-colors" onClick={() => onNavigate('bookings')}>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-2">
                        <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">New Requests</p>
                    <div className="flex items-end gap-2">
                        <h3 className="text-2xl font-bold text-gray-900">{pendingRequests.length}</h3>
                        {pendingRequests.length > 0 && <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 mb-1.5"></span>}
                    </div>
                </Card>

                <Card className="p-5 flex flex-col gap-2 cursor-pointer hover:border-emerald-300 transition-colors" onClick={() => onNavigate('bookings')}>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-2">
                        <Activity className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Active Jobs</p>
                    <h3 className="text-2xl font-bold text-gray-900">{activeBookings.length}</h3>
                </Card>

                <Card className="p-5 flex flex-col gap-2 cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => onNavigate('bookings')}>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-2">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Total Bookings</p>
                    <h3 className="text-2xl font-bold text-gray-900">{bookings.length}</h3>
                </Card>

                <Card className="p-5 flex flex-col gap-2 cursor-pointer hover:border-amber-300 transition-colors" onClick={() => onNavigate('earnings')}>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-2">
                        <IndianRupee className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">This Month</p>
                    <h3 className="text-2xl font-bold text-gray-900">₹{thisMonthEarnings.toLocaleString()}</h3>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Urgent Attention / Action Items */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Requires Attention</h3>
                    {pendingRequests.length > 0 ? (
                        <div className="space-y-3">
                            {pendingRequests.slice(0, 3).map(booking => (
                                <Card key={booking.id} className="p-4 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{booking.userName}</h4>
                                            <p className="text-sm text-gray-500">{booking.serviceType}</p>
                                        </div>
                                        <Badge variant="warning">New Request</Badge>
                                    </div>
                                    <div className="flex items-center justify-between mt-3">
                                        <p className="text-sm font-medium text-gray-700">₹{booking.totalAmount.toLocaleString()}</p>
                                        <button onClick={() => onNavigate('bookings')} className="text-sm text-blue-600 font-medium hover:text-blue-800 cursor-pointer">
                                            Review →
                                        </button>
                                    </div>
                                </Card>
                            ))}
                            {pendingRequests.length > 3 && (
                                <button onClick={() => onNavigate('bookings')} className="w-full text-center text-sm text-gray-500 py-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                    View {pendingRequests.length - 3} more requests
                                </button>
                            )}
                        </div>
                    ) : (
                        <Card className="p-6 text-center text-gray-500 bg-gray-50 border-dashed">
                            <CheckCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p>You're all caught up!</p>
                        </Card>
                    )}
                </div>

                {/* Today's Schedule Preview */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
                    {todaysVisits.length > 0 ? (
                        <div className="space-y-3">
                            {todaysVisits.slice(0, 3).map(booking => (
                                <Card key={booking.id} className="p-4 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{booking.userName}</h4>
                                            <p className="text-sm text-gray-500">{booking.serviceType}</p>
                                        </div>
                                        <Badge variant="success">Active</Badge>
                                    </div>
                                    <div className="flex items-center justify-between mt-3">
                                        <p className="text-sm text-gray-600 flex items-center gap-1">
                                            <Clock className="w-4 h-4" /> Ongoing
                                        </p>
                                        <button onClick={() => onNavigate('bookings')} className="text-sm text-emerald-600 font-medium hover:text-emerald-800 cursor-pointer">
                                            Details →
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="p-6 text-center text-gray-500 bg-gray-50 border-dashed">
                            <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p>No visits scheduled for today.</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
