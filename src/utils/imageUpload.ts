/**
 * ============================================
 * IMAGE UPLOAD UTILITY — CareConnect
 * ============================================
 * Handles validation, compression, resize, and
 * upload to Supabase Storage. Returns a public URL
 * for storage in the database.
 */

import { supabase } from '@/lib/supabase';

/* ─── Constants ─── */

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const PROFILE_SIZE = 512;        // 512×512 square
const REPORT_MAX_WIDTH = 1280;   // max width, aspect preserved
const COMPRESSION_QUALITY = 0.75;

const BUCKET = 'careconnect-images';

/* ─── Types ─── */

export type ImageCategory = 'profile' | 'report';

export interface UploadResult {
    success: boolean;
    url?: string;
    error?: string;
}

/* ─── Validation ─── */

export function validateImageFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
        return 'Only JPG, PNG, and WEBP files are allowed.';
    }
    if (file.size > MAX_FILE_SIZE) {
        return 'File must be under 5 MB.';
    }
    return null; // valid
}

/* ─── Resize & Compress (client-side, canvas-based) ─── */

function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image.'));
        };
        img.src = url;
    });
}

function compressImage(
    img: HTMLImageElement,
    category: ImageCategory,
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (category === 'profile') {
            // Square crop: take center square, then resize to 512×512
            const side = Math.min(width, height);
            const sx = (width - side) / 2;
            const sy = (height - side) / 2;

            canvas.width = PROFILE_SIZE;
            canvas.height = PROFILE_SIZE;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas not supported.'));
            ctx.drawImage(img, sx, sy, side, side, 0, 0, PROFILE_SIZE, PROFILE_SIZE);
        } else {
            // Report: scale down if wider than REPORT_MAX_WIDTH, preserve aspect ratio
            if (width > REPORT_MAX_WIDTH) {
                height = Math.round(height * (REPORT_MAX_WIDTH / width));
                width = REPORT_MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas not supported.'));
            ctx.drawImage(img, 0, 0, width, height);
        }

        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Image compression failed.'));
            },
            'image/jpeg',
            COMPRESSION_QUALITY,
        );
    });
}

/* ─── Upload to Supabase Storage ─── */

export async function uploadImage(
    category: ImageCategory,
    file: File,
    userId?: string,
): Promise<UploadResult> {
    // 1. Validate
    const validationError = validateImageFile(file);
    if (validationError) {
        return { success: false, error: validationError };
    }

    try {
        // 2. Load, resize & compress
        const img = await loadImage(file);
        const blob = await compressImage(img, category);

        // 3. Build storage path
        const timestamp = Date.now();
        const folder = category === 'profile' ? 'profiles' : 'reports';
        const fileName = category === 'profile'
            ? `${folder}/${userId || 'unknown'}_${timestamp}.jpg`
            : `${folder}/report_${timestamp}.jpg`;

        // 4. Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(fileName, blob, {
                contentType: 'image/jpeg',
                upsert: true,
            });

        if (uploadError) {
            console.error('Supabase Storage upload error:', uploadError);
            return { success: false, error: 'Upload failed. Please try again.' };
        }

        // 5. Get public URL
        const { data: urlData } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(fileName);

        return { success: true, url: urlData.publicUrl };
    } catch (err) {
        console.error('Image upload error:', err);
        return { success: false, error: 'Failed to process image. Please try again.' };
    }
}
