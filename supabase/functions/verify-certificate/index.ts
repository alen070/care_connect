import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { nurseId, certificateUrl } = await req.json()
    const ROBOFLOW_API_KEY = Deno.env.get('ROBOFLOW_API_KEY')
    
    if (!ROBOFLOW_API_KEY) throw new Error('Missing Roboflow API Key')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Original basic Roboflow call (single model)
    const res = await fetch(`https://serverless.roboflow.com/signature-detection-hlx8j/3?api_key=${ROBOFLOW_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: await (await fetch(certificateUrl)).blob()
    })
    
    const data = await res.json()
    const found = (data.predictions || []).length > 0

    await supabase.from('nurse_certificate_reviews').insert({
      nurse_id: nurseId,
      certificate_url: certificateUrl,
      detection_found: found,
      admin_status: 'verification_pending'
    })

    return new Response(JSON.stringify({ success: true, detection: found }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
