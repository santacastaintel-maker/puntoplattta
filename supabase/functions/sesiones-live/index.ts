import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabaseClient.ts';

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = getSupabaseClient(req);
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/').filter(Boolean);

        // POST /sesiones-live/activar
        if (req.method === 'POST' && pathParts.includes('activar')) {
            const { vendedor_id, nombre_sesion, color_sesion } = await req.json();

            if (!vendedor_id) throw new Error('Se requiere vendedor_id');

            // 1. Cerrar sesiones anteriores activas de este vendedor
            await supabase
                .from('sesiones_live')
                .update({ activa: false, fecha_fin: new Date().toISOString() })
                .eq('vendedor_id', vendedor_id)
                .eq('activa', true);

            // 2. Crear nueva sesión
            const { data: nuevaSesion, error } = await supabase
                .from('sesiones_live')
                .insert([{
                    vendedor_id,
                    nombre_sesion: nombre_sesion || 'Sesión Live',
                    color_sesion: color_sesion || null,
                    activa: true
                }])
                .select()
                .single();

            if (error) throw error;

            return new Response(JSON.stringify({ success: true, sesion: nuevaSesion }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response('Ruta no encontrada', { status: 404, headers: corsHeaders });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
