/**
 * ============================================
 * ONBOARDING PAGE
 * ============================================
 * Captures mandatory fields (like phone number) explicitly omitted in OAuth flows.
 */

import { useState } from 'react';
import { useAuth } from '@/store/AuthContext';
import { Button, Input, Card } from '@/components/ui';
import { ShieldCheck, Building, Users, AlertTriangle, MapPin } from 'lucide-react';
import type { UserRole } from '@/types';
import logo from '@/assets/logo.png';

export function OnboardingPage() {
    const { user, updateUser, logout } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Pre-fill existing data
    const [role, setRole] = useState<UserRole | ''>(user?.role || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [location, setLocation] = useState(user?.location || '');

    // Role-specific fields
    const [specialization, setSpecialization] = useState('');
    const [experience, setExperience] = useState('');
    const [shelterName, setShelterName] = useState('');
    const [lat, setLat] = useState<number | undefined>();
    const [lng, setLng] = useState<number | undefined>();
    const [fetchingLocation, setFetchingLocation] = useState(false);

    const handleGetLocation = () => {
        setFetchingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLat(pos.coords.latitude);
                setLng(pos.coords.longitude);
                setFetchingLocation(false);
            },
            (err) => {
                console.error('Geolocation error:', err);
                setError('Failed to get location. Please allow location access.');
                setFetchingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!role) {
            setError('Please select an account type.');
            return;
        }
        if (!phone || phone.length < 10) {
            setError('Please enter a valid phone number (at least 10 digits).');
            return;
        }

        if (role === 'nurse' && (!specialization || !experience)) {
            setError('Please provide your specialization and years of experience.');
            return;
        }
        if (role === 'shelter' && !shelterName) {
            setError('Please provide the shelter name.');
            return;
        }
        
        console.log('[Onboarding] Submitting for role:', role);
        setSubmitting(true);
        try {
            await updateUser({
                role: role as UserRole,
                phone,
                location,
                name: role === 'shelter' && shelterName ? shelterName : user?.name,
                // These will be picked up by the shelter creation logic in AuthContext
                ...((role === 'shelter') ? {
                    shelterLat: lat,
                    shelterLng: lng,
                    shelterName: shelterName,
                    shelterAddress: location
                } : {})
            } as any);
            console.log('[Onboarding] Update sent successfully');
            // We usually don't setSubmitting(false) here because the page will 
            // unmount as App.tsx re-renders with the new user state.
            // But if it takes a while, we should let the user try again if it didn't unmount.
            setTimeout(() => setSubmitting(false), 5000); 
        } catch (err: any) {
            console.error('[Onboarding] Submission failed:', err);
            setError(err.message || 'Failed to save profile details.');
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
            <header className="px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-1 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
                            <img src={logo} alt="CareConnect" className="w-9 h-9 object-contain" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">CareConnect</h1>
                            <p className="text-xs text-gray-500 -mt-0.5">Care Assistant Finder</p>
                        </div>
                    </div>
                    <button onClick={logout} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">
                        Sign Out
                    </button>
                </div>
            </header>

            <div className="flex-1 flex items-center justify-center p-6">
                <Card className="w-full max-w-xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Complete Your Profile</h2>
                        <p className="text-gray-500 mt-2">
                            Welcome, {user?.name?.split(' ')[0]}! We just need a few more details to get your account fully set up.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!user?.role && (
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-gray-900">I am joining as a:</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <button type="button" onClick={() => setRole('user')}
                                        className={`p-4 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer flex flex-col items-center gap-2 ${role === 'user' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                        <Users className="w-6 h-6" /> Patient / Family
                                    </button>
                                    <button type="button" onClick={() => setRole('nurse')}
                                        className={`p-4 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer flex flex-col items-center gap-2 ${role === 'nurse' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                        <ShieldCheck className="w-6 h-6" /> Nurse / Caregiver
                                    </button>
                                    <button type="button" onClick={() => setRole('shelter')}
                                        className={`p-4 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer flex flex-col items-center gap-2 ${role === 'shelter' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                        <Building className="w-6 h-6" /> Shelter / NGO
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
                            <Input
                                label="Phone Number *"
                                type="tel"
                                placeholder="Enter your 10-digit mobile number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                            <Input
                                label={role === 'shelter' ? "Shelter Address *" : "City / Location"}
                                placeholder="e.g. Kochi, Kerala"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                required={role === 'shelter'}
                            />
                        </div>

                        {role === 'nurse' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Professional Details</h3>
                                <Input
                                    label="Primary Specialization *"
                                    placeholder="e.g. ICU, General Care, Elderly Care"
                                    value={specialization}
                                    onChange={(e) => setSpecialization(e.target.value)}
                                    required
                                />
                                <Input
                                    label="Years of Experience *"
                                    type="number"
                                    placeholder="e.g. 5"
                                    value={experience}
                                    onChange={(e) => setExperience(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        {role === 'shelter' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Shelter Facility Details</h3>
                                <Input
                                    label="Shelter Official Name *"
                                    placeholder="e.g. Sneha Bhavan Shelter"
                                    value={shelterName}
                                    onChange={(e) => setShelterName(e.target.value)}
                                    required
                                />
                                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                                            <MapPin className="w-4 h-4" /> Shelter Coordinates
                                        </p>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={handleGetLocation}
                                            loading={fetchingLocation}
                                            className="bg-white border-amber-300 text-amber-700 hover:bg-amber-100"
                                        >
                                            Get Current Location
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Latitude"
                                            type="number"
                                            step="any"
                                            value={lat || ''}
                                            onChange={(e) => setLat(parseFloat(e.target.value))}
                                            placeholder="0.0000"
                                        />
                                        <Input
                                            label="Longitude"
                                            type="number"
                                            step="any"
                                            value={lng || ''}
                                            onChange={(e) => setLng(parseFloat(e.target.value))}
                                            placeholder="0.0000"
                                        />
                                    </div>
                                    <p className="text-[10px] text-amber-600">
                                        GPS coordinates help people find your shelter on the map for humanitarian help.
                                    </p>
                                </div>
                            </div>
                        )}

                        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                            {submitting ? 'Setting up account...' : 'Complete Profile Setup'}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
