/**
 * ============================================
 * SUPABASE EDGE FUNCTION — verify-certificate
 * ============================================
 * Deno runtime. Called by the frontend after a
 * nurse uploads a certificate to Storage.
 *
 * Flow:
 *   1. Receive { certificateUrl, nurseId }
 *   2. Download image bytes
 *   3. Call Roboflow Detection model (signature-detection-hlx8j/3)
 *   4. Crop best bbox using OffscreenCanvas (Web API)
 *   5. Call Roboflow Classifier model (signature-comparator/1)
 *   6. Upload cropped signature to Supabase Storage
 *   7. Write result row to nurse_certificate_reviews
 *   8. Return result to frontend
 *
 * Required env secrets (set in Supabase Dashboard → Edge Functions → Secrets):
 *   ROBOFLOW_API_KEY   — your Roboflow API key
 *   SUPABASE_URL       — auto-injected by Supabase
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';
import { Image } from 'https://deno.land/x/imagescript@1.2.15/mod.ts';

const DETECTION_URL =
  'https://serverless.roboflow.com/signature-detection-hlx8j/3';
const CLASSIFIER_URL =
  'https://serverless.roboflow.com/signature-comparator/1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── Auth check ──────────────────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Parse request ───────────────────────────────────────────────────────
    const { certificateUrl, nurseId } = await req.json();
    if (!certificateUrl || !nurseId) {
      return new Response(JSON.stringify({ error: 'Missing certificateUrl or nurseId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ROBOFLOW_API_KEY = Deno.env.get('ROBOFLOW_API_KEY');
    if (!ROBOFLOW_API_KEY) {
      console.error('ROBOFLOW_API_KEY secret is not set.');
      return new Response(JSON.stringify({ error: 'Server configuration error: missing API key.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Step 1: Download the certificate image ──────────────────────────────
    console.log(`[verify-certificate] Downloading image: ${certificateUrl}`);
    const imageRes = await fetch(certificateUrl);
    if (!imageRes.ok) {
      throw new Error(`Failed to download certificate: ${imageRes.statusText}`);
    }
    const imageBuffer = await imageRes.arrayBuffer();
    const base64Image = encodeBase64(imageBuffer);

    // ── Step 2: Call Detection model ────────────────────────────────────────
    console.log('[verify-certificate] Calling detection model...');
    const detectionRes = await fetch(`${DETECTION_URL}?api_key=${ROBOFLOW_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `image=${encodeURIComponent(base64Image)}`,
    });
    const detectionData = await detectionRes.json();
    console.log('[verify-certificate] Detection result:', JSON.stringify(detectionData));

    const predictions: any[] = detectionData.predictions || [];

    // ── Case A: No signature detected ───────────────────────────────────────
    if (predictions.length === 0) {
      console.log('[verify-certificate] No signature detected.');
      const { data: review, error: insertErr } = await supabase
        .from('nurse_certificate_reviews')
        .insert({
          nurse_id: nurseId,
          certificate_url: certificateUrl,
          detection_found: false,
          admin_status: 'verification_pending',
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      return new Response(JSON.stringify({
        success: true,
        detection_found: false,
        admin_status: 'verification_pending',
        review_id: review.id,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Case B: Signature detected — pick best bbox ─────────────────────────
    const best = predictions.sort((a: any, b: any) => b.confidence - a.confidence)[0];
    const detectionConfidence: number = best.confidence;

    // Roboflow returns center-x, center-y, width, height
    const bboxX = Math.max(0, Math.round(best.x - best.width / 2));
    const bboxY = Math.max(0, Math.round(best.y - best.height / 2));
    const bboxW = Math.round(best.width);
    const bboxH = Math.round(best.height);

    // ── Step 3: Crop the detected bbox using ImageScript ────────────────
    console.log(`[verify-certificate] Cropping bbox: x=${bboxX} y=${bboxY} w=${bboxW} h=${bboxH}`);
    const image = await Image.decode(imageBuffer);

    const cropW = Math.min(bboxW, image.width - bboxX);
    const cropH = Math.min(bboxH, image.height - bboxY);

    const croppedImage = image.crop(bboxX, bboxY, cropW, cropH);
    const croppedBuffer = await croppedImage.encode(); // encodes to PNG by default
    const croppedBase64 = encodeBase64(croppedBuffer);

    // ── Step 4: Call Classifier model on cropped signature ──────────────────
    console.log('[verify-certificate] Calling classifier model...');
    const classifierRes = await fetch(`${CLASSIFIER_URL}?api_key=${ROBOFLOW_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `image=${encodeURIComponent(croppedBase64)}`,
    });
    const classifierData = await classifierRes.json();
    console.log('[verify-certificate] Classifier result:', JSON.stringify(classifierData));

    const topPred = (classifierData.predictions || [])[0] || null;
    const classifierLabel: string | null = topPred?.class || null;
    const classifierConfidence: number | null = topPred?.confidence || null;

    // ── Step 5: Upload cropped signature to Supabase Storage ────────────────
    const timestamp = Date.now();
    const croppedPath = `cropped-signatures/${nurseId}_${timestamp}.png`;

    const { error: storageErr } = await supabase.storage
      .from('careconnect-images')
      .upload(croppedPath, croppedBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (storageErr) {
      console.error('[verify-certificate] Storage upload failed:', storageErr);
    }

    const { data: urlData } = supabase.storage
      .from('careconnect-images')
      .getPublicUrl(croppedPath);
    const croppedSignatureUrl = urlData?.publicUrl || null;

    // ── Step 6: Write result to Supabase DB ─────────────────────────────────
    const { data: review, error: insertErr } = await supabase
      .from('nurse_certificate_reviews')
      .insert({
        nurse_id: nurseId,
        certificate_url: certificateUrl,
        cropped_signature_url: croppedSignatureUrl,
        detection_found: true,
        detection_confidence: detectionConfidence,
        classifier_label: classifierLabel,
        classifier_confidence: classifierConfidence,
        admin_status: 'verification_pending',
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    console.log('[verify-certificate] Done. Review ID:', review.id);

    return new Response(JSON.stringify({
      success: true,
      detection_found: true,
      detection_confidence: detectionConfidence,
      classifier_label: classifierLabel,
      classifier_confidence: classifierConfidence,
      cropped_signature_url: croppedSignatureUrl,
      admin_status: 'verification_pending',
      review_id: review.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('[verify-certificate] Unexpected error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
