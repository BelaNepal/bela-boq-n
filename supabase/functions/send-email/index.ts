import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import nodemailer from "npm:nodemailer@6.9.1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { to, subject, html, text, attachments } = await req.json()

        const mailUser = Deno.env.get("SUPABASE_MAIL_USER");
        const mailPass = Deno.env.get("SUPABASE_MAIL_PASS");

        if (!mailUser || !mailPass) {
            throw new Error("Missing email credentials in Supabase Secrets (SUPABASE_MAIL_USER, SUPABASE_MAIL_PASS)");
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: mailUser,
                pass: mailPass
            }
        });

        const mailOptions = {
            from: mailUser,
            to,
            subject,
            html: html || text,
            attachments
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.messageId);

        return new Response(JSON.stringify(info), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error("Function error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
