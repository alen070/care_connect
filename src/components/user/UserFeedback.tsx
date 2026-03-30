import { useState, useEffect } from 'react';
import { useAuth } from '@/store/AuthContext';
import { BookingDB, NotificationDB } from '@/store/database';
import { Card, Button, Badge, EmptyState, StarRating, Textarea } from '@/components/ui';
import { Star, MessageSquare, Clock } from 'lucide-react';
import type { Booking } from '@/types';

export function UserFeedback() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    // Feedback form state
    const [activeFeedback, setActiveFeedback] = useState<string | null>(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadData = async () => {
        if (!user) return;
        try {
            // Get only completed bookings
            const data = await BookingDB.getByUserId(user.id);
            const completed = data.filter(b => b.status === 'completed');

            // Sort: Bookings without feedback first, then by date desc
            completed.sort((a, b) => {
                if (!a.feedback && b.feedback) return -1;
                if (a.feedback && !b.feedback) return 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

            setBookings(completed);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    const handleSubmitFeedback = async (booking: Booking) => {
        if (rating === 0) return;
        setSubmitting(true);

        try {
            const feedback = {
                rating,
                comment,
                createdAt: new Date().toISOString()
            };

            // 1. Update Booking
            await BookingDB.update(booking.id, { feedback });

            // 2. Notify Nurse (Profile stats are now handled automatically by DB Trigger)
            await NotificationDB.create({
                userId: booking.nurseId,
                title: 'New Review Received',
                message: `${booking.userName} left a ${rating}-star review for your ${booking.serviceType} service.`,
                type: 'info'
            });

            // Reset form & reload
            setActiveFeedback(null);
            setRating(0);
            setComment('');
            await loadData();
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />;

    if (bookings.length === 0) {
        return (
            <EmptyState
                icon={<Star className="w-8 h-8 text-gray-400" />}
                title="No Feedback Required"
                description="You don't have any completed bookings to review yet."
            />
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Star className="w-6 h-6 text-amber-500" />
                    Leave a Review
                </h2>
                <p className="text-sm text-gray-500">Your feedback helps build trust on CareConnect</p>
            </div>

            <div className="grid gap-6">
                {bookings.map((booking) => (
                    <Card key={booking.id} className="p-5 overflow-hidden">
                        <div className="flex flex-col md:flex-row gap-6 justify-between items-start">

                            {/* Booking Context */}
                            <div className="space-y-2 flex-1">
                                <div className="flex gap-2 items-center">
                                    <Badge variant={booking.feedback ? 'success' : 'warning'}>
                                        {booking.feedback ? 'Reviewed' : 'Pending Review'}
                                    </Badge>
                                    <span className="text-sm text-gray-500 flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        Completed {new Date(booking.endDate).toLocaleDateString()}
                                    </span>
                                </div>

                                <h3 className="text-lg font-semibold text-gray-900">{booking.serviceType} Service</h3>
                                <p className="text-sm text-gray-600">Provided by: <span className="font-medium text-gray-900">{booking.nurseName}</span></p>

                                {/* Existing Feedback Display */}
                                {booking.feedback && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-2">
                                        <div className="flex items-center gap-2">
                                            <StarRating rating={booking.feedback.rating} readonly size="sm" />
                                            <span className="text-sm font-medium text-gray-900">{booking.feedback.rating}/5</span>
                                        </div>
                                        {booking.feedback.comment && (
                                            <p className="text-sm text-gray-600 italic">"{booking.feedback.comment}"</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-2">Submitted on {new Date(booking.feedback.createdAt).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>

                            {/* Action Area */}
                            {!booking.feedback && (
                                <div className="w-full md:w-96 shrink-0">
                                    {activeFeedback === booking.id ? (
                                        <div className="space-y-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-4">

                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-gray-900">Rate your experience</label>
                                                <StarRating
                                                    rating={rating}
                                                    onChange={setRating}
                                                    size="lg"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                    <MessageSquare className="w-4 h-4 text-blue-500" />
                                                    Write a review <span className="text-gray-400 font-normal">(Optional)</span>
                                                </label>
                                                <Textarea
                                                    placeholder="How was the service? Was the nurse professional and helpful?"
                                                    value={comment}
                                                    onChange={(e) => setComment(e.target.value)}
                                                    rows={3}
                                                    className="text-sm"
                                                />
                                            </div>

                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => { setActiveFeedback(null); setRating(0); setComment(''); }}
                                                    className="flex-1"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    onClick={() => handleSubmitFeedback(booking)}
                                                    disabled={rating === 0}
                                                    loading={submitting}
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                                >
                                                    Submit
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={() => { setActiveFeedback(booking.id); setRating(0); setComment(''); }}
                                            className="w-full bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center justify-center gap-2"
                                        >
                                            <Star className="w-4 h-4 fill-white text-white" />
                                            Leave a Review
                                        </Button>
                                    )}
                                </div>
                            )}

                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
