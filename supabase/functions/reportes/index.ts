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

        // Solo admin debería poder consultar esto (validación en BD o verificado aquí)
        // Para simplificar, asumimos que el JWT enviado tiene rol 'admin', de lo contrario RLS bloqueará consultas
        // o podemos verificarlo aquí en el token.

        // GET /reportes/resumen-diario
        if (req.method === 'GET' && pathParts.includes('resumen-diario')) {
            const fecha = url.searchParams.get('fecha') || new Date().toISOString().split('T')[0];

            const startOfDay = new Date(fecha);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(fecha);
            endOfDay.setHours(23, 59, 59, 999);

            const { data: ventasDb, error } = await supabase
                .from('ventas')
                .select(`
          total, vendedor_id, metodo_pago,
          venta_detalles ( producto_id, cantidad ),
          vendedores(nombre)
        `)
                .eq('estado', 'completada')
                .gte('created_at', startOfDay.toISOString())
                .lte('created_at', endOfDay.toISOString());

            if (error) throw error;

            // Procesar resumen
            let totalVentasDia = 0;
            const ventasPorVendedor: Record<string, number> = {};
            const ventasPorMetodo: Record<string, number> = {};
            const productosVendidos: Record<string, number> = {};

            ventasDb.forEach(venta => {
                totalVentasDia += venta.total;

                const vendedorName = venta.vendedores?.nombre || venta.vendedor_id;
                const metodo = venta.metodo_pago || 'otro';

                ventasPorVendedor[vendedorName] = (ventasPorVendedor[vendedorName] || 0) + venta.total;
                ventasPorMetodo[metodo] = (ventasPorMetodo[metodo] || 0) + venta.total;

                venta.venta_detalles.forEach((det: any) => {
                    productosVendidos[det.producto_id] = (productosVendidos[det.producto_id] || 0) + det.cantidad;
                });
            });

            // Ordenar productos más vendidos (top 5 IDs)
            const topProductosIds = Object.entries(productosVendidos)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            // Obtener nombres de top productos
            let topProductosCompletos = [];
            if (topProductosIds.length > 0) {
                const { data: prods } = await supabase
                    .from('productos')
                    .select('id, nombre, codigo')
                    .in('id', topProductosIds.map(p => p[0]));

                topProductosCompletos = topProductosIds.map(([id, qty]) => {
                    const p = prods?.find(prod => prod.id === id);
                    return { id, nombre: p?.nombre, codigo: p?.codigo, cantidad: qty };
                });
            }

            const resumen = {
                fecha,
                total_dia: totalVentasDia,
                por_vendedor: ventasPorVendedor,
                por_metodo: ventasPorMetodo,
                top_productos: topProductosCompletos
            };

            return new Response(JSON.stringify({ success: true, resumen }), {
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
