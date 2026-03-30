import { useState } from 'react';
import { useAuth } from '@/store/AuthContext';
import { Card, Input, Button, Badge } from '@/components/ui';
import { User, LogOut, Shield, Key, Camera } from 'lucide-react';
import { uploadImage, validateImageFile } from '@/utils/imageUpload';

export function NurseAccount() {
    const { user, updateUser, logout, resetPassword } = useAuth();

    const [form, setForm] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
    });

    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [message, setMessage] = useState('');
    const [photoUploading, setPhotoUploading] = useState(false);

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

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (user) {
                await updateUser({ name: form.name, phone: form.phone });
                setMessage('Account details updated successfully.');
            }
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleResetPassword = async () => {
        if (!user?.email) return;
        setResetting(true);
        try {
            const result = await resetPassword(user.email);
            if (result.success) {
                setMessage('Password reset email sent (Check your inbox or spam folder).');
            } else {
                setMessage(result.error || 'Failed to send reset email.');
            }
        } finally {
            setResetting(false);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h2 className="text-xl font-bold text-gray-900">Account Settings</h2>
                <p className="text-gray-500 text-sm mt-1">Manage your personal information, security and preferences.</p>
            </div>

            {message && (
                <div className="p-3 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium border border-blue-100">
                    {message}
                </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="p-6 text-center">
                        <div className="relative group w-32 h-32 mx-auto mb-4">
                            {user?.profile_photo ? (
                                <img
                                    src={user.profile_photo}
                                    alt={user?.name || 'Profile'}
                                    loading="lazy"
                                    className="w-full h-full rounded-full object-cover border-4 border-blue-50 shadow-sm"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <User className="w-10 h-10" />
                                </div>
                            )}
                            <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Camera className="w-8 h-8 text-white" />
                                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                            </label>
                            {photoUploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{user?.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
                        <Badge variant="success" className="mt-3">Verified Professional</Badge>
                    </Card>

                    {/* Security */}
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Security</h3>
                                <p className="text-sm text-gray-500">Authentication</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">We will email you a secure link to reset your password.</p>
                            <Button variant="outline" onClick={handleResetPassword} disabled={resetting} className="w-full justify-center">
                                {resetting ? 'Sending...' : <span className="flex items-center gap-2"><Key className="w-4 h-4" /> Reset Password</span>}
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="md:col-span-2 space-y-6">
                    {/* Profile Details */}
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Personal Details</h3>
                                <p className="text-sm text-gray-500">Update your basic account information.</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <Input
                                    label="Full Name"
                                    value={form.name}
                                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                    required
                                />
                                <Input
                                    label="Phone Number"
                                    value={form.phone}
                                    onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                                    required
                                />
                            </div>
                            <Input
                                label="Email Address"
                                value={user?.email || ''}
                                disabled
                                className="bg-gray-50 cursor-not-allowed text-gray-500"
                            />
                            <div className="pt-2 flex justify-end">
                                <Button type="submit" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
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
            </div>
        </div>
    );
}
