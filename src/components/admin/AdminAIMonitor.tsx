/**
 * ============================================
 * ADMIN AI MONITOR — Document Analysis Dashboard
 * ============================================
 * Shows AI analysis stats, per-document results,
 * and lets admin override AI decisions.
 */

import { useState, useEffect } from 'react';
import { DocumentDB, UserDB, AdminLogDB } from '@/store/database';
import { useAuth } from '@/store/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Button, StatsCard, EmptyState, ImageViewerModal } from '@/components/ui';
import { Shield, FileCheck, CheckCircle, AlertTriangle, XCircle, Eye } from 'lucide-react';
import type { NurseDocument } from '@/types';
import { cn } from '@/utils/cn';

export function AdminAIMonitor() {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<NurseDocument[]>([]);
    const [nurseNames, setNurseNames] = useState<Record<string, string>>({});
    const [filter, setFilter] = useState<'all' | 'genuine' | 'forgery' | 'pending'>('all');
    const [selectedDoc, setSelectedDoc] = useState<NurseDocument | null>(null);
    const [viewerOpen, setViewerOpen] = useState(false);

    useEffect(() => {
        const fetchDocs = () => {
            DocumentDB.getAllOverview().then(async docs => {
                setDocuments(docs);
                const names: Record<string, string> = {};
                const seenIds = new Set<string>();
                for (const doc of docs) {
                    if (!seenIds.has(doc.nurseId)) {
                        seenIds.add(doc.nurseId);
                        const u = await UserDB.getById(doc.nurseId);
                        names[doc.nurseId] = u?.name || 'Unknown';
                    }
                }
                setNurseNames(prev => ({ ...prev, ...names }));
            });
        };

        fetchDocs();

        // Real-time subscription to "forward" new uploads to this dashboard instantly
        const channel = supabase
            .channel('admin-ai-monitor')
            .on('postgres_changes', { event: '*', table: 'nurse_documents', schema: 'public' }, () => {
                console.log('[AdminAIMonitor] Real-time document update received!');
                fetchDocs();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const genuineCount = documents.filter(d => d.aiAnalysis?.result === 'genuine').length;
    const forgeryCount = documents.filter(d => d.aiAnalysis?.result === 'suspected_forgery').length;
    const pendingCount = documents.filter(d => !d.aiAnalysis).length;
    const accuracy = documents.length > 0
        ? Math.round(((genuineCount + forgeryCount) / documents.length) * 100)
        : 0;

    const filtered = documents.filter(d => {
        if (filter === 'genuine') return d.aiAnalysis?.result === 'genuine';
        if (filter === 'forgery') return d.aiAnalysis?.result === 'suspected_forgery';
        if (filter === 'pending') return !d.aiAnalysis;
        return true;
    });

    const overrideAI = async (doc: NurseDocument, newResult: 'genuine' | 'suspected_forgery') => {
        const existing = doc.aiAnalysis || {
            result: newResult, confidenceScore: 0, edgeConsistency: 0, textureAnalysis: 0,
            compressionArtifacts: 0, ocrConsistency: 0, fontConsistency: 0, alignmentScore: 0,
            extractedText: '', anomalies: [], analyzedAt: new Date().toISOString(),
        };
        await DocumentDB.update(doc.id, {
            aiAnalysis: { ...existing, result: newResult },
        });
        if (user) {
            await AdminLogDB.create({
                adminId: user.id, adminName: user.name,
                action: 'AI Override', target: `Document ${doc.fileName}`,
                details: `Changed AI result to "${newResult}" for nurse ${nurseNames[doc.nurseId] || doc.nurseId}`,
            });
        }
        DocumentDB.getAll().then(setDocuments);
        setSelectedDoc(null);
    };

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard icon={<FileCheck className="w-5 h-5 text-blue-600" />} label="Total Scans" value={documents.length} color="bg-blue-50" />
                <StatsCard icon={<CheckCircle className="w-5 h-5 text-emerald-600" />} label="Genuine" value={genuineCount} color="bg-emerald-50" />
                <StatsCard icon={<AlertTriangle className="w-5 h-5 text-red-600" />} label="Suspected Forgery" value={forgeryCount} color="bg-red-50" />
                <StatsCard icon={<Shield className="w-5 h-5 text-purple-600" />} label="AI Accuracy" value={`${accuracy}%`} color="bg-purple-50" />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto">
                {(['all', 'genuine', 'forgery', 'pending'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap',
                            filter === f ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}>
                        {f === 'all' ? `All (${documents.length})` :
                            f === 'genuine' ? `✅ Genuine (${genuineCount})` :
                                f === 'forgery' ? `🔴 Forgery (${forgeryCount})` :
                                    `⏳ Pending (${pendingCount})`}
                    </button>
                ))}
            </div>

            {/* Document List */}
            {filtered.length === 0 ? (
                <EmptyState icon={<FileCheck className="w-8 h-8 text-gray-400" />} title="No documents" description="No documents match this filter." />
            ) : (
                <div className="space-y-3">
                    {filtered.map(doc => {
                        const result = doc.aiAnalysis?.result;
                        const confidence = doc.aiAnalysis?.confidenceScore;

                        return (
                            <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={cn(
                                            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                                            result === 'genuine' ? 'bg-emerald-100' :
                                                result === 'suspected_forgery' ? 'bg-red-100' : 'bg-gray-100'
                                        )}>
                                            {result === 'genuine' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> :
                                                result === 'suspected_forgery' ? <XCircle className="w-5 h-5 text-red-600" /> :
                                                    <FileCheck className="w-5 h-5 text-gray-400" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</p>
                                            <p className="text-xs text-gray-500">
                                                {nurseNames[doc.nurseId] || 'Unknown'} · {doc.documentType} · {new Date(doc.uploadedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {confidence !== undefined && (
                                            <span className={cn(
                                                'text-xs font-bold px-2 py-1 rounded-lg',
                                                confidence >= 0.8 ? 'bg-emerald-50 text-emerald-700' :
                                                    confidence >= 0.5 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                                            )}>
                                                {Math.round(confidence * 100)}%
                                            </span>
                                        )}
                                        <Badge variant={
                                            result === 'genuine' ? 'success' :
                                                result === 'suspected_forgery' ? 'danger' : 'neutral'
                                        }>
                                            {result === 'genuine' ? 'Genuine' :
                                                result === 'suspected_forgery' ? 'Forgery' : 'Pending'}
                                        </Badge>

                                        <Button size="sm" variant="ghost" 
                                            onClick={async () => {
                                                const full = await DocumentDB.getById(doc.id);
                                                if (full) setSelectedDoc(full);
                                                else setSelectedDoc(doc);
                                            }}>
                                            <Eye className="w-4 h-4" /> Review
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Document Detail Modal (Full Forensic View for Admin) */}
            {selectedDoc && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-center items-start overflow-y-auto p-4 md:p-8" onClick={() => setSelectedDoc(null)}>
                    <div className="max-w-2xl w-full bg-white rounded-2xl p-6 my-auto space-y-6 shadow-2xl relative" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">Forensic Investigation</h3>
                            <button onClick={() => setSelectedDoc(null)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Summary Header */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gray-50 rounded-xl p-3">
                                <p className="text-xs text-gray-500 uppercase font-bold">Document Type</p>
                                <p className="text-sm font-semibold">{selectedDoc.documentType}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                                <p className="text-xs text-gray-500 uppercase font-bold">Nurse Name</p>
                                <p className="text-sm font-semibold">{nurseNames[selectedDoc.nurseId] || 'Unknown'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                                <p className="text-xs text-gray-500 uppercase font-bold">AI Trust Score</p>
                                <p className={cn('text-sm font-black', selectedDoc.aiAnalysis?.result === 'genuine' ? 'text-emerald-600' : 'text-red-600')}>
                                    {Math.round((selectedDoc.aiAnalysis?.confidenceScore || 0) * 100)}%
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left: Image Preview */}
                            <div className="space-y-3">
                                <p className="text-sm font-bold text-gray-700 underline decoration-indigo-200">Document Scan</p>
                                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white cursor-zoom-in group shadow-inner"
                                     onClick={() => setViewerOpen(true)}>
                                    <img 
                                        src={selectedDoc.fileData} 
                                        alt="Document" 
                                        className="w-full h-auto max-h-[500px] object-contain transition-transform duration-500 group-hover:scale-[1.02]" 
                                    />
                                </div>
                                <p className="text-xs text-gray-400 text-center">Click image to enlarge</p>
                            </div>

                            {/* Right: Technical Metrics */}
                            <div className="space-y-4">
                                <p className="text-sm font-bold text-gray-700 underline decoration-indigo-200">Forensic Metrics</p>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Edge Consistency', value: selectedDoc.aiAnalysis?.edgeConsistency || 0 },
                                        { label: 'Texture Analysis', value: selectedDoc.aiAnalysis?.textureAnalysis || 0 },
                                        { label: 'Compression Purity', value: selectedDoc.aiAnalysis?.compressionArtifacts || 0 },
                                        { label: 'Font Authenticity', value: selectedDoc.aiAnalysis?.fontConsistency || 0 },
                                    ].map(m => (
                                        <div key={m.label} className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span>{m.label}</span>
                                                <span className="font-bold">{Math.round(m.value * 100)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div className={cn('h-full transition-all', m.value >= 0.7 ? 'bg-emerald-500' : 'bg-red-500')} 
                                                     style={{ width: `${m.value * 100}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Anomalies and OCR */}
                        <div className="space-y-4">
                             {selectedDoc.aiAnalysis?.anomalies && selectedDoc.aiAnalysis.anomalies.length > 0 && (
                                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                                    <h4 className="text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> Detected Red Flags
                                    </h4>
                                    <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                                        {selectedDoc.aiAnalysis.anomalies.map((a, i) => <li key={i}>{a}</li>)}
                                    </ul>
                                </div>
                             )}

                            <div className="bg-gray-50 rounded-xl p-4">
                                <h4 className="text-sm font-bold text-gray-900 mb-2">OCR Data Extraction</h4>
                                <p className="text-xs text-gray-600 font-mono leading-relaxed bg-white p-3 rounded-lg border border-gray-100 max-h-32 overflow-y-auto">
                                    {selectedDoc.aiAnalysis?.extractedText || 'No text extracted.'}
                                </p>
                            </div>
                        </div>

                        {/* Admin Action Bar */}
                        <div className="flex gap-2 pt-4 border-t border-gray-100">
                            <Button variant="success" className="flex-1"
                                onClick={() => overrideAI(selectedDoc, 'genuine')}>
                                <CheckCircle className="w-4 h-4 mr-2" /> Approve as Genuine
                            </Button>
                            <Button variant="danger" className="flex-1"
                                onClick={() => overrideAI(selectedDoc, 'suspected_forgery')}>
                                <XCircle className="w-4 h-4 mr-2" /> Mark as Forgery
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <ImageViewerModal 
                isOpen={viewerOpen} 
                onClose={() => setViewerOpen(false)} 
                src={selectedDoc?.fileData || ''} 
                alt="Document Preview" 
            />
        </div>
    );
}
