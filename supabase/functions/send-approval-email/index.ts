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
    const { registration_id } = await req.json();

    if (!registration_id) {
      throw new Error("Missing registration_id");
    }

    if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Obtener la configuración del remitente
    const { data: settingsData } = await supabase
      .from('global_settings')
      .select('sender_name, sender_email')
      .maybeSingle();

    const senderName = settingsData?.sender_name || "WebConfer Eventos";
    const senderEmail = settingsData?.sender_email || "eventos@tudominio.com";
    const fromAddress = `${senderName} <${senderEmail}>`;

    // Obtener los datos del registro y del evento (para sacar el meeting_url)
    const { data: regData, error: regError } = await supabase
      .from('registrations')
      .select(`
        first_name, 
        last_name, 
        email, 
        events (
          title, 
          meeting_url
        )
      `)
      .eq('id', registration_id)
      .single();

    if (regError || !regData) throw new Error("Registro no encontrado");

    const eventTitle = regData.events?.title || "Nuestro Evento";
    const meetingUrl = regData.events?.meeting_url || "";

    let htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #1e3a8a;">¡Felicidades ${regData.first_name}!</h2>
        <p>Nos complace informarte que tu inscripción al evento <strong>${eventTitle}</strong> ha sido <strong>APROBADA</strong>.</p>
        <p>Tu pago ha sido verificado con éxito y tu lugar está reservado.</p>
    `;

    if (meetingUrl) {
      htmlBody += `
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
          <p style="margin-top: 0; font-size: 16px;">Aquí tienes el enlace para unirte a la conferencia:</p>
          <a href="${meetingUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Entrar a la Reunión</a>
          <p style="margin-bottom: 0; margin-top: 15px; font-size: 12px; color: #6b7280;">O copia y pega este enlace: <br/> ${meetingUrl}</p>
        </div>
      `;
    } else {
      htmlBody += `
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <p style="margin: 0;">Los detalles de conexión y la información final se te enviarán pronto. ¡Mantente atento a tu correo!</p>
        </div>
      `;
    }

    htmlBody += `
        <p>Si tienes alguna pregunta, no dudes en contactarnos respondiendo a este correo.</p>
        <p>¡Te esperamos!</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">Este es un correo automático, por favor no respondas directamente a esta dirección si no es necesario.</p>
      </div>
    `;

    // Enviar a Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [regData.email],
        subject: `Inscripción Aprobada: ${eventTitle}`,
        html: htmlBody,
      }),
    });

    const responseData = await res.json();

    if (res.ok) {
      return new Response(JSON.stringify({ success: true, data: responseData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: responseData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
