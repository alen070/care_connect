/**
 * ============================================
 * USER (PATIENT/FAMILY) DASHBOARD
 * ============================================
 * Features: Search nurses, book services, manage bookings,
 * submit feedback, report homeless individuals.
 *
 * Updated for async Supabase database operations.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '@/store/AuthContext';
import { NurseProfileDB, BookingDB, NotificationDB } from '@/store/database';
import { supabase } from '@/lib/supabase';
import { Button, Input, Textarea, Card, Badge, Modal, StarRating, EmptyState, Select } from '@/components/ui';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Search, Calendar, MapPin, Star, Clock, MessageSquare, Camera, Send, CheckCircle, Heart, User, Pencil, Home, CreditCard, Bell, LogOut, Key } from 'lucide-react';
import type { NurseProfile, Booking } from '@/types';
import { cn } from '@/utils/cn';
import { uploadImage, validateImageFile } from '@/utils/imageUpload';

// Import New Sub-Modules
import { UserHome } from './UserHome';
import { UserPayments } from './UserPayments';
import { UserNotifications } from './UserNotifications';
import { UserFeedback } from './UserFeedback';
import { HomelessReport } from '../shared/ReportManager';

type Tab = 'home' | 'search' | 'bookings' | 'payments' | 'report' | 'feedback' | 'notifications' | 'account';

export function UserDashboard({ onGoToLanding }: { onGoToLanding: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [loadedTabs, setLoadedTabs] = useState<Tab[]>(['search']);

  const handleTabChange = (id: string) => {
    setActiveTab(id as Tab);
    if (!loadedTabs.includes(id as Tab)) {
      setLoadedTabs(prev => [...prev, id as Tab]);
    }
  };

  const tabs = [
    { id: 'home' as Tab, label: 'Overview', icon: <Home className="w-4 h-4" /> },
    { id: 'search' as Tab, label: 'Find Nurses', icon: <Search className="w-4 h-4" /> },
    { id: 'bookings' as Tab, label: 'My Bookings', icon: <Calendar className="w-4 h-4" /> },
    { id: 'payments' as Tab, label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'report' as Tab, label: 'Help Report', icon: <Heart className="w-4 h-4" /> },
    { id: 'feedback' as Tab, label: 'Feedback', icon: <Star className="w-4 h-4" /> },
    { id: 'notifications' as Tab, label: 'Alerts', icon: <Bell className="w-4 h-4" /> },
    { id: 'account' as Tab, label: 'My Account', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <DashboardLayout
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onGoToLanding={onGoToLanding}
    >
      <div className="w-full">
        <div style={{ display: activeTab === 'home' ? 'block' : 'none' }}>
          {loadedTabs.includes('home') && <UserHome onNavigate={handleTabChange} />}
        </div>
        <div style={{ display: activeTab === 'search' ? 'block' : 'none' }}>
          {loadedTabs.includes('search') && <NurseSearch />}
        </div>
        <div style={{ display: activeTab === 'bookings' ? 'block' : 'none' }}>
          {loadedTabs.includes('bookings') && <MyBookings onNavigate={handleTabChange} />}
        </div>
        <div style={{ display: activeTab === 'payments' ? 'block' : 'none' }}>
          {loadedTabs.includes('payments') && <UserPayments />}
        </div>
        <div style={{ display: activeTab === 'report' ? 'block' : 'none' }}>
          {loadedTabs.includes('report') && <HomelessReport />}
        </div>
        <div style={{ display: activeTab === 'feedback' ? 'block' : 'none' }}>
          {loadedTabs.includes('feedback') && <UserFeedback />}
        </div>
        <div style={{ display: activeTab === 'notifications' ? 'block' : 'none' }}>
          {loadedTabs.includes('notifications') && <UserNotifications />}
        </div>
        <div style={{ display: activeTab === 'account' ? 'block' : 'none' }}>
          {loadedTabs.includes('account') && <MyAccount />}
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ─────────────────────────────────────────── */
/*              MY ACCOUNT                     */
/* ─────────────────────────────────────────── */

function MyAccount() {
  const { user, updateUser, logout } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', location: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setResettingPassword(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/`,
    });
    setResettingPassword(false);
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Password reset email sent! Please check your inbox.');
    }
  };

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
    await updateUser({
      name: form.name,
      phone: form.phone,
      location: form.location,
    });
    setSaving(false);
    setMessage('Profile updated successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Photo */}
      <Card className="p-6">
        <div className="flex items-center gap-6">
          <div className="relative group">
            {user.profile_photo ? (
              <img
                src={user.profile_photo}
                alt={user.name}
                loading="lazy"
                className="w-24 h-24 rounded-2xl object-cover border-2 border-gray-100 shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-sm">
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
            <Badge variant={user.role === 'admin' ? 'info' : 'success'} className="mt-1">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </Badge>
            <p className="text-xs text-gray-400 mt-1">Hover photo to change</p>
          </div>
        </div>
      </Card>

      {/* Edit Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Pencil className="w-5 h-5 text-blue-600" /> Edit Profile
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
          <Input
            label="Full Name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          />
          <Input
            label="Location"
            value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            placeholder="City name"
          />

          {/* Read-only info */}
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

      {/* Account Security / Danger Zone */}
      <Card className="p-6 border-red-100 bg-red-50/30">
        <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
          Account Security
        </h3>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900">Reset Password</p>
              <p className="text-sm text-gray-500">Receive an email with a link to choose a new password.</p>
            </div>
            <Button
              variant="outline"
              onClick={handleResetPassword}
              disabled={resettingPassword}
              className="shrink-0 bg-white"
            >
              <span className="flex items-center gap-2"><Key className="w-4 h-4" /> {resettingPassword ? 'Sending Link...' : 'Send Reset Link'}</span>
            </Button>
          </div>

          <div className="pt-4 border-t border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium text-red-700">Log Out</p>
              <p className="text-sm text-red-600/80">Securely sign out of your account on this device.</p>
            </div>
            <Button variant="danger" onClick={() => logout()} className="shrink-0">
              <span className="flex items-center gap-2"><LogOut className="w-4 h-4" /> Sign Out</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}


/* ─────────────────────────────────────────── */
/*            NURSE SEARCH & BOOKING           */
/* ─────────────────────────────────────────── */

function NurseSearch() {
  const { user } = useAuth();
  const [location, setLocation] = useState('');
  const [service, setService] = useState('');
  const [minRating, setMinRating] = useState('0');
  const [minExp, setMinExp] = useState('0');
  const [reqAvailable, setReqAvailable] = useState(false);
  const [selectedNurse, setSelectedNurse] = useState<NurseProfile | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [results, setResults] = useState<NurseProfile[]>([]);
  const [filteredResults, setFilteredResults] = useState<NurseProfile[]>([]);
  const [nurseData, setNurseData] = useState<Record<string, { name: string, photo?: string }>>({});
  const [, setRefresh] = useState(0);

  // Search nurses (async)
  useEffect(() => {
    NurseProfileDB.search(location || undefined, service || undefined).then(setResults);
  }, [location, service, setRefresh]);

  // Apply UI Filters
  useEffect(() => {
    let filtered = results;
    if (minRating !== '0') {
      filtered = filtered.filter(n => n.rating >= Number(minRating));
    }
    if (minExp !== '0') {
      filtered = filtered.filter(n => n.experience >= Number(minExp));
    }
    if (reqAvailable) {
      filtered = filtered.filter(n => n.availability === true);
    }
    setFilteredResults(filtered);
  }, [results, minRating, minExp, reqAvailable]);

  // Resolve nurse names and photos for the results in a batch
  useEffect(() => {
    const fetchData = async () => {
      if (results.length === 0) return;
      const ids = results.map(n => n.userId);
      const { data, error } = await supabase.from('profiles').select('id, name, profile_photo').in('id', ids);

      if (!error && data) {
        const ndata: Record<string, { name: string, photo?: string }> = {};
        data.forEach(u => {
          ndata[u.id] = { name: u.name, photo: u.profile_photo };
        });
        setNurseData(ndata);
      }
    };
    fetchData();
  }, [results]);

  const getNurseData = (userId: string) => nurseData[userId] || { name: 'Unknown' };

  const handleBookingCreated = () => {
    setShowBooking(false);
    setSelectedNurse(null);
    setRefresh(r => r + 1);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" /> Search Verified Nurses
        </h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Input
            placeholder="Location (e.g., Mumbai)"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
          <Input
            placeholder="Service (e.g., Elder Care)"
            value={service}
            onChange={e => setService(e.target.value)}
          />
          <Select
            options={[
              { value: '0', label: 'Any Rating' },
              { value: '3', label: '3+ Stars' },
              { value: '4', label: '4+ Stars' },
              { value: '4.5', label: '4.5+ Stars' }
            ]}
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
          />
          <Select
            options={[
              { value: '0', label: 'Any Experience' },
              { value: '1', label: '1+ Years' },
              { value: '3', label: '3+ Years' },
              { value: '5', label: '5+ Years' }
            ]}
            value={minExp}
            onChange={(e) => setMinExp(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 px-1">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={reqAvailable}
              onChange={e => setReqAvailable(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            Currently Available Only
          </label>
        </div>
      </Card>

      {/* Results */}
      {filteredResults.length === 0 ? (
        <EmptyState
          icon={<Search className="w-8 h-8 text-gray-400" />}
          title="No nurses found"
          description="Try adjusting your filters or search criteria."
        />
      ) : (
        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-4">
          {filteredResults.map(nurse => (
            <Card key={nurse.userId} className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-gray-100 flex flex-col h-full rounded-[1.5rem]">
              {/* Card Header (Visual Area) - Reduced Height */}
              <div className="relative h-36 bg-gradient-to-br from-[#eb4899] to-[#d61f69] flex items-center justify-center p-4">
                {/* Verified Badge */}
                <div className="absolute top-2.5 left-2.5 bg-white rounded-full p-1 shadow-sm">
                  <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-50" />
                </div>

                {/* Availability Badge */}
                {nurse.availability && (
                  <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                    <span className="text-[9px] font-bold text-[#10b981] uppercase tracking-wider">Available</span>
                  </div>
                )}

                {/* Avatar - Reduced Size */}
                <div className="relative">
                  {getNurseData(nurse.userId).photo ? (
                    <img
                      src={getNurseData(nurse.userId).photo}
                      alt=""
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/30 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {getNurseData(nurse.userId).name[0] || '?'}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Content - Compact Spacing */}
              <div className="p-4 flex-grow text-center flex flex-col items-center justify-center">
                {/* Identity Stack */}
                <h4 className="text-lg font-bold text-gray-900 mb-0.5 leading-tight">{getNurseData(nurse.userId).name}</h4>
                <p className="text-xs font-bold text-emerald-600 mb-4 flex items-center gap-1.5 uppercase tracking-wide">
                  <MapPin className="w-3.5 h-3.5" /> {nurse.location}
                </p>

                {/* Stars Section */}
                <div className="flex flex-col items-center gap-1.5 mb-4">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "w-4 h-4",
                          star <= Math.round(nurse.rating) ? "text-amber-400 fill-amber-400" : "text-gray-200"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-gray-400 font-bold uppercase">
                    {nurse.rating > 0 ? `${nurse.rating.toFixed(1)} Rating` : 'New'}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                    ({nurse.totalReviews || 0} reviews)
                  </span>
                </div>

                {/* Experience Detail */}
                <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 opacity-40" />
                  <span>{nurse.experience} Years Experience</span>
                </div>
              </div>

              {/* Footer Button - Smaller Padding */}
              <div className="px-4 pb-4">
                <button
                  onClick={() => setSelectedNurse(nurse)}
                  className="w-full py-2 border-2 border-blue-500 rounded-full text-blue-600 text-sm font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 group-hover:shadow-md"
                >
                  View Profile
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Nurse Profile Modal */}
      {selectedNurse && !showBooking && (
        <Modal isOpen onClose={() => setSelectedNurse(null)} title="Nurse Profile" size="lg">
          <NurseProfileView nurse={selectedNurse} nurseData={getNurseData(selectedNurse.userId)} onBook={() => setShowBooking(true)} />
        </Modal>
      )}

      {/* Booking Modal */}
      {showBooking && selectedNurse && user && (
        <Modal isOpen onClose={() => setShowBooking(false)} title="Book Nurse Service" size="md">
          <BookingForm nurse={selectedNurse} userId={user.id} userName={user.name} nurseName={getNurseData(selectedNurse.userId).name} onComplete={handleBookingCreated} />
        </Modal>
      )}
    </div>
  );
}

function NurseProfileView({ nurse, nurseData, nursePhone, hideBooking, onBook }: { nurse: NurseProfile; nurseData: { name: string, photo?: string }; nursePhone?: string; hideBooking?: boolean; onBook?: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        {nurseData.photo ? (
          <img src={nurseData.photo} alt={nurseData.name} className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-gray-100" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold border border-blue-500">
            {nurseData.name[0] || '?'}
          </div>
        )}
        <div>
          <h3 className="text-xl font-bold text-gray-900">{nurseData.name}</h3>
          <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {nurse.location}</p>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={Math.round(nurse.rating)} readonly />
            <span className="text-sm text-gray-500">({nurse.totalReviews} reviews)</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-medium text-gray-900 mb-2">About</h4>
        <p className="text-sm text-gray-600">{nurse.bio}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-blue-50 rounded-xl p-4 flex flex-col justify-center items-center">
          <p className="text-2xl font-bold text-blue-600">{nurse.experience}</p>
          <p className="text-xs text-gray-500">Years Exp.</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 flex flex-col justify-center items-center">
          <p className="text-2xl font-bold text-amber-600">{nurse.rating > 0 ? nurse.rating.toFixed(1) : 'N/A'}</p>
          <p className="text-xs text-gray-500">Rating</p>
        </div>
      </div>

      <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900 mb-1">Pricing</h4>
          <p className="text-sm text-gray-500">Fixed base rate</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-emerald-600">₹{nurse.baseRate}</p>
          <p className="text-xs text-gray-500 font-medium">Per {nurse.rateType.charAt(0).toUpperCase() + nurse.rateType.slice(1)}</p>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-2">Specializations</h4>
        <div className="flex flex-wrap gap-2">
          {nurse.specializations.map(s => <Badge key={s} variant="info">{s}</Badge>)}
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-2">Service Areas</h4>
        <div className="flex flex-wrap gap-2">
          {nurse.serviceAreas.map(a => <Badge key={a} variant="neutral">{a}</Badge>)}
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-2">Contact</h4>
        {nursePhone ? (
          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-800">📞 {nursePhone}</span>
            <Badge variant="success">Confirmed</Badge>
          </div>
        ) : (
          <>
            <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100 flex items-center justify-between">
              <span className="text-sm text-gray-600">📞 +91 ••••• •••••</span>
              <Badge variant="warning">Hidden</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic">* Contact details are revealed once the booking is confirmed.</p>
          </>
        )}
      </div>

      {!hideBooking && onBook && (
        <Button onClick={onBook} className="w-full" size="lg">
          <Calendar className="w-4 h-4" /> Book This Nurse
        </Button>
      )}
    </div >
  );
}

function BookingForm({ nurse, userId, userName, nurseName, onComplete }: {
  nurse: NurseProfile; userId: string; userName: string; nurseName: string; onComplete: () => void;
}) {
  const [form, setForm] = useState({
    serviceType: nurse.specializations[0] || '',
    startDate: '',
    endDate: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const totalDays = useMemo(() => {
    if (!form.startDate || !form.endDate) return 0;
    const diff = new Date(form.endDate).getTime() - new Date(form.startDate).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [form.startDate, form.endDate]);

  const totalAmount = useMemo(() => {
    let multiplier = 1;
    if (nurse.rateType === 'hourly') multiplier = 8; // Assuming 8 hours for a daily booking
    if (nurse.rateType === 'weekly') multiplier = 1 / 7; // Rough estimate if booking by days
    if (nurse.rateType === 'monthly') multiplier = 1 / 30; // Rough estimate if booking by days

    return Math.round(totalDays * nurse.baseRate * multiplier);
  }, [totalDays, nurse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await BookingDB.create({
        userId,
        nurseId: nurse.userId,
        userName,
        nurseName,
        serviceType: form.serviceType,
        startDate: form.startDate,
        endDate: form.endDate,
        status: 'pending',
        paymentMethod: 'cod',
        totalAmount,
        notes: form.notes,
      });

      await NotificationDB.create({
        userId: nurse.userId,
        title: 'New Booking Request',
        message: `${userName} has requested your ${form.serviceType} services.`,
        type: 'info'
      });

      onComplete();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
          {nurseName[0]}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{nurseName}</p>
          <p className="text-sm text-gray-600">₹{nurse.baseRate} / {nurse.rateType.substring(0, 2)}</p>
        </div>
      </div>

      <Select
        label="Service Type"
        value={form.serviceType}
        onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))}
        options={nurse.specializations.map(s => ({ value: s, label: s }))}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Start Date" type="date" value={form.startDate}
          onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required
          min={new Date().toISOString().split('T')[0]} />
        <Input label="End Date" type="date" value={form.endDate}
          onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} required
          min={form.startDate || new Date().toISOString().split('T')[0]} />
      </div>

      <Textarea label="Notes / Special Requirements" placeholder="Describe any specific needs..."
        value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />

      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Duration</span>
          <span className="font-medium">{totalDays} day{totalDays !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex justify-between items-center text-sm mb-4 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
          <span className="text-gray-600 font-medium">Rate:</span>
          <span className="font-bold text-emerald-700">₹{nurse.baseRate} / {nurse.rateType.substring(0, 2)}</span>
        </div>
        <hr className="border-gray-200" />
        <div className="flex justify-between">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-bold text-blue-600 text-lg">₹{totalAmount.toLocaleString()}</span>
        </div>
        <Badge variant="info">💵 Onsite Payment</Badge>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={!form.startDate || !form.endDate || totalDays <= 0 || submitting}>
        <Send className="w-4 h-4" /> {submitting ? 'Booking...' : 'Confirm Booking'}
      </Button>
    </form>
  );
}

/* ─────────────────────────────────────────── */
/*              MY BOOKINGS                    */
/* ─────────────────────────────────────────── */

function MyBookings({ onNavigate }: { onNavigate?: (tabId: string) => void }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'accepted' | 'completed' | 'cancelled'>('all');
  const [loading, setLoading] = useState(true);

  // Profile Viewer modal specifically for my bookings
  const [selectedNurseProfile, setSelectedNurseProfile] = useState<NurseProfile | null>(null);
  const [nurseModalData, setNurseModalData] = useState<{ name: string, photo?: string } | null>(null);
  const [nurseContactPhone, setNurseContactPhone] = useState<string>('');

  const loadBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await BookingDB.getByUserId(user.id);
      setBookings(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const refresh = () => {
    loadBookings();
  };

  const cancelBooking = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    await BookingDB.update(id, { status: 'cancelled' });
    refresh();
  };

  const statusBadge = (status: string) => {
    const map: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
      pending: 'warning', accepted: 'info', rejected: 'danger', completed: 'success', cancelled: 'neutral'
    };
    return <Badge variant={map[status] || 'neutral'}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const viewNurseProfile = async (nurseId: string, phone: string, name: string) => {
    const profile = await NurseProfileDB.getByUserId(nurseId);
    if (!profile) return;
    setSelectedNurseProfile(profile);
    const { data } = await supabase.from('profiles').select('phone, profile_photo').eq('id', nurseId).single();
    setNurseContactPhone(phone || data?.phone || 'Not provided');
    setNurseModalData({ name: name, photo: data?.profile_photo });
  };

  const filteredBookings = bookings.filter(b => filterTab === 'all' || b.status === filterTab);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          My Bookings
        </h3>

        <div className="flex gap-1 overflow-x-auto hide-scrollbar bg-gray-100 p-1 rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer',
                filterTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <EmptyState icon={<Calendar className="w-8 h-8 text-gray-400" />} title="No bookings found" description="You don't have any bookings in this category." />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredBookings.map(booking => (
            <Card key={booking.id} className="p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3 border-b border-gray-100 pb-3">
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">{booking.nurseName}</h4>
                  <p className="text-sm font-medium text-blue-600">{booking.serviceType}</p>
                </div>
                {statusBadge(booking.status)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                <span>📅 {booking.startDate} → {booking.endDate}</span>
                <span className="text-right font-medium text-gray-900">
                  ₹{booking.totalAmount > 0 ? booking.totalAmount.toLocaleString() : 'Pending sync'}
                </span>
              </div>

              {booking.notes && <p className="text-sm text-gray-500 mb-3">📝 {booking.notes}</p>}

              <div className="mt-auto pt-4 flex flex-col gap-2">
                {['accepted', 'completed'].includes(booking.status) && (
                  <Button size="sm" variant="outline" onClick={() => viewNurseProfile(booking.nurseId, booking.nursePhone || '', booking.nurseName)} className="w-full bg-white text-blue-700 border-blue-200 hover:bg-blue-50">
                    <User className="w-4 h-4 mr-2" /> View Profile & Contact
                  </Button>
                )}

                {['pending', 'accepted'].includes(booking.status) && (
                  <Button size="sm" variant="danger" onClick={() => cancelBooking(booking.id)} className="w-full">
                    Cancel Booking
                  </Button>
                )}
                {booking.status === 'completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-green-700 bg-green-50 border-green-200 hover:bg-green-100"
                    onClick={() => onNavigate?.('feedback')}
                  >
                    {booking.feedback ? (
                      <><Star className="w-4 h-4 mr-2" /> View Your Review</>
                    ) : (
                      <><MessageSquare className="w-4 h-4 mr-2" /> Go to Feedback Tab</>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Embedded Nurse Profile Viewer for Accepted Bookings */}
      {selectedNurseProfile && nurseModalData && (
        <Modal isOpen onClose={() => setSelectedNurseProfile(null)} title="Nurse Provider Profile" size="lg">
          <NurseProfileView
            nurse={selectedNurseProfile}
            nurseData={nurseModalData}
            nursePhone={nurseContactPhone}
            hideBooking={true}
          />
        </Modal>
      )}
    </div>
  );
}



