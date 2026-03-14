import Dexie, { Table } from 'dexie';
import { Vendedor, Categoria, Producto, Cliente, SesionLive, Venta, VentaDetalle } from '../types';

export class PuntoPlataDB extends Dexie {
    vendedores!: Table<Vendedor, string>;
    categorias!: Table<Categoria, string>;
    productos!: Table<Producto, string>;
    clientes!: Table<Cliente, string>;
    sesiones_live!: Table<SesionLive, string>;
    ventas!: Table<Venta, string>;
    venta_detalles!: Table<VentaDetalle, string>;

    constructor() {
        super('PuntoPlataDB');
        this.version(1).stores({
            vendedores: 'id, rol, nombre',
            categorias: 'id, nombre, orden_visual',
            productos: 'id, codigo, nombre, categoria_id, activo',
            clientes: 'id, nombre, telefono',
            sesiones_live: 'id, activa',
            ventas: 'id, folio, fecha',
            venta_detalles: 'id, venta_id, producto_id'
        });

        // v2: Add indexes for estado (apartados) and cliente fields
        this.version(2).stores({
            vendedores: 'id, rol, nombre',
            categorias: 'id, nombre, orden_visual',
            productos: 'id, codigo, nombre, categoria_id, activo',
            clientes: 'id, nombre, telefono, apartados_pendientes',
            sesiones_live: 'id, activa',
            ventas: 'id, folio, fecha, estado, cliente_id, vendedor_id',
            venta_detalles: 'id, venta_id, producto_id'
        }).upgrade(tx => {
            // Add default values for new client fields
            return tx.table('clientes').toCollection().modify(cliente => {
                if (cliente.apartados_pendientes === undefined) cliente.apartados_pendientes = 0;
                if (cliente.cancelaciones === undefined) cliente.cancelaciones = 0;
            });
        });
    }
}

export const db = new PuntoPlataDB();

// Poblar datos iniciales si la DB está vacía
db.on('populate', async () => {
    await db.vendedores.add({
        id: 'admin-id-123',
        nombre: 'Dueño',
        email: null,
        color_identificador: '#10B981',
        rol: 'admin',
        activo: true,
        // En IndexedDB guardaremos el PIN directamente o un hash simple. 
        // Para simplificar, añadimos un campo pin_auth aquí
        pin_auth: '9999' as any
    });

    await db.vendedores.add({
        id: 'vendedor-id-456',
        nombre: 'Vendedor Estándar',
        email: null,
        color_identificador: '#3B82F6',
        rol: 'vendedor',
        activo: true,
        pin_auth: null as any
    });

    const initialCats = [
        { id: 'cat-1', nombre: 'Anillos', orden_visual: 1 },
        { id: 'cat-2', nombre: 'Collares', orden_visual: 2 },
        { id: 'cat-3', nombre: 'Pulseras', orden_visual: 3 },
        { id: 'cat-4', nombre: 'Aretes', orden_visual: 4 },
        { id: 'cat-5', nombre: 'Sets', orden_visual: 5 },
        { id: 'cat-6', nombre: 'Charms', orden_visual: 6 },
        { id: 'cat-7', nombre: 'Esclavas', orden_visual: 7 },
        { id: 'cat-8', nombre: 'Cadenas', orden_visual: 8 },
        { id: 'cat-9', nombre: 'Dijes', orden_visual: 9 },
        { id: 'cat-10', nombre: 'Gargantillas', orden_visual: 10 },
    ];

    for (const cat of initialCats) {
        await db.categorias.add({ ...cat, descripcion: null });
    }
});
