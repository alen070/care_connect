import { useState } from 'react';
import { useAuth } from '@/store/AuthContext';
import { Card, Input, Button, Badge } from '@/components/ui';
import { User, LogOut, Shield, Key, Camera, Building, MapPin } from 'lucide-react';
import { uploadImage, validateImageFile } from '@/utils/imageUpload';
import { ShelterDB } from '@/store/database';
import type { Shelter } from '@/types';

export function ShelterAccount({ shelter, onUpdate }: { shelter: Shelter; onUpdate: (s: Shelter) => void }) {
    const { user, updateUser, logout, resetPassword } = useAuth();

    const [userForm, setUserForm] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
    });

    const [shelterForm, setShelterForm] = useState({
        name: shelter.name,
        address: shelter.address,
        phone: shelter.phone || '',
        email: shelter.email || '',
        capacity: shelter.capacity.toString(),
        lat: shelter.latitude as number | undefined,
        lng: shelter.longitude as number | undefined,
    });

    const [savingUser, setSavingUser] = useState(false);
    const [savingShelter, setSavingShelter] = useState(false);
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

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingUser(true);
        try {
            if (user) {
                await updateUser({ name: userForm.name, phone: userForm.phone });
                setMessage('Account details updated!');
            }
        } finally {
            setSavingUser(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleUpdateShelter = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingShelter(true);
        try {
            const updated = await ShelterDB.update(shelter.id, {
                name: shelterForm.name,
                address: shelterForm.address,
                phone: shelterForm.phone,
                email: shelterForm.email,
                capacity: parseInt(shelterForm.capacity) || 0,
                latitude: shelterForm.lat ?? shelter.latitude,
                longitude: shelterForm.lng ?? shelter.longitude,
            });
            if (updated) {
                onUpdate(updated);
                setMessage('Shelter details updated!');
            }
        } finally {
            setSavingShelter(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleResetPassword = async () => {
        if (!user?.email) return;
        setResetting(true);
        try {
            const result = await resetPassword(user.email);
            if (result.success) {
                setMessage('Password reset email sent!');
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
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Manage Your Shelter</h2>
                    <p className="text-gray-500 text-sm mt-1">Configure your account and public shelter profile.</p>
                </div>
                {message && (
                    <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium border border-emerald-100 animate-fade-in">
                        {message}
                    </div>
                )}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column: Summary & Security */}
                <div className="lg:col-span-1 space-y-6">
                    {/* User Card */}
                    <Card className="p-6 text-center">
                        <div className="relative group w-24 h-24 mx-auto mb-4">
                            {user?.profile_photo ? (
                                <img
                                    src={user.profile_photo}
                                    alt={user?.name || 'Profile'}
                                    className="w-full h-full rounded-full object-cover border-4 border-amber-50 shadow-sm"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-2xl shadow-inner">
                                    {user?.name?.[0] || 'S'}
                                </div>
                            )}
                            <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Camera className="w-6 h-6 text-white" />
                                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                            </label>
                            {photoUploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{user?.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                        <Badge variant="warning" className="mt-3">Authorized Shelter</Badge>
                    </Card>

                    {/* Security Card */}
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <Shield className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-gray-900">Security</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Send a password reset link to your registered email address.</p>
                        <Button variant="outline" onClick={handleResetPassword} disabled={resetting} className="w-full justify-center">
                            {resetting ? 'Sending...' : <span className="flex items-center gap-2"><Key className="w-4 h-4" /> Reset Password</span>}
                        </Button>
                    </Card>

                    {/* Danger Zone */}
                    <Card className="p-4 bg-red-50 border-red-100">
                        <Button variant="danger" onClick={() => logout()} className="w-full justify-center gap-2">
                            <LogOut className="w-4 h-4" /> Sign Out from Account
                        </Button>
                    </Card>
                </div>

                {/* Right Column: Edit Forms */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Shelter Details */}
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                                <Building className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Shelter Profile</h3>
                                <p className="text-sm text-gray-500">Information visible to the humanitarian community.</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateShelter} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <Input
                                        label="Shelter Public Name"
                                        placeholder="Enter shelter name"
                                        value={shelterForm.name}
                                        onChange={e => setShelterForm(s => ({ ...s, name: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Input
                                        label="Full Physical Address"
                                        placeholder="Street, City, Kerala"
                                        value={shelterForm.address}
                                        onChange={e => setShelterForm(s => ({ ...s, address: e.target.value }))}
                                        required
                                    />
                                </div>
                                <Input
                                    label="Public Email"
                                    type="email"
                                    value={shelterForm.email}
                                    onChange={e => setShelterForm(s => ({ ...s, email: e.target.value }))}
                                />
                                <Input
                                    label="Public Phone"
                                    type="tel"
                                    value={shelterForm.phone}
                                    onChange={e => setShelterForm(s => ({ ...s, phone: e.target.value }))}
                                />
                                <div className="md:col-span-2 p-4 bg-gray-50 rounded-xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-700">GPS Coordinates</span>
                                        </div>
                                        <Button 
                                            type="button" 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => {
                                                navigator.geolocation.getCurrentPosition(
                                                    (pos) => {
                                                        const lat = pos.coords.latitude;
                                                        const lng = pos.coords.longitude;
                                                        // We'll save these when they submit the form
                                                        setShelterForm(s => ({ ...s, lat, lng })); 
                                                        setMessage('Location captured! Click "Update" to save.');
                                                    },
                                                    () => setMessage('Failed to get location.'),
                                                    { enableHighAccuracy: true }
                                                );
                                            }}
                                        >
                                            Get Current GPS
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-xs">
                                            <label className="text-gray-500">Latitude</label>
                                            <input 
                                                type="number" 
                                                step="any"
                                                className="w-full bg-white border border-gray-200 rounded-lg p-2 mt-1"
                                                value={shelterForm.lat ?? shelter.latitude}
                                                onChange={e => setShelterForm(s => ({ ...s, lat: parseFloat(e.target.value) }))}
                                            />
                                        </div>
                                        <div className="text-xs">
                                            <label className="text-gray-500">Longitude</label>
                                            <input 
                                                type="number" 
                                                step="any"
                                                className="w-full bg-white border border-gray-200 rounded-lg p-2 mt-1"
                                                value={shelterForm.lng ?? shelter.longitude}
                                                onChange={e => setShelterForm(s => ({ ...s, lng: parseFloat(e.target.value) }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Input
                                    label="Total Capacity (Beds)"
                                    type="number"
                                    value={shelterForm.capacity}
                                    onChange={e => setShelterForm(s => ({ ...s, capacity: e.target.value }))}
                                />
                            </div>
                            <div className="flex justify-end pt-4 border-t border-gray-50">
                                <Button type="submit" disabled={savingShelter} className="bg-amber-600 hover:bg-amber-700">
                                    {savingShelter ? 'Saving...' : 'Update Shelter Profile'}
                                </Button>
                            </div>
                        </form>
                    </Card>

                    {/* Personal Details */}
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                                <p className="text-sm text-gray-500">Private details for your individual account.</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <Input
                                    label="Administrative Name"
                                    value={userForm.name}
                                    onChange={e => setUserForm(u => ({ ...u, name: e.target.value }))}
                                    required
                                />
                                <Input
                                    label="Private Phone Number"
                                    value={userForm.phone}
                                    onChange={e => setUserForm(u => ({ ...u, phone: e.target.value }))}
                                    required
                                />
                                <div className="md:col-span-2">
                                    <Input
                                        label="Registered Email (Cannot be changed)"
                                        value={user?.email || ''}
                                        disabled
                                        className="bg-gray-50 text-gray-500"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 border-t border-gray-50">
                                <Button type="submit" disabled={savingUser}>
                                    {savingUser ? 'Saving...' : 'Update Personal Info'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
