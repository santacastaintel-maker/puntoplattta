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
        const codigo = pathParts.length > 1 ? pathParts[1] : null;

        if (req.method === 'GET') {
            if (codigo) {
                // GET /productos/:codigo
                const { data, error } = await supabase
                    .from('productos')
                    .select(`*, categorias(nombre)`)
                    .eq('codigo', codigo)
                    .eq('activo', true)
                    .single();

                if (error || !data) throw error || new Error('Producto no encontrado');

                return new Response(JSON.stringify({ success: true, data }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            } else {
                // GET /productos
                const busqueda = url.searchParams.get('busqueda');
                const categoria_id = url.searchParams.get('categoria_id');
                const stock_minimo = url.searchParams.get('stock_minimo');

                let query = supabase.from('productos').select(`*, categorias(nombre)`).eq('activo', true);

                if (busqueda) {
                    query = query.or(`codigo.ilike.%${busqueda}%,nombre.ilike.%${busqueda}%`);
                }
                if (categoria_id) {
                    query = query.eq('categoria_id', categoria_id);
                }
                if (stock_minimo) {
                    query = query.gte('stock', parseInt(stock_minimo));
                }

                query = query.order('nombre', { ascending: true });

                const { data, error } = await query;
                if (error) throw error;

                return new Response(JSON.stringify({ success: true, data }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
