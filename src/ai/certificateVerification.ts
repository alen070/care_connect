/**
 * ============================================
 * CERTIFICATE VERIFICATION SERVICE — Frontend
 * ============================================
 * Handles the full certificate upload + verification flow:
 *   1. Upload image to Supabase Storage (certificates/ folder)
 *   2. Call Edge Function 'verify-certificate' with the public URL
 *   3. Return the CertificateReview result
 *
 * The Roboflow API key NEVER touches the browser —
 * all model calls happen inside the Edge Function.
 */

import { supabase } from '@/lib/supabase';
import type { CertificateReview } from '@/types';

const BUCKET = 'careconnect-images';

/** Upload a certificate file to Supabase Storage and return its public URL */
async function uploadCertificateToStorage(file: File, nurseId: string): Promise<string> {
  const timestamp = Date.now();
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `certificates/${nurseId}_${timestamp}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export interface CertificateVerificationResult {
  success: boolean;
  review?: CertificateReview;
  error?: string;
}

/**
 * Main entry point — call this when a nurse uploads a certificate.
 * Uploads image, then calls the Edge Function to run the Roboflow pipeline.
 */
export async function verifyCertificate(
  file: File,
  nurseId: string
): Promise<CertificateVerificationResult> {
  try {
    // 1. Upload to storage
    const certificateUrl = await uploadCertificateToStorage(file, nurseId);

    // 2. Call the Edge Function (carries nurse JWT automatically)
    const { data, error } = await supabase.functions.invoke('verify-certificate', {
      body: { certificateUrl, nurseId },
    });

    if (error) {
      console.error('[certificateVerification] Edge function error:', error);
      return { success: false, error: error.message || 'Verification service unavailable.' };
    }

    if (!data?.success) {
      return { success: false, error: data?.error || 'Verification failed.' };
    }

    // 3. Map response to CertificateReview shape for immediate display
    const review: CertificateReview = {
      id: data.review_id || '',
      nurseId,
      certificateUrl,
      croppedSignatureUrl: data.cropped_signature_url || undefined,
      detectionFound: data.detection_found ?? false,
      detectionConfidence: data.detection_confidence ?? undefined,
      classifierLabel: data.classifier_label ?? undefined,
      classifierConfidence: data.classifier_confidence ?? undefined,
      adminStatus: 'verification_pending',
      createdAt: new Date().toISOString(),
    };

    return { success: true, review };
  } catch (err: any) {
    console.error('[certificateVerification] Unexpected error:', err);
    return { success: false, error: err.message || 'Unexpected error during verification.' };
  }
}
