import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { SignJWT } from 'https://deno.land/x/jose@v4.14.4/index.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getServiceRoleClient } from '../_shared/supabaseClient.ts';

serve(async (req) => {
    // Handle CORS options request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { pin, vendedor_id } = await req.json();

        if (!pin || !vendedor_id) {
            return new Response(
                JSON.stringify({ success: false, error: 'Faltan parámetros requeridos (pin, vendedor_id)' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabase = getServiceRoleClient();

        // Verify vendor and PIN
        const { data: vendedor, error } = await supabase
            .from('vendedores')
            .select('*')
            .eq('id', vendedor_id)
            .eq('pin_auth', pin)
            .eq('activo', true)
            .single();

        if (error || !vendedor) {
            return new Response(
                JSON.stringify({ success: false, error: 'PIN incorrecto o vendedor no activo' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Create JWT
        const secret = new TextEncoder().encode(Deno.env.get('SUPABASE_JWT_SECRET') || '');
        const alg = 'HS256';

        const jwt = await new SignJWT({
            role: vendedor.rol === 'admin' ? 'service_role' : 'authenticated',
            vendedor_id: vendedor.id,
            email: vendedor.email
        })
            .setProtectedHeader({ alg })
            .setIssuedAt()
            .setExpirationTime('24h')
            .setSubject(vendedor.id)
            .sign(secret);

        // Remove sensitive info before returning
        delete vendedor.pin_auth;

        return new Response(
            JSON.stringify({ success: true, vendedor, token: jwt }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error en auth-pin:', error);
        return new Response(
            JSON.stringify({ success: false, error: 'Error interno del servidor' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
