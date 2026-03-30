import { useState, useEffect } from 'react';
import { useAuth } from '@/store/AuthContext';
import { BookingDB, NotificationDB } from '@/store/database';
import { Card, Badge, Button, EmptyState } from '@/components/ui';
import { CreditCard, CheckCircle, Clock, Download, Building } from 'lucide-react';
import type { Booking } from '@/types';
import { jsPDF } from 'jspdf';

export function UserPayments() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [payingFor, setPayingFor] = useState<string | null>(null);

    const loadData = async () => {
        if (!user) return;
        try {
            // Only show accepted, ongoing, or completed bookings (no pending/cancelled)
            const data = await BookingDB.getByUserId(user.id);
            const invoiceable = data.filter(b => ['accepted', 'ongoing', 'completed'].includes(b.status));
            // Sort: Pending payments first, then by date desc
            invoiceable.sort((a, b) => {
                if (a.paymentStatus === 'pending' && b.paymentStatus !== 'pending') return -1;
                if (a.paymentStatus !== 'pending' && b.paymentStatus === 'pending') return 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            setBookings(invoiceable);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    const handlePayOnline = async (booking: Booking) => {
        setPayingFor(booking.id);
        try {
            // Simulate payment gateway delay
            await new Promise(r => setTimeout(r, 1500));

            await BookingDB.update(booking.id, { paymentStatus: 'completed' });

            // Notify Nurse & User
            await NotificationDB.create({
                userId: booking.nurseId,
                title: 'Payment Received',
                message: `${booking.userName} has paid ₹${booking.totalAmount} online for their booking.`,
                type: 'success'
            });
            await NotificationDB.create({
                userId: booking.userId,
                title: 'Payment Successful',
                message: `Your payment of ₹${booking.totalAmount} was successful.`,
                type: 'success'
            });

            await loadData();
        } catch (e) {
            console.error(e);
        } finally {
            setPayingFor(null);
        }
    };

    const downloadReceipt = (booking: Booking) => {
        const doc = new jsPDF();
        const marginLeft = 20;
        let yPos = 30;

        // Header Title
        doc.setFontSize(22);
        doc.setTextColor(30, 64, 175); // careconnect blue approx
        doc.setFont('helvetica', 'bold');
        doc.text('CARECONNECT', marginLeft, yPos);
        yPos += 10;

        doc.setFontSize(14);
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.text('INVOICE / RECEIPT', marginLeft, yPos);
        yPos += 20;

        // Booking details line headers
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);

        const details = [
            { label: 'Booking ID:', value: booking.id.toUpperCase() },
            { label: 'Date Generated:', value: new Date().toLocaleDateString() },
            { label: 'Patient Name:', value: booking.userName },
            { label: 'Care Provider:', value: booking.nurseName },
            { label: 'Service Provided:', value: `${booking.serviceType.toUpperCase()} CARE` },
            { label: 'Payment Method:', value: booking.paymentMethod.toUpperCase() },
            { label: 'Payment Status:', value: booking.paymentStatus === 'completed' || booking.status === 'completed' ? 'COMPLETED / PAID' : 'PENDING' }
        ];

        details.forEach(item => {
            doc.setFont('helvetica', 'bold');
            doc.text(item.label, marginLeft, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(item.value, marginLeft + 45, yPos);
            yPos += 10;
        });

        yPos += 10;

        // Amount box
        doc.setFillColor(241, 245, 249);
        doc.rect(marginLeft, yPos, 170, 20, 'F');
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`TOTAL AMOUNT:`, marginLeft + 5, yPos + 14);
        doc.text(`INR ${booking.totalAmount.toLocaleString()}`, marginLeft + 120, yPos + 14);
        yPos += 40;

        // Footer
        doc.setFontSize(12);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        doc.text('Thank you for choosing CareConnect!', marginLeft, yPos);

        doc.save(`Invoice-${booking.id.slice(0, 8)}.pdf`);
    };

    if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />;

    if (bookings.length === 0) {
        return (
            <EmptyState
                icon={<CreditCard className="w-8 h-8 text-gray-400" />}
                title="No Payment History"
                description="You have no active or completed bookings that require payment."
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    Payments & Invoices
                </h2>
            </div>

            <div className="grid gap-4">
                {bookings.map((booking) => {
                    const isPaid = booking.paymentStatus === 'completed' || booking.status === 'completed';

                    return (
                        <Card key={booking.id} className="p-5 overflow-hidden relative">
                            {/* Status Ribbon */}
                            <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white rounded-bl-lg
              ${isPaid ? 'bg-emerald-500' : 'bg-amber-500'}
            `}>
                                {isPaid ? 'PAID' : 'DUE'}
                            </div>

                            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mt-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900">{booking.serviceType} Care</span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-sm text-gray-600">{new Date(booking.startDate).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <Building className="w-4 h-4" /> Provider: {booking.nurseName}
                                    </p>
                                    <div className="flex gap-2 mt-2">
                                        <Badge variant="neutral">{booking.paymentMethod.toUpperCase()}</Badge>
                                        <span className="text-sm font-medium text-gray-900">
                                            ₹{booking.totalAmount > 0 ? booking.totalAmount.toLocaleString() : 'Pending sync'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    {!isPaid && booking.paymentMethod === 'online' && (
                                        <Button
                                            onClick={() => handlePayOnline(booking)}
                                            loading={payingFor === booking.id}
                                            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            Pay ₹{booking.totalAmount > 0 ? booking.totalAmount : ''} Online
                                        </Button>
                                    )}

                                    {!isPaid && booking.paymentMethod === 'cod' && (
                                        <Badge variant="warning" className="px-3 py-2 flex items-center gap-1">
                                            <Clock className="w-4 h-4" /> Pay Onsite
                                        </Badge>
                                    )}

                                    {isPaid && (
                                        <>
                                            <Badge variant="success" className="px-3 py-2 flex items-center gap-1">
                                                <CheckCircle className="w-4 h-4" /> Payment Completed
                                            </Badge>
                                            <Button
                                                variant="outline"
                                                onClick={() => downloadReceipt(booking)}
                                                className="flex items-center gap-2 shrink-0"
                                            >
                                                <Download className="w-4 h-4" /> Receipt
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
