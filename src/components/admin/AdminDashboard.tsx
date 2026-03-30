/**
 * ============================================
 * ADMIN DASHBOARD
 * ============================================
 * Features: Overview stats, nurse verification with AI results,
 * user/booking management, shelter reports.
 *
 * Updated for async Supabase database operations.
 */

import { useState, useEffect } from 'react';
import { UserDB, NurseProfileDB, DocumentDB, BookingDB, ShelterReportDB, ShelterDB, AdminLogDB, NotificationDB, StatsDB } from '@/store/database';
import { Button, Card, Badge, Modal, StatsCard, EmptyState, ProgressBar, Input, Select, ImageViewerModal } from '@/components/ui';
import {
  LayoutDashboard, Users, Stethoscope, FileCheck, Calendar, MapPin,
  CheckCircle, XCircle, AlertTriangle, Eye, Shield, Clock, TrendingUp,
  Trash2, Building, Camera, Pencil, User as UserIcon, BarChart3, ScrollText, Bell, Activity, LogOut, Download
} from 'lucide-react';
import type { NurseProfile, NurseDocument, Booking, ShelterReport, Shelter, User } from '@/types';
import { jsPDF } from 'jspdf';
import { cn } from '@/utils/cn';
import { useAuth } from '@/store/AuthContext';
import { uploadImage, validateImageFile } from '@/utils/imageUpload';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminAIMonitor } from './AdminAIMonitor';
import { AdminAnalytics } from './AdminAnalytics';
import { AdminSystemLogs } from './AdminSystemLogs';
import { AdminNotifications } from './AdminNotifications';

type Tab = 'overview' | 'nurses' | 'ai' | 'users' | 'shelters' | 'bookings' | 'reports' | 'notifications' | 'analytics' | 'logs' | 'account';

export function AdminDashboard({ onGoToLanding }: { onGoToLanding: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loadedTabs, setLoadedTabs] = useState<Tab[]>(['overview']);

  const handleTabChange = (id: string) => {
    setActiveTab(id as Tab);
    if (!loadedTabs.includes(id as Tab)) {
      setLoadedTabs(prev => [...prev, id as Tab]);
    }
  };

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'nurses' as Tab, label: 'Nurses', icon: <Stethoscope className="w-4 h-4" /> },
    { id: 'ai' as Tab, label: 'AI Analysis', icon: <Shield className="w-4 h-4" /> },
    { id: 'bookings' as Tab, label: 'Bookings', icon: <Calendar className="w-4 h-4" /> },
    { id: 'users' as Tab, label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'shelters' as Tab, label: 'Shelters', icon: <Building className="w-4 h-4" /> },
    { id: 'reports' as Tab, label: 'Help Reports', icon: <MapPin className="w-4 h-4" /> },
    { id: 'notifications' as Tab, label: 'Alerts', icon: <Bell className="w-4 h-4" /> },
    { id: 'analytics' as Tab, label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'logs' as Tab, label: 'System Logs', icon: <ScrollText className="w-4 h-4" /> },
    { id: 'account' as Tab, label: 'My Account', icon: <UserIcon className="w-4 h-4" /> },
  ];

  return (
    <DashboardLayout
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onGoToLanding={onGoToLanding}
    >
      <div className="w-full">
        <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
          {loadedTabs.includes('overview') && <OverviewPanel />}
        </div>
        <div style={{ display: activeTab === 'nurses' ? 'block' : 'none' }}>
          {loadedTabs.includes('nurses') && <NurseManagement />}
        </div>
        <div style={{ display: activeTab === 'ai' ? 'block' : 'none' }}>
          {loadedTabs.includes('ai') && <AdminAIMonitor />}
        </div>
        <div style={{ display: activeTab === 'users' ? 'block' : 'none' }}>
          {loadedTabs.includes('users') && <UserManagement />}
        </div>
        <div style={{ display: activeTab === 'shelters' ? 'block' : 'none' }}>
          {loadedTabs.includes('shelters') && <ShelterManagement />}
        </div>
        <div style={{ display: activeTab === 'bookings' ? 'block' : 'none' }}>
          {loadedTabs.includes('bookings') && <BookingManagement />}
        </div>
        <div style={{ display: activeTab === 'reports' ? 'block' : 'none' }}>
          {loadedTabs.includes('reports') && <ReportManagement />}
        </div>
        <div style={{ display: activeTab === 'notifications' ? 'block' : 'none' }}>
          {loadedTabs.includes('notifications') && <AdminNotifications />}
        </div>
        <div style={{ display: activeTab === 'analytics' ? 'block' : 'none' }}>
          {loadedTabs.includes('analytics') && <AdminAnalytics />}
        </div>
        <div style={{ display: activeTab === 'logs' ? 'block' : 'none' }}>
          {loadedTabs.includes('logs') && <AdminSystemLogs />}
        </div>
        <div style={{ display: activeTab === 'account' ? 'block' : 'none' }}>
          {loadedTabs.includes('account') && <AdminMyAccount />}
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ─────────────────────────────────────────── */
/*              OVERVIEW PANEL                 */
/* ─────────────────────────────────────────── */

function OverviewPanel() {
  const [stats, setStats] = useState({
    totalUsers: 0, totalNurses: 0, pendingVerification: 0, approvedNurses: 0,
    totalBookings: 0, activeBookings: 0, totalShelters: 0, activeReports: 0, totalReports: 0,
    documentsUploaded: 0, genuineDocuments: 0, suspectedForgery: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const [overviewStats, bookings] = await Promise.all([
          StatsDB.getOverview(),
          BookingDB.getRecent(5),
        ]);

        setStats(overviewStats);
        setRecentBookings(bookings);
      } catch (e) {
        console.error('Failed to load overview stats:', e);
      }
    };
    loadOverview();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={<Users className="w-5 h-5 text-blue-600" />} label="Total Users" value={stats.totalUsers} color="bg-blue-50" />
        <StatsCard icon={<Stethoscope className="w-5 h-5 text-emerald-600" />} label="Nurses" value={stats.totalNurses} color="bg-emerald-50" />
        <StatsCard icon={<Calendar className="w-5 h-5 text-purple-600" />} label="Bookings" value={stats.totalBookings} color="bg-purple-50" />
        <StatsCard icon={<Building className="w-5 h-5 text-amber-600" />} label="Shelters" value={stats.totalShelters} color="bg-amber-50" />
        <StatsCard icon={<MapPin className="w-5 h-5 text-rose-600" />} label="Help Reports" value={stats.totalReports} color="bg-rose-50" />
        <StatsCard icon={<Activity className="w-5 h-5 text-orange-600" />} label="Active Reports" value={stats.activeReports} color="bg-orange-50" />
      </div>

      {/* Pending Actions */}
      {stats.pendingVerification > 0 && (
        <Card className="p-5 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{stats.pendingVerification} Nurse{stats.pendingVerification > 1 ? 's' : ''} Awaiting Verification</p>
              <p className="text-sm text-gray-600">Review their documents and AI analysis results</p>
            </div>
            <Badge variant="warning">{stats.pendingVerification} Pending</Badge>
          </div>
        </Card>
      )}

      {/* AI Analysis Overview */}
      <Card className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" /> AI Document Analysis Overview
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <FileCheck className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.documentsUploaded}</p>
            <p className="text-sm text-gray-500">Total Documents</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600">{stats.genuineDocuments}</p>
            <p className="text-sm text-gray-500">Genuine</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{stats.suspectedForgery}</p>
            <p className="text-sm text-gray-500">Suspected Forgery</p>
          </div>
        </div>
      </Card>

      {/* Recent Bookings */}
      <Card className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" /> Recent Bookings
        </h3>
        {recentBookings.map(b => (
          <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-900">{b.userName} → {b.nurseName}</p>
              <p className="text-xs text-gray-500">{b.serviceType}</p>
            </div>
            <Badge variant={b.status === 'completed' ? 'success' : b.status === 'pending' ? 'warning' : 'info'}>
              {b.status}
            </Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/*          NURSE VERIFICATION                 */
/* ─────────────────────────────────────────── */

function NurseManagement() {
  const { user: admin } = useAuth();
  const [nurses, setNurses] = useState<NurseProfile[]>([]);
  const [nurseUsers, setNurseUsers] = useState<Record<string, User>>({});
  const [nurseDocs, setNurseDocs] = useState<Record<string, NurseDocument[]>>({});
  const [selectedNurse, setSelectedNurse] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [allNurses, allUsers, allDocs] = await Promise.all([
        NurseProfileDB.getAllOverview(),
        UserDB.getAll(),
        DocumentDB.getAllOverview()
      ]);
      setNurses(allNurses);

      const users: Record<string, User> = {};
      allUsers.forEach(u => { users[u.id] = u; });
      setNurseUsers(users);

      const docs: Record<string, NurseDocument[]> = {};
      allDocs.forEach(d => {
        if (!docs[d.nurseId]) docs[d.nurseId] = [];
        docs[d.nurseId].push(d);
      });
      setNurseDocs(docs);
    };
    load();
  }, []);

  const handleVerification = async (nurseId: string, status: 'approved' | 'rejected') => {
    await NurseProfileDB.update(nurseId, { verificationStatus: status });
    if (admin) {
      const nurseName = nurseUsers[nurseId]?.name || nurseId;
      await AdminLogDB.create({
        adminId: admin.id, adminName: admin.name,
        action: status === 'approved' ? 'Approve Nurse' : 'Reject Nurse',
        target: nurseName,
        details: `${status === 'approved' ? 'Approved' : 'Rejected'} nurse verification`,
      });

      // Notify the nurse
      await NotificationDB.create({
        userId: nurseId,
        title: status === 'approved' ? 'Verification Approved' : 'Verification Rejected',
        message: status === 'approved'
          ? 'Congratulations! Your profile has been thoroughly verified and approved. You can now accept patient bookings.'
          : 'Your profile verification was unsuccessful. Please check your documents and re-upload valid proofs or contact support.',
        type: status === 'approved' ? 'success' : 'error',
      });
    }
    const allNurses = await NurseProfileDB.getAllOverview();
    setNurses(allNurses);
    setSelectedNurse(null);
  };

  const pendingNurses = nurses.filter(n => n.verificationStatus === 'pending');
  const approvedNurses = nurses.filter(n => n.verificationStatus === 'approved');
  const rejectedNurses = nurses.filter(n => n.verificationStatus === 'rejected');

  const renderNurseCard = (nurse: NurseProfile) => {
    const user = nurseUsers[nurse.userId];
    const docs = nurseDocs[nurse.userId] || [];

    return (
      <Card key={nurse.userId} className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-gray-100 flex flex-col h-full rounded-[1.5rem]">
        {/* Card Header */}
        <div className="relative h-32 bg-gradient-to-br from-[#eb4899] to-[#d61f69] flex items-center justify-center p-4">
          <div className="absolute top-2.5 left-2.5 bg-white rounded-full p-1 shadow-sm">
            <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-50" />
          </div>

          <div className="absolute top-2.5 right-2.5">
            <Badge variant={nurse.verificationStatus === 'approved' ? 'success' : nurse.verificationStatus === 'rejected' ? 'danger' : 'warning'}>
              {nurse.verificationStatus}
            </Badge>
          </div>

          <div className="relative">
            {user?.profile_photo && user.profile_photo.length > 10 ? (
              <img src={user.profile_photo} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/30 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {user?.name[0] || '?'}
              </div>
            )}
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 flex-grow text-center flex flex-col items-center">
          <h4 className="text-lg font-bold text-gray-900 mb-0.5 leading-tight">{user?.name}</h4>
          <p className="text-xs font-bold text-emerald-600 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
            <MapPin className="w-3.5 h-3.5" /> {nurse.location}
          </p>

          <div className="flex flex-wrap justify-center gap-1.5 mb-4">
            {nurse.specializations.slice(0, 2).map(s => <Badge key={s} variant="info" className="text-[10px]">{s}</Badge>)}
            {nurse.specializations.length > 2 && <Badge variant="neutral" className="text-[10px]">+{nurse.specializations.length - 2}</Badge>}
          </div>

          <div className="grid grid-cols-2 w-full gap-2 mb-4 pt-4 border-t border-gray-50">
            <div className="text-center">
              <p className="text-xs font-bold text-gray-900">{nurse.experience} yrs</p>
              <p className="text-[10px] text-gray-500 uppercase">Exp.</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-gray-900">{docs.length}</p>
              <p className="text-[10px] text-gray-500 uppercase">Docs</p>
            </div>
          </div>

          {/* AI Quick Status */}
          {docs.length > 0 && (
            <div className="w-full bg-gray-50 rounded-xl p-2 mb-4 flex items-center justify-around">
              {docs.slice(0, 3).map(doc => (
                <div key={doc.id} title={doc.fileName}>
                  {doc.aiAnalysis?.result === 'genuine' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : doc.aiAnalysis?.result === 'suspected_forgery' ? (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="px-4 pb-4 mt-auto space-y-2">
          <Button className="w-full justify-center" size="sm" variant="ghost" onClick={() => setSelectedNurse(nurse.userId)}>
            <Eye className="w-3.5 h-3.5" /> Review Profile
          </Button>

          <div className="flex gap-2">
            {nurse.verificationStatus === 'pending' && (
              <>
                <Button className="flex-1 justify-center" size="sm" variant="success" onClick={() => handleVerification(nurse.userId, 'approved')}>
                  Approve
                </Button>
                <Button className="flex-1 justify-center" size="sm" variant="danger" onClick={() => handleVerification(nurse.userId, 'rejected')}>
                  Reject
                </Button>
              </>
            )}
            {nurse.verificationStatus === 'rejected' && (
              <Button className="w-full justify-center" size="sm" variant="success" onClick={() => handleVerification(nurse.userId, 'approved')}>
                Re-Approve
              </Button>
            )}
            {nurse.verificationStatus === 'approved' && (
              <Button className="w-full justify-center" size="sm" variant="danger" onClick={() => handleVerification(nurse.userId, 'rejected')}>
                Revoke Access
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-emerald-600" /> Nurse Professionals
        </h3>
        <Badge variant="info">{nurses.length} Total</Badge>
      </div>

      {nurses.length === 0 && (
        <EmptyState icon={<Stethoscope className="w-8 h-8 text-gray-400" />} title="No nurses registered" description="No nurses have signed up on the platform yet." />
      )}

      {pendingNurses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4" /> Awaiting Verification ({pendingNurses.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pendingNurses.map(renderNurseCard)}
          </div>
        </div>
      )}

      {approvedNurses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Approved Providers ({approvedNurses.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {approvedNurses.map(renderNurseCard)}
          </div>
        </div>
      )}

      {rejectedNurses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Rejected ({rejectedNurses.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {rejectedNurses.map(renderNurseCard)}
          </div>
        </div>
      )}

      {/* Detailed Review Modal */}
      {selectedNurse && (
        <Modal isOpen onClose={() => setSelectedNurse(null)} title="Nurse Verification Review" size="xl">
          <NurseReviewDetail nurseId={selectedNurse} onAction={(status) => handleVerification(selectedNurse, status)} />
        </Modal>
      )}
    </div>
  );
}

function NurseReviewDetail({ nurseId, onAction }: { nurseId: string; onAction: (status: 'approved' | 'rejected') => void }) {
  const [nurse, setNurse] = useState<NurseProfile | undefined>();
  const [user, setUser] = useState<User | undefined>();
  const [docs, setDocs] = useState<NurseDocument[]>([]);

  useEffect(() => {
    NurseProfileDB.getByUserId(nurseId).then(setNurse);
    UserDB.getById(nurseId).then(setUser);
    DocumentDB.getByNurseId(nurseId).then(setDocs);
  }, [nurseId]);

  if (!nurse || !user) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      {/* Nurse Info */}
      <div className="flex items-center gap-4">
        {user.profile_photo && user.profile_photo.length > 10 ? (
          <img src={user.profile_photo} alt={user.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-50 shadow-sm" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
            {user.name[0]}
          </div>
        )}
        <div>
          <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
          <p className="text-sm text-gray-500">{user.email} · 📞 {user.phone}</p>
          <p className="text-sm text-gray-500">📍 {nurse.location} · {nurse.experience} years exp.</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-medium text-gray-900 mb-2">Bio</h4>
        <p className="text-sm text-gray-600">{nurse.bio}</p>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-2">Specializations</h4>
        <div className="flex flex-wrap gap-2">
          {nurse.specializations.map(s => <Badge key={s} variant="info">{s}</Badge>)}
        </div>
      </div>

      {/* Documents with AI Analysis */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" /> Uploaded Documents & AI Analysis
        </h4>

        {docs.length === 0 ? (
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-sm text-amber-700">No documents uploaded yet</p>
          </div>
        ) : (
          docs.map(doc => (
            <Card key={doc.id} className="p-4">
              <div className="flex items-start gap-4">
                {/* Document Preview */}
                {doc.fileData && !doc.fileData.includes('application/pdf') && (
                  <img src={doc.fileData} alt={doc.fileName} className="w-24 h-24 object-cover rounded-lg border" />
                )}

                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{doc.fileName}</p>
                      <p className="text-xs text-gray-500 capitalize">{doc.documentType.replace('_', ' ')} · {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                    </div>
                    {doc.aiAnalysis && (
                      <Badge variant={doc.aiAnalysis.result === 'genuine' ? 'success' : 'danger'}>
                        {doc.aiAnalysis.result === 'genuine' ? '✓ Genuine' : '⚠ Suspected Forgery'}
                        {' '}{(doc.aiAnalysis.confidenceScore * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </div>

                  {/* AI Metrics */}
                  {doc.aiAnalysis && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <MetricBar label="OCR Match Confidence" value={doc.aiAnalysis.confidenceScore} />
                        <MetricBar label="Text Clarity" value={doc.aiAnalysis.ocrConsistency} />
                        <MetricBar label="Format Match" value={doc.aiAnalysis.alignmentScore} />
                        <MetricBar label="Keyword Match" value={doc.aiAnalysis.fontConsistency} />
                      </div>

                      {doc.aiAnalysis.anomalies.length > 0 && (
                        <div className="bg-red-50 rounded-lg p-2">
                          <p className="text-xs font-medium text-red-700 mb-1">Anomalies:</p>
                          {doc.aiAnalysis.anomalies.map((a, i) => (
                            <p key={i} className="text-xs text-red-600">• {a}</p>
                          ))}
                        </div>
                      )}

                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs font-medium text-gray-700 mb-1">OCR Output:</p>
                        <p className="text-xs text-gray-500 font-mono">{doc.aiAnalysis.extractedText}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Admin Decision */}
      <Card className="p-5 bg-indigo-50 border-indigo-200">
        <h4 className="font-semibold text-gray-900 mb-3">Admin Decision</h4>
        <p className="text-sm text-gray-600 mb-4">
          AI analysis assists your decision. You have the final say on whether to approve or reject this nurse's registration.
        </p>
        <div className="flex gap-3">
          <Button variant="success" onClick={() => onAction('approved')}>
            <CheckCircle className="w-4 h-4" /> Approve Nurse
          </Button>
          <Button variant="danger" onClick={() => onAction('rejected')}>
            <XCircle className="w-4 h-4" /> Reject Nurse
          </Button>
        </div>
      </Card>
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between mb-0.5">
        <span className="text-gray-600">{label}</span>
        <span className={cn('font-medium', value >= 0.7 ? 'text-emerald-600' : value >= 0.5 ? 'text-amber-600' : 'text-red-600')}>
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <ProgressBar value={value * 100} color={value >= 0.7 ? 'green' : value >= 0.5 ? 'amber' : 'red'} />
    </div>
  );
}

/* ─────────────────────────────────────────── */
/*            USER MANAGEMENT                  */
/* ─────────────────────────────────────────── */

function UserManagement() {
  const { user: admin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);

  const reload = () => UserDB.getAll().then(all => setUsers(all.filter(u => u.role !== 'admin' && u.role !== 'shelter')));

  useEffect(() => { reload(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      await UserDB.delete(id);
      await NurseProfileDB.delete(id);
      if (admin) {
        await AdminLogDB.create({
          adminId: admin.id, adminName: admin.name,
          action: 'Delete User', target: name, details: `Deleted user account`,
        });
      }
      reload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" /> Registered Users
        </h3>
        <Badge variant="info">{users.length} Total</Badge>
      </div>

      {users.length === 0 ? (
        <EmptyState icon={<Users className="w-8 h-8 text-gray-400" />} title="No users" description="No user accounts found." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {users.map(u => (
            <Card key={u.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-gray-100 flex flex-col h-full rounded-[1.5rem]">
              {/* Card Header */}
              <div className="relative h-28 bg-gradient-to-br from-[#3b82f6] to-[#2563eb] flex items-center justify-center p-4">
                <div className="absolute top-2.5 right-2.5">
                  <Badge variant={u.role === 'nurse' ? 'success' : 'info'} className="bg-white/90 text-blue-700 border-none">
                    {u.role.toUpperCase()}
                  </Badge>
                </div>

                <div className="relative">
                  {u.profile_photo && u.profile_photo.length > 10 ? (
                    <img src={u.profile_photo} alt="" className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/30 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                      {u.name[0]}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 flex-grow text-center flex flex-col items-center">
                <h4 className="text-base font-bold text-gray-900 mb-0.5">{u.name}</h4>
                <p className="text-xs text-gray-500 mb-4 truncate w-full">{u.email}</p>

                <div className="w-full space-y-2 text-[11px] text-gray-600 font-medium">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-400">Phone:</span>
                    <span>{u.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-400">Joined:</span>
                    <span>{new Date(u.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="px-4 pb-4 mt-auto">
                <Button
                  size="sm"
                  variant="danger"
                  className="w-full justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(u.id, u.name)}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete User
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────── */
/*          SHELTER MANAGEMENT                 */
/* ─────────────────────────────────────────── */

function ShelterManagement() {
  const { user: admin } = useAuth();
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [editingShelter, setEditingShelter] = useState<Shelter | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const reload = () => ShelterDB.getAll().then(setShelters);

  useEffect(() => {
    reload();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This will remove the facility record from the system.`)) {
      const success = await ShelterDB.delete(id);
      if (success && admin) {
        await AdminLogDB.create({
          adminId: admin.id,
          adminName: admin.name,
          action: 'Delete Shelter',
          target: name,
          details: `Permanent deletion of shelter facility record`,
        });
      }
      reload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Building className="w-5 h-5 text-amber-600" /> Authorized Shelters
        </h3>
        <div className="flex items-center gap-3">
          <Badge variant="warning">{shelters.length} Total</Badge>
          <Button size="sm" onClick={() => setIsCreating(true)}>
            + Add Shelter
          </Button>
        </div>
      </div>

      {shelters.length === 0 ? (
        <EmptyState icon={<Building className="w-8 h-8 text-gray-400" />} title="No shelters" description="No shelters have been registered yet." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {shelters.map(s => (
            <Card key={s.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-gray-100 flex flex-col h-full rounded-[1.5rem]">
              {/* Card Header */}
              <div className="relative h-28 bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center p-4">
                <div className="absolute top-2.5 right-2.5 flex gap-2">
                  <button 
                    onClick={() => handleDelete(s.id, s.name)}
                    className="p-1.5 bg-white/20 hover:bg-red-500 rounded-lg text-white transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100"
                    title="Delete Shelter"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <Badge variant="info" className="bg-white/90 text-amber-700 border-none font-bold">
                    CAP: {s.capacity}
                  </Badge>
                </div>

                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border-4 border-white/30 flex items-center justify-center text-white shadow-lg">
                  <Building className="w-8 h-8" />
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 flex-grow flex flex-col">
                <h4 className="text-base font-bold text-gray-900 mb-1 leading-tight">{s.name}</h4>
                <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" /> {s.address}
                </p>

                <div className="mt-auto space-y-2 pt-3 border-t border-gray-50">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-gray-700 truncate max-w-[120px]">{s.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-400">Phone:</span>
                    <span className="text-gray-700">{s.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="px-4 pb-4">
                <Button
                  size="sm"
                  variant="primary"
                  className="w-full justify-center gap-2 group-hover:scale-[1.02] transition-transform"
                  onClick={() => setEditingShelter(s)}
                >
                  <Pencil className="w-3.5 h-3.5" /> Manage Shelter
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {(editingShelter || isCreating) && (
        <Modal 
          isOpen 
          onClose={() => { setEditingShelter(null); setIsCreating(false); }} 
          title={isCreating ? "Add New Shelter Facility" : "Update Shelter Details"}
        >
          <ShelterEditForm 
            shelter={editingShelter} 
            onSave={() => { setEditingShelter(null); setIsCreating(false); reload(); }} 
          />
        </Modal>
      )}
    </div>
  );
}

function ShelterEditForm({ shelter, onSave }: { shelter: Shelter | null, onSave: () => void }) {
  const { user: admin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: shelter?.name || '',
    address: shelter?.address || '',
    email: shelter?.email || '',
    phone: shelter?.phone || '',
    capacity: shelter?.capacity || 50,
    latitude: shelter?.latitude || 0,
    longitude: shelter?.longitude || 0,
    shelterUserId: shelter?.shelterUserId || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (shelter) {
        await ShelterDB.update(shelter.id, form);
        if (admin) {
          await AdminLogDB.create({
            adminId: admin.id,
            adminName: admin.name,
            action: 'Update Shelter',
            target: form.name,
            details: `Updated facility information for ${form.name}`,
          });
        }
      } else {
        await ShelterDB.create(form);
        if (admin) {
          await AdminLogDB.create({
            adminId: admin.id,
            adminName: admin.name,
            action: 'Create Shelter',
            target: form.name,
            details: `Created new shelter facility: ${form.name}`,
          });
        }
      }
      onSave();
    } catch (err) {
      console.error('Failed to save shelter:', err);
      alert('Failed to save changes. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <Input 
        label="Shelter Name" 
        value={form.name} 
        onChange={e => setForm({...form, name: e.target.value})} 
        placeholder="e.g. Hope Haven Center"
        required 
      />
      <Input 
        label="Address" 
        value={form.address} 
        onChange={e => setForm({...form, address: e.target.value})} 
        placeholder="Full street address"
        required 
      />
      <div className="grid grid-cols-2 gap-4">
        <Input 
          label="Direct Email" 
          type="email" 
          value={form.email} 
          onChange={e => setForm({...form, email: e.target.value})} 
          placeholder="Contact email"
        />
        <Input 
          label="Phone Number" 
          value={form.phone} 
          onChange={e => setForm({...form, phone: e.target.value})} 
          placeholder="Main line"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input 
          label="Total Capacity" 
          type="number" 
          value={form.capacity} 
          onChange={e => setForm({...form, capacity: parseInt(e.target.value)})} 
        />
        <Input 
          label="Linked User ID (Optional)" 
          value={form.shelterUserId} 
          onChange={e => setForm({...form, shelterUserId: e.target.value})} 
          placeholder="User UUID"
        />
      </div>
      
      <div className="pt-4 flex gap-3">
        <Button 
          type="submit" 
          className="flex-1 justify-center" 
          loading={loading}
        >
          {shelter ? 'Update Facility' : 'Create facility'}
        </Button>
      </div>
    </form>
  );
}

/* ─────────────────────────────────────────── */
/*          BOOKING MANAGEMENT                 */
/* ─────────────────────────────────────────── */

function BookingManagement() {
  const { user: admin } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    BookingDB.getAll().then(setBookings);
  }, []);

  const refresh = () => BookingDB.getAll().then(setBookings);

  const updateBookingStatus = async (b: Booking, status: string) => {
    await BookingDB.update(b.id, { status: status as Booking['status'] });
    if (admin) {
      await AdminLogDB.create({
        adminId: admin.id, adminName: admin.name,
        action: status === 'cancelled' ? 'Cancel Booking' : 'Update Booking',
        target: `Booking ${b.userName} → ${b.nurseName}`,
        details: `Changed status to ${status}`,
      });
    }
    refresh();
  };

  const downloadReceipt = (booking: Booking) => {
    const doc = new jsPDF();
    const marginLeft = 20;
    let yPos = 30;

    doc.setFontSize(22);
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.text('CARECONNECT', marginLeft, yPos);
    yPos += 10;

    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('ADMINISTRATIVE RECEIPT COPY', marginLeft, yPos);
    yPos += 20;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    const details = [
      { label: 'Booking ID:', value: booking.id.toUpperCase() },
      { label: 'Generated By:', value: `Admin: ${admin?.name || 'System'}` },
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
    doc.setFillColor(241, 245, 249);
    doc.rect(marginLeft, yPos, 170, 20, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL AMOUNT:`, marginLeft + 5, yPos + 14);
    doc.text(`INR ${booking.totalAmount.toLocaleString()}`, marginLeft + 120, yPos + 14);
    yPos += 40;

    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('This is an administrative copy generated via the CareConnect Admin Panel.', marginLeft, yPos);

    doc.save(`Admin-Receipt-${booking.id.slice(0, 8)}.pdf`);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
      pending: 'warning', accepted: 'info', rejected: 'danger', completed: 'success', cancelled: 'neutral'
    };
    return <Badge variant={map[status] || 'neutral'}>{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">All Bookings ({bookings.length})</h3>
        <Button variant="ghost" size="sm" onClick={refresh}>Refresh List</Button>
      </div>

      {bookings.length === 0 ? (
        <EmptyState icon={<Calendar className="w-8 h-8 text-gray-400" />} title="No bookings" description="No bookings have been made yet." />
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-100 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="text-left py-4 px-4 font-medium text-gray-500 uppercase tracking-wider text-[10px]">Patient</th>
                <th className="text-left py-4 px-4 font-medium text-gray-500 uppercase tracking-wider text-[10px]">Nurse</th>
                <th className="text-left py-4 px-4 font-medium text-gray-500 uppercase tracking-wider text-[10px]">Service</th>
                <th className="text-left py-4 px-4 font-medium text-gray-500 uppercase tracking-wider text-[10px]">Dates</th>
                <th className="text-left py-4 px-4 font-medium text-gray-500 uppercase tracking-wider text-[10px]">Amount</th>
                <th className="text-left py-4 px-4 font-medium text-gray-500 uppercase tracking-wider text-[10px]">Status</th>
                <th className="text-right py-4 px-4 font-medium text-gray-500 uppercase tracking-wider text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(b => (
                <tr key={b.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="py-4 px-4 font-medium text-gray-900">{b.userName}</td>
                  <td className="py-4 px-4 text-gray-600">{b.nurseName}</td>
                  <td className="py-4 px-4">
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold">{b.serviceType}</span>
                  </td>
                  <td className="py-4 px-4 text-gray-500 text-[11px] font-mono leading-tight">
                    {b.startDate}<br /><span className="text-gray-300">to</span><br />{b.endDate}
                  </td>
                  <td className="py-4 px-4 font-bold text-gray-900 whitespace-nowrap">₹{b.totalAmount.toLocaleString()}</td>
                  <td className="py-4 px-4">{statusBadge(b.status)}</td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex gap-2 justify-end">
                      {b.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="hover:bg-blue-100 text-blue-600"
                          onClick={() => downloadReceipt(b)}
                          title="Download Receipt"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      {['pending', 'accepted'].includes(b.status) && (
                        <Button
                          size="sm"
                          variant="danger"
                          className="px-2 py-1 h-8"
                          onClick={() => updateBookingStatus(b, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      )}
                      {b.status === 'accepted' && (
                        <Button
                          size="sm"
                          variant="success"
                          className="px-2 py-1 h-8"
                          onClick={() => updateBookingStatus(b, 'completed')}
                        >
                          Finalize
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────── */
/*        SHELTER REPORT MANAGEMENT            */
/* ─────────────────────────────────────────── */

function ReportManagement() {
  const [reports, setReports] = useState<ShelterReport[]>([]);
  const [allShelters, setAllShelters] = useState<Shelter[]>([]);

  useEffect(() => {
    ShelterReportDB.getAll().then(setReports);
    ShelterDB.getAll().then(setAllShelters);
  }, []);

  const updateStatus = async (report: ShelterReport, status: 'notified' | 'resolved', shelterId?: string) => {
    // If we're forwarding to a shelter, set the assignedShelterId
    await ShelterReportDB.update(report.id, {
      status,
      ...(shelterId ? { assignedShelterId: shelterId } : {})
    });

    // Notify the specific shelter if provided
    if (status === 'notified' && shelterId) {
      const fullShelter = allShelters.find(s => s.id === shelterId);
      if (fullShelter?.shelterUserId) {
        NotificationDB.create({
          userId: fullShelter.shelterUserId,
          title: 'New Help Report Alert',
          message: `A new humanitarian report requires your attention near ${report.locationDescription || 'your location'}.`,
          type: 'warning'
        }).catch(console.error);
      }
    } else if (status === 'notified') {
      // Fallback: Auto-dispatch to top nearest shelters
      const nearShelters = report.nearbyShelters?.length > 0
        ? report.nearbyShelters
        : allShelters.map(s => ({
          ...s,
          distanceKm: haversineDistance(report.latitude, report.longitude, s.latitude, s.longitude)
        })).sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999)).slice(0, 3);

      for (const ns of nearShelters) {
        const fullShelter = allShelters.find(s => s.id === ns.id);
        if (fullShelter?.shelterUserId) {
          NotificationDB.create({
            userId: fullShelter.shelterUserId,
            title: 'New Help Report Alert',
            message: `A new humanitarian report requires your attention near ${report.locationDescription || 'your location'}.`,
            type: 'warning'
          }).catch(console.error);
        }
      }
    }

    const updated = await ShelterReportDB.getAll();
    setReports(updated);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Humanitarian Help Reports ({reports.length})</h3>

      {reports.length === 0 ? (
        <EmptyState icon={<MapPin className="w-8 h-8 text-gray-400" />} title="No reports" description="No humanitarian reports have been submitted yet." />
      ) : (
        reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(report => (
          <AdminReportCard
            key={report.id}
            report={report}
            allShelters={allShelters}
            onUpdate={(status, shelterId) => updateStatus(report, status, shelterId)}
          />
        ))
      )}
    </div>
  );
}

function AdminReportCard({
  report,
  allShelters,
  onUpdate
}: {
  report: ShelterReport;
  allShelters: Shelter[];
  onUpdate: (status: 'notified' | 'resolved', shelterId?: string) => void
}) {
  const nearShelters = report.nearbyShelters?.length > 0
    ? report.nearbyShelters
    : allShelters.map(s => ({
      ...s,
      distanceKm: haversineDistance(report.latitude, report.longitude, s.latitude, s.longitude)
    })).sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999)).slice(0, 5);

  const [selectedShelter, setSelectedShelter] = useState<string>(
    report.assignedShelterId || (nearShelters.length > 0 ? nearShelters[0].id : '')
  );
  const [imageViewerOpen, setImageViewerOpen] = useState(false);

  return (
    <Card className="p-5">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        {report.photo && (
          <>
            <img
              src={report.photo}
              alt="Report"
              loading="lazy"
              className="w-full sm:w-32 h-32 object-cover rounded-lg border shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setImageViewerOpen(true)}
            />
            <ImageViewerModal
              isOpen={imageViewerOpen}
              onClose={() => setImageViewerOpen(false)}
              src={report.photo}
              alt="Humanitarian Report Photo"
            />
          </>
        )}
        <div className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2">
            <div>
              <p className="font-semibold text-gray-900">{report.locationDescription}</p>
              <p className="text-xs text-gray-500">Reported by {report.reporterName} · {new Date(report.createdAt).toLocaleDateString()}</p>
            </div>
            <Badge variant={report.status === 'resolved' ? 'success' : report.status === 'notified' ? 'info' : 'warning'}>
              {report.status}
            </Badge>
          </div>

          <p className="text-sm text-gray-600 mb-2">{report.description}</p>
          <p className="text-xs text-gray-400">📍 {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</p>

          {/* Shelter Selection Dropdown */}
          {report.status === 'reported' && nearShelters.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <label className="text-xs font-semibold text-blue-800 mb-2 block">Choose Shelter to Forward To:</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Select
                    options={nearShelters.map(s => ({
                      value: s.id,
                      label: `${s.name} (${s.distanceKm?.toFixed(1)} km away)`
                    }))}
                    value={selectedShelter}
                    onChange={(e) => setSelectedShelter(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onUpdate('notified', selectedShelter)}
                  disabled={!selectedShelter}
                  className="shrink-0 h-11"
                >
                  Forward to Shelter
                </Button>
              </div>
            </div>
          )}

          {report.status !== 'reported' && report.assignedShelterId && (
            <div className="mt-3 text-sm text-emerald-700 font-medium bg-emerald-50 p-2 rounded-lg inline-block">
              Assigned to: {allShelters.find(s => s.id === report.assignedShelterId)?.name || 'Unknown Shelter'}
            </div>
          )}

          {report.status === 'notified' && (
            <div className="mt-4">
              <Button size="sm" variant="success" onClick={() => onUpdate('resolved')}>
                <CheckCircle className="w-4 h-4 mr-1" /> Mark Resolved
              </Button>
            </div>
          )}

          {report.status === 'reported' && nearShelters.length === 0 && (
            <div className="mt-3 text-sm text-amber-600 bg-amber-50 p-2 rounded-lg inline-block">
              No shelters available to forward to.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────── */
/*           ADMIN MY ACCOUNT                  */
/* ─────────────────────────────────────────── */

function AdminMyAccount() {
  const { user, updateUser, logout } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', location: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, phone: user.phone, location: user.location || '' });
    }
  }, [user]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      setMessage(validationError);
      setTimeout(() => setMessage(''), 4000);
      return;
    }
    setPhotoUploading(true);
    const result = await uploadImage('profile', file, user?.id);
    if (result.success && result.url) {
      await updateUser({ profile_photo: result.url });
      setMessage('Profile photo updated!');
    } else {
      setMessage(result.error || 'Upload failed.');
    }
    setPhotoUploading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    await updateUser({ name: form.name, phone: form.phone, location: form.location });
    setSaving(false);
    setMessage('Profile updated successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-6">
          <div className="relative group">
            {user.profile_photo && user.profile_photo.length > 10 ? (
              <img src={user.profile_photo} alt={user.name}
                loading="lazy"
                className="w-24 h-24 rounded-2xl object-cover border-2 border-gray-100 shadow-sm" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-sm">
                {user.name[0]?.toUpperCase()}
              </div>
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
            {photoUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
            <Badge variant="info" className="mt-1">Admin</Badge>
            <p className="text-xs text-gray-400 mt-1">Hover photo to change</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Pencil className="w-5 h-5 text-indigo-600" /> Edit Profile
        </h3>

        {message && (
          <div className={cn(
            'mb-4 p-3 rounded-xl text-sm',
            message.includes('successfully') || message.includes('updated')
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          )}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Full Name" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Input label="Phone" type="tel" value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <Input label="Location" value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City name" />

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Email</p>
              <p className="text-sm text-gray-700">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Joined</p>
              <p className="text-sm text-gray-700">{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-100 bg-red-50/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-red-700">Log Out</h3>
            <p className="text-sm text-red-600/80 mt-1">Securely sign out of your account on this device.</p>
          </div>
          <Button variant="danger" onClick={() => logout()} className="shrink-0">
            <span className="flex items-center gap-2"><LogOut className="w-4 h-4" /> Sign Out</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/*        HELPERS                              */
/* ─────────────────────────────────────────── */

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
