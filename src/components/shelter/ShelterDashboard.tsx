/**
 * ============================================
 * SHELTER DASHBOARD
 * ============================================
 * Features:
 * - View assigned humanitarian reports
 * - Red "New" badge for pending reports
 * - Report cards with image preview + embedded map
 * - Accept workflow (reported → assigned)
 * - Status tracking with timestamps
 * - Supabase Realtime for live updates
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/store/AuthContext';
import { ShelterReportDB, ShelterDB, NotificationDB } from '@/store/database';
import { supabase } from '@/lib/supabase';
import { Button, Card, Badge, EmptyState, Spinner, Modal, ImageViewerModal } from '@/components/ui';
import {
    MapPin, Clock, CheckCircle, AlertTriangle, Eye, Image,
    Building, FileText, Calendar
} from 'lucide-react';
import type { ShelterReport, Shelter } from '@/types';
import { cn } from '@/utils/cn';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ShelterAccount } from './ShelterAccount';
import { User } from 'lucide-react';

type Tab = 'pending' | 'accepted' | 'all' | 'account';

export function ShelterDashboard({ onGoToLanding }: { onGoToLanding: () => void }) {
    const { user } = useAuth();
    const [shelter, setShelter] = useState<Shelter | undefined>();
    const [reports, setReports] = useState<ShelterReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('pending');
    const [selectedReport, setSelectedReport] = useState<ShelterReport | null>(null);

    // Load shelter + assigned reports
    const loadData = useCallback(async () => {
        if (!user) return;
        let s = await ShelterDB.getByUserId(user.id);
        
        // Auto-Repair/Creation if missing
        if (!s) {
            console.log('[ShelterDashboard] Facility missing, attempting auto-link/creation');
            // Try email link first
            s = await ShelterDB.getByEmail(user.email);
            if (s && !s.shelterUserId) {
                await ShelterDB.update(s.id, { shelterUserId: user.id });
                s = await ShelterDB.getByUserId(user.id);
            }
            
            if (!s) {
                console.log('[ShelterDashboard] Creating default facility record');
                s = await ShelterDB.create({
                    name: (user.name || 'New') + ' Shelter',
                    address: user.location || 'Pending Address',
                    latitude: 0,
                    longitude: 0,
                    phone: user.phone || 'Pending Phone',
                    email: user.email,
                    capacity: 50,
                    shelterUserId: user.id
                });
            }
        }

        setShelter(s);
        if (s) {
            const r = await ShelterReportDB.getByShelterId(s.id);
            setReports(r);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Supabase Realtime subscription for live updates
    useEffect(() => {
        if (!shelter) return;

        const channel = supabase
            .channel('shelter-reports-live')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'shelter_reports',
                filter: `assigned_shelter_id=eq.${shelter.id}`,
            }, () => {
                // Reload reports on any change
                loadData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [shelter, loadData]);

    // Accept a report
    const handleAccept = async (reportId: string) => {
        await ShelterReportDB.update(reportId, {
            status: 'assigned',
            acceptedAt: new Date().toISOString(),
        });

        // Notify the reporter
        const report = reports.find(r => r.id === reportId);
        if (report) {
            await NotificationDB.create({
                userId: report.reportedBy,
                title: 'Report Accepted',
                message: `Your humanitarian report at "${report.locationDescription}" has been accepted by ${shelter?.name || 'a shelter'}.`,
                type: 'success',
            });
        }

        setSelectedReport(null);
        loadData();
    };

    if (loading) {
        return (
            <Card className="p-12 text-center">
                <Spinner size="sm" />
                <p className="text-sm text-gray-500 mt-3">Loading shelter dashboard...</p>
            </Card>
        );
    }

    if (!shelter) {
        return (
            <Card className="p-12 text-center space-y-4 border-red-100">
                <div className="p-4 bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border border-red-100">
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Connection Failed</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    We could not securely link your account to your facility record. Please ensure you have a stable connection and try again.
                </p>
                <div className="flex flex-col gap-3 pt-4">
                    <Button 
                        variant="primary" 
                        onClick={() => {
                            setLoading(true);
                            loadData();
                        }}
                    >
                        Retry Connection
                    </Button>
                </div>
            </Card>
        );
    }

    // New check for missing coordinates
    const hasMissingCoords = shelter.latitude === 0 && shelter.longitude === 0;

    const pendingReports = reports.filter(r => r.status === 'reported' || r.status === 'notified');
    const acceptedReports = reports.filter(r => r.status === 'assigned');

    const tabs = [
        {
            id: 'pending' as Tab,
            label: 'Pending Reports',
            icon: <AlertTriangle className="w-4 h-4" />,
            count: pendingReports.length,
        },
        {
            id: 'accepted' as Tab,
            label: 'Accepted',
            icon: <CheckCircle className="w-4 h-4" />,
            count: acceptedReports.length,
        },
        {
            id: 'all' as Tab,
            label: 'All Reports',
            icon: <FileText className="w-4 h-4" />,
            count: reports.length,
        },
        {
            id: 'account' as Tab,
            label: 'My Account',
            icon: <User className="w-4 h-4" />,
        },
    ];

    const getCurrentReports = () => {
        switch (activeTab) {
            case 'pending': return pendingReports;
            case 'accepted': return acceptedReports;
            case 'all': return reports;
            default: return [];
        }
    };

    return (
        <DashboardLayout
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as Tab)}
            onGoToLanding={onGoToLanding}
        >
            <div className="space-y-6">
                {hasMissingCoords && activeTab !== 'account' && (
                    <div className="bg-amber-100 border border-amber-200 p-4 rounded-xl flex items-center gap-4 animate-bounce">
                        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-bold text-amber-900">Incomplete Shelter Location</p>
                            <p className="text-xs text-amber-700">Your shelter is currently hidden from the map because coordinates are missing.</p>
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => setActiveTab('account')}>
                            Fix Now
                        </Button>
                    </div>
                )}

                {activeTab === 'account' ? (
                    <ShelterAccount shelter={shelter} onUpdate={setShelter} />
                ) : (
                    <>
                        {/* Shelter Info Card */}
                        <Card className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-100 rounded-2xl">
                                    <Building className="w-6 h-6 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900">{shelter.name}</h3>
                                    <p className="text-sm text-gray-600">{shelter.address}</p>
                                    <p className="text-xs text-gray-500 mt-1">📞 {shelter.phone} · ✉️ {shelter.email} · Capacity: {shelter.capacity}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-amber-600">{pendingReports.length}</p>
                                    <p className="text-xs text-gray-500">Pending</p>
                                </div>
                            </div>
                        </Card>

                        {/* Report Cards */}
                        {getCurrentReports().length === 0 ? (
                            <EmptyState
                                icon={<MapPin className="w-8 h-8 text-gray-400" />}
                                title={activeTab === 'pending' ? 'No pending reports' : activeTab === 'accepted' ? 'No accepted reports' : 'No reports yet'}
                                description={activeTab === 'pending'
                                    ? 'Great news! There are no pending humanitarian reports assigned to your shelter.'
                                    : 'Reports will appear here once they are assigned to your shelter.'}
                            />
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {getCurrentReports().map(report => (
                                    <ReportCard
                                        key={report.id}
                                        report={report}
                                        shelterName={shelter.name}
                                        onAccept={() => handleAccept(report.id)}
                                        onViewDetail={() => setSelectedReport(report)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Detail Modal */}
                {selectedReport && (
                    <Modal isOpen onClose={() => setSelectedReport(null)} title="Report Details" size="xl">
                        <ReportDetail
                            report={selectedReport}
                            shelterName={shelter.name}
                            onAccept={() => handleAccept(selectedReport.id)}
                        />
                    </Modal>
                )}
            </div>
        </DashboardLayout>
    );
}

/* ─────────────────────────────────────────── */
/*              REPORT CARD                    */
/* ─────────────────────────────────────────── */

function ReportCard({
    report,
    shelterName: _shelterName,
    onAccept,
    onViewDetail,
}: {
    report: ShelterReport;
    shelterName: string;
    onAccept: () => void;
    onViewDetail: () => void;
}) {
    const isPending = report.status === 'reported' || report.status === 'notified';
    const isAssigned = report.status === 'assigned';

    return (
        <Card className={cn('overflow-hidden', isPending && 'border-red-200 shadow-red-100 shadow-md')}>
            {/* Red "NEW" banner for pending */}
            {isPending && (
                <div className="bg-red-500 text-white text-xs font-bold text-center py-1.5 animate-pulse">
                    🔔 NEW REPORT — Action Required
                </div>
            )}

            {/* Image Preview */}
            {report.photo && (
                <div className="relative h-40 bg-gray-100">
                    <img
                        src={report.photo}
                        alt="Report"
                        loading="lazy"
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={onViewDetail}
                    />
                    <div className="absolute top-2 right-2">
                        <Badge variant={isPending ? 'danger' : isAssigned ? 'success' : 'neutral'}>
                            {report.status === 'reported' ? 'New' : report.status === 'assigned' ? 'Accepted' : report.status}
                        </Badge>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Location & Time */}
                <div>
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-500" />
                        {report.locationDescription || 'Unknown Location'}
                    </h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(report.createdAt).toLocaleString()}
                    </p>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 line-clamp-2">{report.description}</p>

                {/* Mini Map */}
                <div className="rounded-lg overflow-hidden border border-gray-200 h-32">
                    <iframe
                        title={`Map for report ${report.id}`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${report.longitude - 0.01},${report.latitude - 0.01},${report.longitude + 0.01},${report.latitude + 0.01}&layer=mapnik&marker=${report.latitude},${report.longitude}`}
                    />
                </div>

                {/* Coordinates */}
                <p className="text-xs text-gray-400">
                    📍 {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                </p>

                {/* Accepted timestamp */}
                {isAssigned && report.acceptedAt && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Accepted on {new Date(report.acceptedAt).toLocaleString()}
                    </p>
                )}

                {/* Reporter */}
                <p className="text-xs text-gray-500">
                    Reported by: {report.reporterName}
                </p>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <Button size="sm" variant="ghost" onClick={onViewDetail}>
                        <Eye className="w-3.5 h-3.5" /> View Details
                    </Button>
                    {isPending && (
                        <Button size="sm" variant="success" onClick={onAccept}>
                            <CheckCircle className="w-3.5 h-3.5" /> Accept
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}

/* ─────────────────────────────────────────── */
/*           REPORT DETAIL MODAL               */
/* ─────────────────────────────────────────── */

function ReportDetail({
    report,
    shelterName,
    onAccept,
}: {
    report: ShelterReport;
    shelterName: string;
    onAccept: () => void;
}) {
    const isPending = report.status === 'reported' || report.status === 'notified';
    const [confirming, setConfirming] = useState(false);
    const [imageViewerOpen, setImageViewerOpen] = useState(false);

    return (
        <div className="space-y-6">
            {/* Status Banner */}
            <div className={cn('rounded-xl p-4 text-center', isPending ? 'bg-red-50' : 'bg-emerald-50')}>
                {isPending ? (
                    <>
                        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                        <p className="text-lg font-bold text-red-700">Pending — Action Required</p>
                        <p className="text-sm text-red-600">This report needs your attention</p>
                    </>
                ) : (
                    <>
                        <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-lg font-bold text-emerald-700">Accepted by {shelterName}</p>
                        {report.acceptedAt && (
                            <p className="text-sm text-emerald-600">on {new Date(report.acceptedAt).toLocaleString()}</p>
                        )}
                    </>
                )}
            </div>

            {/* Image Full Preview */}
            {report.photo && (
                <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Image className="w-4 h-4" /> Report Image
                    </h4>
                    <div className="bg-gray-100 rounded-xl overflow-hidden">
                        <img
                            src={report.photo}
                            alt="Report"
                            loading="lazy"
                            className="w-full max-h-64 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setImageViewerOpen(true)}
                        />
                    </div>
                    <ImageViewerModal
                        isOpen={imageViewerOpen}
                        onClose={() => setImageViewerOpen(false)}
                        src={report.photo}
                        alt="Humanitarian Report Photo"
                    />
                </div>
            )}

            {/* Location Map */}
            <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" /> Location
                </h4>
                <p className="text-sm text-gray-600">{report.locationDescription || 'Not specified'}</p>
                <p className="text-xs text-gray-400">GPS: {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}</p>

                <div className="rounded-xl overflow-hidden border border-gray-200 h-56">
                    <iframe
                        title={`Map for report ${report.id}`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${report.longitude - 0.02},${report.latitude - 0.02},${report.longitude + 0.02},${report.latitude + 0.02}&layer=mapnik&marker=${report.latitude},${report.longitude}`}
                    />
                </div>

                <a
                    href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                    <MapPin className="w-3 h-3" /> Open in Google Maps →
                </a>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Description
                </h4>
                <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-700">{report.description || 'No description provided.'}</p>
                </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Reported By</p>
                    <p className="font-medium text-gray-900">{report.reporterName}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Reported At</p>
                    <p className="font-medium text-gray-900 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(report.createdAt).toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Accept Button */}
            {isPending && (
                <div className="border-t border-gray-200 pt-4">
                    {!confirming ? (
                        <Button variant="success" className="w-full" size="lg" onClick={() => setConfirming(true)}>
                            <CheckCircle className="w-5 h-5" /> Accept This Report
                        </Button>
                    ) : (
                        <div className="bg-emerald-50 rounded-xl p-4 space-y-3">
                            <p className="text-sm text-emerald-700 font-medium text-center">
                                Are you sure you want to accept this report? The reporter will be notified.
                            </p>
                            <div className="flex gap-3">
                                <Button variant="success" className="flex-1" onClick={onAccept}>
                                    ✓ Yes, Accept
                                </Button>
                                <Button variant="ghost" className="flex-1" onClick={() => setConfirming(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
