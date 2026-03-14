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

        // POST /clientes/buscar-o-crear
        if (req.method === 'POST' && pathParts.includes('buscar-o-crear')) {
            const { telefono, nombre, email } = await req.json();

            if (!telefono && !nombre) {
                throw new Error('Se requiere teléfono o nombre para buscar');
            }

            // Buscar cliente por telefono exacto o nombre ILIKE
            let query = supabase.from('clientes').select('*');
            if (telefono) {
                query = query.eq('telefono', telefono);
            } else if (nombre) {
                query = query.ilike('nombre', `%${nombre}%`);
            }

            const { data: searchData, error: searchError } = await query.limit(1);

            if (searchError) throw searchError;

            if (searchData && searchData.length > 0) {
                return new Response(JSON.stringify({ success: true, isNew: false, cliente: searchData[0] }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // Si no existe, crearlo
            if (!nombre) throw new Error('Se requiere nombre para crear un nuevo cliente');

            const { data: newCliente, error: createError } = await supabase
                .from('clientes')
                .insert([{ nombre, telefono, email, tipo_cliente: 'normal' }])
                .select()
                .single();

            if (createError) throw createError;

            return new Response(JSON.stringify({ success: true, isNew: true, cliente: newCliente }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // GET /clientes/:id/historial
        if (req.method === 'GET' && pathParts.length > 1 && pathParts[2] === 'historial') {
            const clienteId = pathParts[1];

            const { data: historial, error } = await supabase
                .from('ventas')
                .select(`
          id, folio, subtotal, descuento, total, metodo_pago, estado, created_at,
          venta_detalles (
            cantidad, precio_unitario, subtotal,
            productos ( nombre, codigo )
          )
        `)
                .eq('cliente_id', clienteId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            return new Response(JSON.stringify({ success: true, historial }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response('Method not allowed or not found', { status: 404, headers: corsHeaders });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
