import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient, getServiceRoleClient } from '../_shared/supabaseClient.ts';

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = getSupabaseClient(req);
        const supabaseAdmin = getServiceRoleClient(); // Para operaciones que requieran by-pass de RLS en la transacción

        const url = new URL(req.url);
        const pathParts = url.pathname.split('/').filter(Boolean);

        // POST /ventas/crear
        if (req.method === 'POST' && pathParts.includes('crear')) {
            const { sesion_id, vendedor_id, cliente_id, subtotal, descuento, total, metodo_pago, notas, detalles } = await req.json();

            if (!vendedor_id || !detalles || !detalles.length) {
                throw new Error('Faltan datos requeridos para la venta (vendedor_id, detalles)');
            }

            // 1. Verificación de stock previa
            for (const item of detalles) {
                const { data: prod, error: prodError } = await supabase
                    .from('productos')
                    .select('stock, precio')
                    .eq('id', item.producto_id)
                    .single();

                if (prodError || !prod) throw new Error(`Producto nulo o no encontrado: ${item.producto_id}`);
                if (prod.stock < item.cantidad) {
                    throw new Error(`Stock insuficiente para producto_id: ${item.producto_id}. Disponible: ${prod.stock}`);
                }
            }

            // 2. Insertar Venta Principal
            // La transacción atómica se maneja asegurando limpieza si hay error.
            // Los triggers de postgres actualizarán los totales, stats y folios automáticamente.
            const { data: venta, error: ventaError } = await supabaseAdmin
                .from('ventas')
                .insert([{
                    sesion_id,
                    vendedor_id,
                    cliente_id,
                    subtotal,
                    descuento,
                    total,
                    metodo_pago,
                    notas,
                    estado: 'completada'
                }])
                .select()
                .single();

            if (ventaError) throw ventaError;

            // 3. Insertar Detalles
            const detallesToInsert = detalles.map((d: any) => ({
                venta_id: venta.id,
                producto_id: d.producto_id,
                cantidad: d.cantidad,
                precio_unitario: d.precio_unitario,
                subtotal: d.subtotal
            }));

            const { error: detallesError } = await supabaseAdmin
                .from('venta_detalles')
                .insert(detallesToInsert);

            // Si falla la inserción de detalles, hacemos rollback manual (eliminar la venta)
            // Los triggers de BD se encargarán de revertir cualquier stock que sí se haya insertado gracias al DELETE CASCADE.
            if (detallesError) {
                await supabaseAdmin.from('ventas').delete().eq('id', venta.id);
                throw new Error(`Error insertando detalles: ${detallesError.message}`);
            }

            // Refrescar venta final
            const { data: ventaFinal } = await supabase.from('ventas').select('*').eq('id', venta.id).single();

            return new Response(JSON.stringify({ success: true, venta: ventaFinal }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // POST /ventas/:id/cancelar
        if (req.method === 'POST' && pathParts.length > 2 && pathParts[2] === 'cancelar') {
            const ventaId = pathParts[1];

            const { data: cancelData, error: cancelError } = await supabaseAdmin
                .from('ventas')
                .update({ estado: 'cancelada', notas: 'Cancelada vía API' })
                .eq('id', ventaId)
                .eq('estado', 'completada') // solo cancelar completadas
                .select()
                .single();

            if (cancelError) throw cancelError;

            return new Response(JSON.stringify({ success: true, venta: cancelData }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // GET /ventas/mis-ventas?vendedor_id=XXX
        if (req.method === 'GET' && pathParts.includes('mis-ventas')) {
            const vendedorId = url.searchParams.get('vendedor_id');
            const sesionId = url.searchParams.get('sesion_id');
            const fechaDesde = url.searchParams.get('fecha_desde');
            const fechaHasta = url.searchParams.get('fecha_hasta');

            if (!vendedorId) throw new Error('Se requiere vendedor_id');

            let query = supabase.from('ventas').select(`
        *,
        clientes(nombre, tipo_cliente)
      `).eq('vendedor_id', vendedorId).order('created_at', { ascending: false });

            if (sesionId) query = query.eq('sesion_id', sesionId);
            if (fechaDesde) query = query.gte('created_at', fechaDesde);
            if (fechaHasta) query = query.lte('created_at', fechaHasta);

            const { data, error } = await query;
            if (error) throw error;

            return new Response(JSON.stringify({ success: true, count: data.length, ventas: data }), {
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
