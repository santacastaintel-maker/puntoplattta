import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getServiceRoleClient } from '../_shared/supabaseClient.ts';

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { vendedor_id, pin_actual, pin_nuevo } = await req.json();

        if (!vendedor_id || !pin_actual || !pin_nuevo) {
            return new Response(
                JSON.stringify({ success: false, error: 'Faltan parámetros (vendedor_id, pin_actual, pin_nuevo)' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (pin_nuevo.length !== 4 || !/^\d+$/.test(pin_nuevo)) {
            return new Response(
                JSON.stringify({ success: false, error: 'El nuevo PIN debe ser de 4 dígitos numéricos' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabase = getServiceRoleClient();

        // 1. Verificar PIN actual
        const { data: vendedor, error: fetchError } = await supabase
            .from('vendedores')
            .select('id')
            .eq('id', vendedor_id)
            .eq('pin_auth', pin_actual)
            .single();

        if (fetchError || !vendedor) {
            return new Response(
                JSON.stringify({ success: false, error: 'El PIN actual es incorrecto' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 2. Actualizar al nuevo PIN
        const { error: updateError } = await supabase
            .from('vendedores')
            .update({ pin_auth: pin_nuevo })
            .eq('id', vendedor_id);

        if (updateError) {
            throw updateError;
        }

        return new Response(
            JSON.stringify({ success: true, message: 'PIN actualizado correctamente' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error en change-pin:', error);
        return new Response(
            JSON.stringify({ success: false, error: error.message || 'Error interno del servidor' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
