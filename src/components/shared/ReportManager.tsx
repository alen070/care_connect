import { useState, useEffect } from 'react';
import { useAuth } from '@/store/AuthContext';
import { ShelterReportDB, ShelterDB } from '@/store/database';
import { Button, Card, Badge, Modal, ImageViewerModal, Textarea } from '@/components/ui';
import { Camera, MapPin, Send, AlertTriangle } from 'lucide-react';
import type { ShelterReport } from '@/types';
import { uploadImage, validateImageFile } from '@/utils/imageUpload';

/* ─────────────────────────────────────────── */
/*        HOMELESS LOCATION REPORTING          */
/* ─────────────────────────────────────────── */

export function HomelessReport() {
    const { user } = useAuth();
    const [reports, setReports] = useState<ShelterReport[]>([]);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        if (user) {
            ShelterReportDB.getAll().then(all => setReports(all.filter(r => r.reportedBy === user.id)));
        }
    }, [user]);

    const refresh = () => {
        if (user) {
            ShelterReportDB.getAll().then(all => setReports(all.filter(r => r.reportedBy === user.id)));
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Humanitarian Help Reports</h3>
                    <p className="text-sm text-gray-500">Report individuals in need to connect them with shelters</p>
                </div>
                <Button onClick={() => setShowForm(true)}>
                    <Camera className="w-4 h-4" /> New Report
                </Button>
            </div>

            <Card className="p-4 bg-amber-50 border-amber-200">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-amber-800">Privacy Notice</p>
                        <p className="text-xs text-amber-700 mt-1">
                            This feature is designed with privacy-by-design principles. No facial recognition or identity tracking is used. Reports are shared only with verified shelters to provide assistance.
                        </p>
                    </div>
                </div>
            </Card>

            {reports.length > 0 && (
                <div className="space-y-3">
                    {reports.map(report => (
                        <ReportCard key={report.id} report={report} />
                    ))}
                </div>
            )}

            {showForm && (
                <Modal isOpen onClose={() => setShowForm(false)} title="Submit Humanitarian Report" size="lg">
                    <ReportForm userId={user!.id} userName={user!.name} onComplete={() => { setShowForm(false); refresh(); }} />
                </Modal>
            )}
        </div>
    );
}

function ReportCard({ report }: { report: ShelterReport }) {
    const [shelterName, setShelterName] = useState('');
    const [viewerOpen, setViewerOpen] = useState(false);

    useEffect(() => {
        if (report.assignedShelterId) {
            ShelterDB.getById(report.assignedShelterId).then(s => {
                if (s) setShelterName(s.name);
            });
        }
    }, [report.assignedShelterId]);

    const statusVariant = (): 'success' | 'info' | 'warning' | 'danger' | 'neutral' => {
        switch (report.status) {
            case 'assigned': return 'success';
            case 'resolved': return 'success';
            case 'notified': return 'info';
            default: return 'warning';
        }
    };

    const statusLabel = () => {
        switch (report.status) {
            case 'assigned': return '✅ Accepted by Shelter';
            case 'resolved': return '✅ Resolved';
            case 'notified': return '📨 Shelters Notified';
            default: return '⏳ Reported';
        }
    };

    return (
        <Card className="p-4">
            <div className="flex items-start gap-4">
                {/* Image thumbnail — click to open viewer */}
                {report.photo && (
                    <img
                        src={report.photo}
                        alt="Report"
                        loading="lazy"
                        className="w-20 h-20 object-cover rounded-lg border shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setViewerOpen(true)}
                    />
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="font-medium text-gray-900">{report.locationDescription}</p>
                            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{report.description}</p>
                        </div>
                        <Badge variant={statusVariant()}>{statusLabel()}</Badge>
                    </div>

                    <p className="text-xs text-gray-400 mt-2">
                        📍 {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)} · {new Date(report.createdAt).toLocaleDateString()}
                    </p>

                    {/* Assigned shelter info */}
                    {report.status === 'assigned' && shelterName && (
                        <div className="mt-2 bg-emerald-50 rounded-lg p-2">
                            <p className="text-xs text-emerald-700">
                                🏠 Accepted by <span className="font-semibold">{shelterName}</span>
                                {report.acceptedAt && ` · ${new Date(report.acceptedAt).toLocaleDateString()}`}
                            </p>
                        </div>
                    )}

                    {/* Nearby Shelters (for non-assigned) */}
                    {report.status !== 'assigned' && report.nearbyShelters.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-xs font-medium text-gray-500 mb-1">Nearby Shelters:</p>
                            {report.nearbyShelters.slice(0, 2).map(s => (
                                <p key={s.id} className="text-xs text-gray-600">🏠 {s.name} — {s.distanceKm?.toFixed(1)} km</p>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Image Viewer Modal */}
            <ImageViewerModal
                isOpen={viewerOpen}
                onClose={() => setViewerOpen(false)}
                src={report.photo}
                alt="Humanitarian Report Photo"
            />
        </Card>
    );
}

function ReportForm({ userId, userName, onComplete }: {
    userId: string; userName: string; onComplete: () => void;
}) {
    const [form, setForm] = useState({
        photo: '',
        photoPreview: '',
        photoFile: null as File | null,
        latitude: 0,
        longitude: 0,
        locationName: '',
        locationDescription: '',
        description: '',
    });
    const [gettingLocation, setGettingLocation] = useState(false);
    const [locationCaptured, setLocationCaptured] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [photoError, setPhotoError] = useState('');

    const getLocationName = async (lat: number, lon: number) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
            );
            const data = await res.json();
            const addr = data.address || {};
            const parts = [
                addr.suburb || addr.neighbourhood || addr.village || addr.town,
                addr.city || addr.county || addr.state_district,
                addr.state,
            ].filter(Boolean);
            return parts.join(', ') || 'Kerala, India';
        } catch {
            return 'Kerala, India';
        }
    };

    const getLocation = () => {
        setGettingLocation(true);
        setLocationError('');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async pos => {
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;
                    const name = await getLocationName(lat, lon);
                    setForm(f => ({
                        ...f,
                        latitude: lat,
                        longitude: lon,
                        locationName: name,
                        locationDescription: name,
                    }));
                    setLocationCaptured(true);
                    setGettingLocation(false);
                },
                () => {
                    setLocationError('Could not get location. Please type your location manually.');
                    setGettingLocation(false);
                },
                { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false }
            );
        } else {
            setLocationError('Location not supported. Please type your location manually.');
            setGettingLocation(false);
        }
    };

    const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const validationError = validateImageFile(file);
        if (validationError) {
            setPhotoError(validationError);
            return;
        }
        setPhotoError('');

        // Show a local preview immediately and save the file
        const previewUrl = URL.createObjectURL(file);
        setForm(f => ({ ...f, photoPreview: previewUrl, photoFile: file }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.photoFile && !form.photoPreview) {
            setPhotoError('Please select a photo.');
            return;
        }
        setSubmitting(true);
        try {
            let finalPhotoUrl = form.photo;

            // Upload photo if a new one was selected
            if (form.photoFile) {
                const result = await uploadImage('report', form.photoFile);
                if (result.success && result.url) {
                    finalPhotoUrl = result.url;
                } else {
                    alert(result.error || 'Photo upload failed. Please try again.');
                    setSubmitting(false);
                    return;
                }
            }

            const allShelters = await ShelterDB.getAll();
            const shelters = allShelters.map(s => ({
                ...s,
                distanceKm: haversineDistance(form.latitude || 9.9312, form.longitude || 76.2673, s.latitude, s.longitude),
            })).sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

            await ShelterReportDB.create({
                reportedBy: userId,
                reporterName: userName,
                photo: finalPhotoUrl,
                latitude: form.latitude || 9.9312,
                longitude: form.longitude || 76.2673,
                locationDescription: form.locationDescription || form.locationName,
                description: form.description,
                nearbyShelters: shelters.slice(0, 3),
                status: 'reported',
            });

            onComplete();
        } catch (err: any) {
            console.error('Submit Error:', err);
            alert('Failed to submit report. Please check your network and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Photo Upload */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    📸 Photo <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50">
                    {photoError && (
                        <p className="text-xs text-red-600 font-medium mb-2">{photoError}</p>
                    )}
                    {(form.photo || form.photoPreview) ? (
                        <div className="space-y-2">
                            <img src={form.photo || form.photoPreview} alt="Report" loading="lazy" className="max-h-48 mx-auto rounded-lg object-cover" />
                            <p className="text-xs text-green-600 font-medium">✅ Photo selected</p>
                        </div>
                    ) : (
                        <div>
                            <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Take or upload a photo</p>
                            <p className="text-xs text-gray-400 mt-1">No facial recognition used</p>
                        </div>
                    )}
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="mt-3 text-sm block mx-auto w-fit text-blue-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" required />
                </div>
            </div>

            {/* Location Section - NO raw coordinates shown */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    📍 Location <span className="text-red-500">*</span>
                </label>

                {/* Use My Location Button */}
                <button
                    type="button"
                    onClick={getLocation}
                    disabled={gettingLocation}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-700 font-medium text-sm hover:bg-blue-100 transition-colors disabled:opacity-60 mb-3"
                >
                    <MapPin className="w-4 h-4" />
                    {gettingLocation ? (
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            Detecting your location...
                        </span>
                    ) : (
                        '📍 Use My Current Location'
                    )}
                </button>

                {/* Location captured success */}
                {locationCaptured && form.locationName && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl mb-3">
                        <span className="text-green-500 text-lg">✅</span>
                        <div>
                            <p className="text-sm font-semibold text-green-800">{form.locationName}</p>
                            <p className="text-xs text-green-600">Location captured successfully</p>
                        </div>
                    </div>
                )}

                {/* Location error */}
                {locationError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-3">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <p className="text-xs text-red-600">{locationError}</p>
                    </div>
                )}

                {/* Manual location name input */}
                <div>
                    <label className="block text-xs text-gray-500 mb-1">
                        Location Name <span className="text-gray-400">(auto-filled or type manually)</span>
                    </label>
                    <input
                        type="text"
                        placeholder="e.g., Kakkanad, Ernakulam, Kerala"
                        value={form.locationDescription}
                        onChange={e => setForm(f => ({ ...f, locationDescription: e.target.value }))}
                        required
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Description */}
            <Textarea
                label="Describe the Situation"
                placeholder="e.g., Elderly man sleeping near bus stand, appears unwell, needs food and shelter..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                required
            />

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit Report & Alert Shelters'}
            </Button>
        </form>
    );
}

/** Haversine formula for distance between two GPS coordinates */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
