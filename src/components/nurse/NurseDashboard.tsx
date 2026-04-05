/**
 * ============================================
 * NURSE DASHBOARD
 * ============================================
 * Features: Profile management, document upload,
 * AI verification status, booking management.
 *
 * Updated for async Supabase database operations.
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/store/AuthContext';
import { NurseProfileDB, DocumentDB, BookingDB, NotificationDB } from '@/store/database';
import { Button, Input, Textarea, Card, Badge, Modal, EmptyState, Spinner, ProgressBar } from '@/components/ui';
import { User, Upload, FileCheck, Calendar, CheckCircle, XCircle, Clock, Shield, AlertTriangle, FileText, Activity, IndianRupee, Star, Bell, Heart } from 'lucide-react';
import type { NurseProfile, NurseDocument, Booking, DocumentAnalysis, CertificateReview } from '@/types';
import { cn } from '@/utils/cn';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

import { NurseHome } from './NurseHome';
import { NurseSchedule } from './NurseSchedule';
import { NurseEarnings } from './NurseEarnings';
import { NurseRatings } from './NurseRatings';
import { NurseNotifications } from './NurseNotifications';
import { NurseAccount } from './NurseAccount';
import { HomelessReport } from '../shared/ReportManager';
import { ImageViewerModal } from '@/components/ui/ImageViewerModal';
import { CertificateReviewDB } from '@/store/database';
import { verifyCertificate } from '@/ai/certificateVerification';

type Tab = 'overview' | 'profile' | 'documents' | 'bookings' | 'schedule' | 'earnings' | 'ratings' | 'report' | 'notifications' | 'account';

export function NurseDashboard({ onGoToLanding }: { onGoToLanding: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loadedTabs, setLoadedTabs] = useState<Tab[]>(['overview']);

  const handleTabChange = (id: string) => {
    setActiveTab(id as Tab);
    if (!loadedTabs.includes(id as Tab)) {
      setLoadedTabs(prev => [...prev, id as Tab]);
    }
  };

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: <Activity className="w-4 h-4" /> },
    { id: 'profile' as Tab, label: 'My Profile', icon: <User className="w-4 h-4" /> },
    { id: 'documents' as Tab, label: 'Documents', icon: <FileCheck className="w-4 h-4" /> },
    { id: 'bookings' as Tab, label: 'Booking Requests', icon: <Calendar className="w-4 h-4" /> },
    { id: 'schedule' as Tab, label: 'My Schedule', icon: <Clock className="w-4 h-4" /> },
    { id: 'earnings' as Tab, label: 'Earnings', icon: <IndianRupee className="w-4 h-4" /> },
    { id: 'ratings' as Tab, label: 'Ratings', icon: <Star className="w-4 h-4" /> },
    { id: 'report' as Tab, label: 'Help Report', icon: <Heart className="w-4 h-4" /> },
    { id: 'notifications' as Tab, label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'account' as Tab, label: 'Account Settings', icon: <Shield className="w-4 h-4" /> },
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
          {loadedTabs.includes('overview') && <NurseHome onNavigate={handleTabChange} />}
        </div>
        <div style={{ display: activeTab === 'profile' ? 'block' : 'none' }}>
          {loadedTabs.includes('profile') && <ProfileManager />}
        </div>
        <div style={{ display: activeTab === 'documents' ? 'block' : 'none' }}>
          {loadedTabs.includes('documents') && <DocumentManager />}
        </div>
        <div style={{ display: activeTab === 'bookings' ? 'block' : 'none' }}>
          {loadedTabs.includes('bookings') && <BookingManager />}
        </div>
        <div style={{ display: activeTab === 'schedule' ? 'block' : 'none' }}>
          {loadedTabs.includes('schedule') && <NurseSchedule />}
        </div>
        <div style={{ display: activeTab === 'earnings' ? 'block' : 'none' }}>
          {loadedTabs.includes('earnings') && <NurseEarnings />}
        </div>
        <div style={{ display: activeTab === 'ratings' ? 'block' : 'none' }}>
          {loadedTabs.includes('ratings') && <NurseRatings />}
        </div>
        <div style={{ display: activeTab === 'report' ? 'block' : 'none' }}>
          {loadedTabs.includes('report') && <HomelessReport />}
        </div>
        <div style={{ display: activeTab === 'notifications' ? 'block' : 'none' }}>
          {loadedTabs.includes('notifications') && <NurseNotifications />}
        </div>
        <div style={{ display: activeTab === 'account' ? 'block' : 'none' }}>
          {loadedTabs.includes('account') && <NurseAccount />}
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ─────────────────────────────────────────── */
/*           PROFILE MANAGEMENT                */
/* ─────────────────────────────────────────── */

function ProfileManager() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<NurseProfile | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    specializations: '',
    experience: '',
    baseRate: '',
    rateType: 'hourly' as 'hourly' | 'daily' | 'weekly' | 'monthly',
    bio: '',
    location: user!.location || '',
    serviceAreas: '',
    availability: true,
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch with timeout (8 seconds) — prevents permanent hangs if Supabase is under load
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), 8000)
      );

      let p = await Promise.race([
        NurseProfileDB.getByUserId(user.id),
        timeoutPromise
      ]) as NurseProfile | undefined;
      
      // 2. Auto-Repair/Creation if missing
      if (!p) {
        console.log('[ProfileManager] Profile missing, creating default profile.');
        try {
            const newProfile = await NurseProfileDB.create({
                userId: user.id, specializations: [], experience: 0,
                baseRate: 0, rateType: 'hourly', bio: '', location: user.location || '',
                serviceAreas: [], availability: true, verificationStatus: 'pending', documents: []
            });
            p = newProfile as any;
        } catch (e) {
            console.error('[ProfileManager] Auto-repair failed:', e);
        }
      }

      if (p) {
        setProfile(p);
        setForm({
          specializations: p.specializations.join(', '),
          experience: p.experience?.toString() || '',
          baseRate: p.baseRate?.toString() || '',
          rateType: (p.rateType as any) || 'hourly',
          bio: p.bio || '',
          location: p.location || user.location || '',
          serviceAreas: (p.serviceAreas || []).join(', '),
          availability: p.availability ?? true,
        });
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      if (err.message === 'REQUEST_TIMEOUT') {
        setError('Connection is taking too long. Check your network and try again.');
      } else {
        setError('Could not connect to database to load profile.');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const profileData: Omit<NurseProfile, 'verificationStatus' | 'rating' | 'totalReviews'> & Partial<Pick<NurseProfile, 'verificationStatus' | 'rating' | 'totalReviews'>> = {
      userId: user!.id,
      specializations: form.specializations.split(',').map(s => s.trim()).filter(Boolean),
      experience: parseInt(form.experience) || 0,
      baseRate: parseInt(form.baseRate) || 0,
      rateType: form.rateType,
      bio: form.bio,
      location: form.location,
      serviceAreas: form.serviceAreas.split(',').map(s => s.trim()).filter(Boolean),
      availability: form.availability,
      documents: [],
    };

    try {
      if (profile) {
        const updated = await NurseProfileDB.update(user!.id, profileData);
        if (updated) {
          setProfile(updated);
          // Also update the global user object if location changed
          if (form.location !== user?.location) {
            await updateUser({ location: form.location });
          }
        }
      } else {
        const created = await NurseProfileDB.create({
          ...profileData,
          verificationStatus: 'pending',
        });
        if (created) {
          setProfile(created);
          // Also update the global user object
          await updateUser({ location: form.location });
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Card className="p-8 text-center"><Spinner size="sm" /><p className="text-sm text-gray-500 mt-2">Loading profile...</p></Card>;

  return (
    <div className="space-y-6">
      {/* Verification Status Banner */}
      {profile && (
        <Card className={cn('p-4', {
          'bg-amber-50 border-amber-200': profile.verificationStatus === 'pending',
          'bg-emerald-50 border-emerald-200': profile.verificationStatus === 'approved',
          'bg-red-50 border-red-200': profile.verificationStatus === 'rejected',
        })}>
          <div className="flex items-center gap-3">
            {profile.verificationStatus === 'pending' && <Clock className="w-5 h-5 text-amber-600" />}
            {profile.verificationStatus === 'approved' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
            {profile.verificationStatus === 'rejected' && <XCircle className="w-5 h-5 text-red-600" />}
            <div>
              <p className="font-medium text-gray-900">
                Verification Status: {profile.verificationStatus.charAt(0).toUpperCase() + profile.verificationStatus.slice(1)}
              </p>
              <p className="text-sm text-gray-600">
                {profile.verificationStatus === 'pending' && 'Your documents are being reviewed by our admin team with AI assistance.'}
                {profile.verificationStatus === 'approved' && 'You are verified and visible to patients searching for nurses.'}
                {profile.verificationStatus === 'rejected' && 'Your verification was not approved. Please re-upload valid documents.'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Profile Form */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Professional Profile</h3>
          <Button variant="ghost" size="sm" onClick={loadProfile} disabled={loading || saving}>
            <Activity className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea label="Bio / About Me" placeholder="Describe your experience and approach to care..."
            value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} required />

          <Input label="Specializations (comma-separated)" placeholder="Elder Care, Post-Surgery Care, Physiotherapy"
            value={form.specializations} onChange={e => setForm(f => ({ ...f, specializations: e.target.value }))} required />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3">
            <Input label="Years of Experience" type="number" min="0" value={form.experience}
              onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} required />
            <Input label="Base Rate (₹)" type="number" min="0" value={form.baseRate}
              onChange={e => setForm(f => ({ ...f, baseRate: e.target.value }))} required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Model</label>
              <select
                className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 !transition-colors bg-white text-gray-900"
                value={form.rateType}
                onChange={e => setForm(f => ({ ...f, rateType: e.target.value as any }))}
                required
              >
                <option value="hourly">Per Hour</option>
                <option value="daily">Per Day</option>
                <option value="weekly">Per Week</option>
                <option value="monthly">Per Month</option>
              </select>
            </div>
          </div>

          <Input label="Location" placeholder="Your city" value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required />

          <Input label="Service Areas (comma-separated)" placeholder="Mumbai, Thane, Navi Mumbai"
            value={form.serviceAreas} onChange={e => setForm(f => ({ ...f, serviceAreas: e.target.value }))} required />

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Available for Booking</label>
            <button type="button" onClick={() => setForm(f => ({ ...f, availability: !f.availability }))}
              className={cn('relative w-11 h-6 rounded-full transition-colors cursor-pointer',
                form.availability ? 'bg-emerald-500' : 'bg-gray-300')}>
              <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                form.availability ? 'translate-x-5' : 'translate-x-0')} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" variant="success" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Button>
            {saved && <span className="text-sm text-emerald-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Saved!</span>}
          </div>
        </form>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/*          DOCUMENT UPLOAD & AI ANALYSIS      */
/* ─────────────────────────────────────────── */

function DocumentManager() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<NurseDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<NurseDocument | null>(null);

  useEffect(() => {
    DocumentDB.getMetadataByNurseId(user!.id).then(setDocuments);
  }, [user]);


  const refresh = () => DocumentDB.getMetadataByNurseId(user!.id).then(setDocuments);

  const deleteDoc = async (id: string) => {
    await DocumentDB.delete(id);
    refresh();
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-blue-50 border-blue-200 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">AI-Powered Document Verification</p>
            <p className="text-xs text-blue-700 mt-1">
              Upload your certificates and government ID. Our AI system will analyze each document for authenticity using edge detection, texture analysis, compression artifact detection, and more. The admin will make the final verification decision.
            </p>
          </div>
        </div>
      </Card>

      {/* Upload Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors">
          <div className="text-center">
            <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-900">Certificate</p>
            <label className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium cursor-pointer hover:bg-blue-700 transition-all">
              <Upload className="w-3.5 h-3.5" /> Upload File
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'certificate')} />
            </label>
          </div>
        </Card>

        <Card className="p-4 border-2 border-dashed border-gray-200 hover:border-emerald-400 transition-colors">
          <div className="text-center">
            <User className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-900">Govt ID Card</p>
            <label className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium cursor-pointer hover:bg-emerald-700 transition-all">
              <Upload className="w-3.5 h-3.5" /> Upload File
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'government_id')} />
            </label>
          </div>
        </Card>

        <Card className="p-4 border-2 border-dashed border-gray-200 hover:border-purple-400 transition-colors">
          <div className="text-center">
            <Activity className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-900">Nursing License</p>
            <label className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium cursor-pointer hover:bg-purple-700 transition-all">
              <Upload className="w-3.5 h-3.5" /> Upload File
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'license')} />
            </label>
          </div>
        </Card>
      </div>

      {/* Existing Documents List */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Uploaded Documents ({documents.length})</h3>
          {documents.map((doc) => (
            <Card key={doc.id} className="p-4 group hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-50 rounded-xl">
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{doc.fileName}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{doc.documentType.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedDoc(doc)}>View Analysis</Button>
                  <Button variant="danger" size="sm" onClick={() => deleteDoc(doc.id)}>Delete</Button>
                </div>
              </div>
              {/* AI Analysis Summary */}
              {doc.aiAnalysis && doc.aiAnalysis.result !== 'pending' && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">AI Confidence Score</p>
                    <span className={cn('text-sm font-bold', doc.aiAnalysis.confidenceScore >= 0.7 ? 'text-emerald-600' : 'text-red-600')}>
                      {(doc.aiAnalysis.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <ProgressBar
                    value={doc.aiAnalysis.confidenceScore * 100}
                    color={doc.aiAnalysis.confidenceScore >= 0.7 ? 'green' : 'red'}
                  />
                </div>
              )}

              <div className="flex gap-2 mt-3">
                {doc.aiAnalysis && (
                  <Button size="sm" variant="ghost" onClick={async () => {
                    const fullDoc = await DocumentDB.getById(doc.id);
                    if (fullDoc) setSelectedDoc(fullDoc);
                    else setSelectedDoc(doc);
                  }}>
                    View Analysis
                  </Button>
                )}
                <Button size="sm" variant="danger" onClick={() => deleteDoc(doc.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Document Analysis Detail Modal */}
      {selectedDoc?.aiAnalysis && (
        <Modal isOpen onClose={() => setSelectedDoc(null)} title="AI Document Analysis" size="lg">
          <AnalysisDetail analysis={selectedDoc.aiAnalysis} fileName={selectedDoc.fileName} fileData={selectedDoc.fileData} />
        </Modal>
      )}
    </div>
  );
}

function AnalysisDetail({ analysis, fileName, fileData }: { analysis: DocumentAnalysis; fileName: string; fileData: string }) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const metrics = [
    { label: 'Edge Consistency', value: analysis.edgeConsistency, desc: 'Measures consistency of edge patterns across the document' },
    { label: 'Texture Analysis', value: analysis.textureAnalysis, desc: 'Checks uniformity of texture in document regions' },
    { label: 'Compression Artifacts', value: analysis.compressionArtifacts, desc: 'Detects suspicious JPEG compression patterns' },
    { label: 'OCR Consistency', value: analysis.ocrConsistency, desc: 'Validates text extraction consistency' },
    { label: 'Font Consistency', value: analysis.fontConsistency, desc: 'Checks font uniformity across text regions' },
    { label: 'Alignment Score', value: analysis.alignmentScore, desc: 'Measures text line alignment regularity' },
  ];

  return (
    <div className="space-y-5">
      {/* Document Preview */}
      {fileData && !fileData.includes('application/pdf') && (
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <img 
            src={fileData} 
            alt={fileName} 
            className="max-h-48 mx-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity" 
            onClick={() => setIsViewerOpen(true)}
          />
          <ImageViewerModal
            isOpen={isViewerOpen}
            onClose={() => setIsViewerOpen(false)}
            src={fileData}
            alt={fileName}
          />
        </div>
      )}

      {/* Overall Result */}
      <div className={cn('rounded-xl p-4 text-center', analysis.result === 'genuine' ? 'bg-emerald-50' : 'bg-red-50')}>
        {analysis.result === 'genuine' ? (
          <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
        ) : (
          <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-2" />
        )}
        <p className="text-lg font-bold text-gray-900">
          {analysis.result === 'genuine' ? 'Document Appears Genuine' : 'Suspected Forgery Detected'}
        </p>
        <p className="text-3xl font-bold mt-1" style={{ color: analysis.result === 'genuine' ? '#059669' : '#dc2626' }}>
          {(analysis.confidenceScore * 100).toFixed(1)}% Confidence
        </p>
      </div>

      {/* Detailed Metrics */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Analysis Metrics</h4>
        {metrics.map(m => (
          <div key={m.label} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">{m.label}</span>
              <span className={cn('font-medium', m.value >= 0.7 ? 'text-emerald-600' : m.value >= 0.5 ? 'text-amber-600' : 'text-red-600')}>
                {(m.value * 100).toFixed(0)}%
              </span>
            </div>
            <ProgressBar value={m.value * 100} color={m.value >= 0.7 ? 'green' : m.value >= 0.5 ? 'amber' : 'red'} />
            <p className="text-xs text-gray-500">{m.desc}</p>
          </div>
        ))}
      </div>

      {/* Anomalies */}
      {analysis.anomalies.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900">Detected Anomalies</h4>
          {analysis.anomalies.map((a, i) => (
            <div key={i} className="flex items-start gap-2 bg-red-50 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{a}</p>
            </div>
          ))}
        </div>
      )}

      {/* OCR Output */}
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900">OCR Text Extraction</h4>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-600 font-mono">{analysis.extractedText}</p>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Analysis completed at {new Date(analysis.analyzedAt).toLocaleString()}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/*     CERTIFICATE VERIFICATION SECTION        */
/* (Roboflow Pipeline - Nurse-facing UI)       */
/* ─────────────────────────────────────────── */

function CertificateVerificationSection({ nurseId }: { nurseId: string }) {
  const [reviews, setReviews] = useState<CertificateReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerSrc, setViewerSrc] = useState('');

  const loadReviews = async () => {
    setLoading(true);
    const data = await CertificateReviewDB.getByNurseId(nurseId);
    setReviews(data);
    setLoading(false);
  };

  useEffect(() => { loadReviews(); }, [nurseId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Only JPG, PNG, or WEBP images are accepted.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5 MB.');
      return;
    }

    setError(null);
    setUploading(true);
    const result = await verifyCertificate(file, nurseId);
    setUploading(false);
    e.target.value = '';

    if (!result.success) {
      setError(result.error || 'Verification failed. Please try again.');
      return;
    }

    await loadReviews();
  };

  const latestReview = reviews[0];

  const statusBadge = (status: CertificateReview['adminStatus']) => {
    if (status === 'approved') return <Badge variant="success">✅ Approved</Badge>;
    if (status === 'denied')   return <Badge variant="danger">❌ Denied</Badge>;
    return <Badge variant="warning">⏳ Verification Pending</Badge>;
  };

  return (
    <Card className="p-5 border-2 border-indigo-100 bg-indigo-50/30">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-100 rounded-xl">
          <Shield className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Certificate Verification</h3>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Spinner size="sm" /> Loading status...
        </div>
      ) : latestReview ? (
        <div className="space-y-3">
          {/* Status banner */}
          <div className={cn('rounded-xl p-3 flex items-center justify-between', {
            'bg-emerald-50 border border-emerald-200': latestReview.adminStatus === 'approved',
            'bg-red-50 border border-red-200':         latestReview.adminStatus === 'denied',
            'bg-amber-50 border border-amber-200':     latestReview.adminStatus === 'verification_pending',
          })}>
            <div>
              <p className="text-sm font-medium text-gray-900">Latest Certificate Review</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Submitted {new Date(latestReview.createdAt).toLocaleDateString()}
              </p>
              {latestReview.adminStatus === 'denied' && latestReview.adminNote && (
                <p className="text-xs text-red-600 mt-1">Admin note: {latestReview.adminNote}</p>
              )}
            </div>
            {statusBadge(latestReview.adminStatus)}
          </div>

          {/* Certificate thumbnail */}
          <div className="flex gap-3">
            {latestReview.certificateUrl && (
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Certificate</p>
                <img
                  src={latestReview.certificateUrl}
                  alt="Certificate"
                  className="w-20 h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => { setViewerSrc(latestReview.certificateUrl); setViewerOpen(true); }}
                />
              </div>
            )}
            {latestReview.croppedSignatureUrl && (
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Signature Detected</p>
                <img
                  src={latestReview.croppedSignatureUrl}
                  alt="Signature"
                  className="w-20 h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => { setViewerSrc(latestReview.croppedSignatureUrl!); setViewerOpen(true); }}
                />
              </div>
            )}
          </div>

          {/* Re-upload if denied */}
          {latestReview.adminStatus === 'denied' && (
            <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm cursor-pointer hover:bg-gray-50 transition-colors">
              <Upload className="w-4 h-4 text-gray-500" />
              Re-upload Certificate
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          )}
        </div>
      ) : (
        /* No review yet — show upload prompt */
        <div className="border-2 border-dashed border-indigo-200 rounded-xl p-6 text-center">
          <FileCheck className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700 mb-1">Upload your Certificate for AI Verification</p>
          <p className="text-xs text-gray-500 mb-3">Our AI will detect your signature and analyse the document. The admin will review and approve.</p>
          <label className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
            uploading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
          )}>
            {uploading ? <><Spinner size="sm" /> Analysing...</> : <><Upload className="w-4 h-4" /> Upload Certificate</>}
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      )}

      {uploading && (
        <div className="mt-3 text-center text-sm text-indigo-600 flex items-center justify-center gap-2">
          <Spinner size="sm" />
          🤖 AI is analysing your certificate signature...
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <ImageViewerModal isOpen={viewerOpen} onClose={() => setViewerOpen(false)} src={viewerSrc} alt="Certificate" />
    </Card>
  );
}


/* ─────────────────────────────────────────── */

function BookingManager() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (user) BookingDB.getByNurseId(user.id).then(setBookings);
  }, [user]);

  const refresh = () => {
    if (user) BookingDB.getByNurseId(user.id).then(setBookings);
  };

  const updateStatus = async (id: string, status: 'accepted' | 'rejected' | 'completed') => {
    const updateData: any = { status };
    if (status === 'completed') {
      updateData.paymentStatus = 'completed';
    }
    await BookingDB.update(id, updateData);
    const booking = await BookingDB.getById(id);
    if (booking) {
      await NotificationDB.create({
        userId: booking.userId,
        title: 'Booking Update',
        message: `Your booking with ${booking.nurseName} has been ${status}.`,
        type: status === 'rejected' ? 'warning' : 'success',
      });
    }
    refresh();
  };

  const statusBadge = (status: string) => {
    const map: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
      pending: 'warning', accepted: 'info', rejected: 'danger', completed: 'success', cancelled: 'neutral'
    };
    return <Badge variant={map[status] || 'neutral'}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const activeBookings = bookings.filter(b => b.status === 'accepted');
  const pastBookings = bookings.filter(b => ['completed', 'rejected', 'cancelled'].includes(b.status));

  return (
    <div className="space-y-6">
      {pendingBookings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            Pending Requests <Badge variant="warning">{pendingBookings.length}</Badge>
          </h3>
          {pendingBookings.map(booking => (
            <Card key={booking.id} className="p-5 border-amber-200 bg-amber-50/30">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{booking.userName}</h4>
                  <p className="text-sm text-gray-500">{booking.serviceType}</p>
                </div>
                {statusBadge(booking.status)}
              </div>
              <div className="text-sm text-gray-600 mb-3">
                <p>📅 {booking.startDate} → {booking.endDate}</p>
                <p>💰 ₹{booking.totalAmount.toLocaleString()} (Onsite)</p>
                {booking.notes && <p className="mt-1">📝 {booking.notes}</p>}

                {/* Contact Reveal Logic: Hidden until accepted */}
                <div className="mt-3 p-2 bg-gray-100/50 rounded-lg flex items-center justify-center border border-dashed border-gray-200">
                  <p className="text-gray-400 font-medium italic text-xs flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Patient contact locked until you accept
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="success" onClick={() => updateStatus(booking.id, 'accepted')}>
                  <CheckCircle className="w-3.5 h-3.5" /> Accept
                </Button>
                <Button size="sm" variant="danger" onClick={() => updateStatus(booking.id, 'rejected')}>
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeBookings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Active Bookings</h3>
          {activeBookings.map(booking => (
            <Card key={booking.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{booking.userName}</h4>
                  <p className="text-sm text-gray-500">{booking.serviceType} · {booking.startDate} → {booking.endDate}</p>

                  {/* Contact Reveal Logic: Visible because accepted */}
                  <div className="mt-2 p-2 bg-emerald-50 rounded-lg border border-emerald-100 inline-block">
                    <p className="text-emerald-800 font-medium text-sm flex items-center gap-1.5">
                      📞 Contact: {booking.userPhone || 'Not provided'}
                    </p>
                  </div>
                </div>
                {statusBadge(booking.status)}
              </div>
              <Button size="sm" variant="success" onClick={() => updateStatus(booking.id, 'completed')}>
                Mark Complete
              </Button>
            </Card>
          ))}
        </div>
      )}

      {pastBookings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Past Bookings</h3>
          {pastBookings.map(booking => (
            <Card key={booking.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{booking.userName}</h4>
                  <p className="text-xs text-gray-500">{booking.serviceType} · {booking.startDate}</p>
                </div>
                {statusBadge(booking.status)}
              </div>
              {booking.feedback && (
                <div className="mt-2 pt-2 border-t border-gray-100 text-sm text-gray-600">
                  ⭐ {booking.feedback.rating}/5 — "{booking.feedback.comment}"
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {bookings.length === 0 && (
        <EmptyState icon={<Calendar className="w-8 h-8 text-gray-400" />} title="No bookings yet" description="Once patients book your services, they'll appear here." />
      )}
    </div>
  );
}









