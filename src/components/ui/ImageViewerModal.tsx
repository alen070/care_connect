/**
 * ============================================
 * IMAGE VIEWER MODAL — CareConnect
 * ============================================
 * Full-screen image preview with zoom support.
 * Features: dark overlay, zoom in/out, close via Escape/click/button.
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    src: string;
    alt?: string;
}

export function ImageViewerModal({ isOpen, onClose, src, alt = 'Image preview' }: ImageViewerModalProps) {
    const [zoom, setZoom] = useState(1);

    const resetZoom = useCallback(() => setZoom(1), []);

    const handleZoomIn = useCallback(() => {
        setZoom(z => Math.min(z + 0.5, 3));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom(z => Math.max(z - 0.5, 0.5));
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === '+' || e.key === '=') handleZoomIn();
            if (e.key === '-') handleZoomOut();
            if (e.key === '0') resetZoom();
        };

        window.addEventListener('keydown', handleKeyDown);
        // Prevent body scroll while modal is open
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose, handleZoomIn, handleZoomOut, resetZoom]);

    // Reset zoom when a new image is opened
    useEffect(() => {
        if (isOpen) setZoom(1);
    }, [isOpen, src]);

    if (!isOpen || !src) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Dark overlay */}
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Toolbar */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <button
                    onClick={handleZoomOut}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="Zoom out (−)"
                >
                    <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-white/80 text-sm font-medium min-w-[3rem] text-center">
                    {Math.round(zoom * 100)}%
                </span>
                <button
                    onClick={handleZoomIn}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="Zoom in (+)"
                >
                    <ZoomIn className="w-5 h-5" />
                </button>
                <button
                    onClick={resetZoom}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="Reset zoom (0)"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-white/20 mx-1" />
                <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="Close (Esc)"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Image container */}
            <div className="relative z-[1] max-w-[90vw] max-h-[90vh] overflow-auto">
                <img
                    src={src}
                    alt={alt}
                    className="block transition-transform duration-200 ease-out rounded-lg"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                    draggable={false}
                />
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
