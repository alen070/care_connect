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
        DocumentDB.getAll().then(async docs => {
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
            setNurseNames(names);
        });
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

                                        <Button size="sm" variant="ghost" onClick={() => setSelectedDoc(doc)}>
                                            <Eye className="w-4 h-4" /> Review
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Document Detail Modal */}
            {selectedDoc && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDoc(null)}>
                    <div className="max-w-lg w-full bg-white rounded-2xl p-6 space-y-4 shadow-xl" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-gray-900">Document Review</h3>

                        <div className="space-y-2 text-sm">
                            <p><span className="text-gray-500">File:</span> <span className="font-medium">{selectedDoc.fileName}</span></p>
                            <p><span className="text-gray-500">Nurse:</span> <span className="font-medium">{nurseNames[selectedDoc.nurseId]}</span></p>
                            <p><span className="text-gray-500">Type:</span> <Badge variant="info">{selectedDoc.documentType}</Badge></p>
                            <p><span className="text-gray-500">AI Result:</span>{' '}
                                <Badge variant={selectedDoc.aiAnalysis?.result === 'genuine' ? 'success' : selectedDoc.aiAnalysis?.result === 'suspected_forgery' ? 'danger' : 'neutral'}>
                                    {selectedDoc.aiAnalysis?.result || 'Pending'}
                                </Badge>
                            </p>
                            {selectedDoc.aiAnalysis?.confidenceScore !== undefined && (
                                <p><span className="text-gray-500">Confidence:</span> <span className="font-bold">{Math.round(selectedDoc.aiAnalysis.confidenceScore * 100)}%</span></p>
                            )}
                        </div>

                        {/* Document Preview */}
                        {selectedDoc.fileData && (
                            <div 
                                className="border rounded-xl overflow-hidden max-h-48 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setViewerOpen(true)}
                            >
                                <img src={selectedDoc.fileData} alt="Document" className="w-full h-48 object-contain bg-gray-50" />
                            </div>
                        )}

                        {/* Override Actions */}
                        <div className="flex gap-2 pt-2 border-t border-gray-100">
                            <Button variant="success" size="sm" className="flex-1"
                                onClick={() => overrideAI(selectedDoc, 'genuine')}>
                                <CheckCircle className="w-4 h-4" /> Mark Genuine
                            </Button>
                            <Button variant="danger" size="sm" className="flex-1"
                                onClick={() => overrideAI(selectedDoc, 'suspected_forgery')}>
                                <XCircle className="w-4 h-4" /> Mark Forgery
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedDoc(null)}>Close</Button>
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
