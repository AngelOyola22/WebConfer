import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY"); 

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables.");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 0. Obtener configuración global para el remitente
    const { data: settingsData, error: settingsError } = await supabase
      .from('global_settings')
      .select('sender_name, sender_email')
      .maybeSingle();

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
    }
    
    const senderName = settingsData?.sender_name || "Eventos";
    const senderEmail = settingsData?.sender_email || "eventos@tudominio.com";
    const fromAddress = `${senderName} <${senderEmail}>`;

    // 1. Obtener un lote de correos encolados (hasta 100 por ejecución de batch)
    const { data: logs, error: fetchError } = await supabase
      .from('email_logs')
      .select(`
        id, 
        recipient_email, 
        campaign_id, 
        email_campaigns (subject, body_html),
        event_contacts (first_name, last_name)
      `)
      .eq('status', 'queued')
      .limit(100);

    if (fetchError) throw fetchError;

    if (!logs || logs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No queued emails found." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${logs.length} emails using Resend Batch API...`);

    // 2. Preparar el payload (array de correos) para enviar en bloque
    const emailsPayload = logs.map((log: any) => {
      const campaign = log.email_campaigns;
      const contact = log.event_contacts;

      // Reemplazo de variables personalizadas
      let finalHtml = campaign.body_html || '';
      if (contact) {
        finalHtml = finalHtml.replace(/\{\{nombre\}\}/g, contact.first_name || '');
        finalHtml = finalHtml.replace(/\{\{apellido\}\}/g, contact.last_name || '');
      }

      return {
        from: fromAddress, // Usando la configuración global
        to: [log.recipient_email],
        subject: campaign.subject || "Notificación de Evento",
        html: finalHtml,
      };
    });

    // 3. Enviar todos los correos en UNA sola llamada a la API usando /batch
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailsPayload),
    });

    const responseData = await res.json();
    const logIds = logs.map(l => l.id);

    if (res.ok) {
      // 4. Actualizar estado a 'sent' masivamente
      await supabase
        .from('email_logs')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .in('id', logIds);

      // 5. Actualizar la campaña a 'completed' (asumiendo que se enviaron todos)
      const campaignIds = [...new Set(logs.map((l: any) => l.campaign_id))];
      await supabase
        .from('email_campaigns')
        .update({ status: 'completed' })
        .in('id', campaignIds);

      return new Response(
        JSON.stringify({ message: "Batch processed successfully", count: logIds.length, data: responseData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    } else {
      // Manejar fallo general de la API de Resend
      await supabase
        .from('email_logs')
        .update({ status: 'failed', error_message: JSON.stringify(responseData) })
        .in('id', logIds);

      return new Response(
        JSON.stringify({ message: "Batch processing failed", error: responseData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
