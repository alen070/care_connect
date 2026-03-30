import type { Booking } from '@/types';

export function calculateBookingAmount(booking: Booking, baseRate: number, rateType: string = 'hourly'): number {
    if (booking.totalAmount > 0) return booking.totalAmount;

    // Fallback calculation logic mirrored from UserDashboard.tsx
    let multiplier = 1;
    if (rateType === 'hourly') multiplier = 8;
    if (rateType === 'weekly') multiplier = 1 / 7;
    if (rateType === 'monthly') multiplier = 1 / 30;

    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    return Math.round(days * baseRate * multiplier);
}
