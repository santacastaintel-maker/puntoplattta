

export const VentaPage = () => {
    return (
        <div className="p-8 flex flex-col items-center justify-center h-full text-slate-500">
            <h2 className="text-2xl font-bold mb-2 text-slate-900">Nueva Venta</h2>
            <p>Aquí irá el módulo de carrito y checkout.</p>
        </div>
    );
};

export const MisVentasPage = () => {
    return (
        <div className="p-8 flex flex-col items-center justify-center h-full text-slate-500">
            <h2 className="text-2xl font-bold mb-2 text-slate-900">Mis Ventas</h2>
            <p>Aquí se listarán las ventas del día y tickets generados.</p>
        </div>
    );
};

export const ClientesPage = () => {
    return (
        <div className="p-8 flex flex-col items-center justify-center h-full text-slate-500">
            <h2 className="text-2xl font-bold mb-2 text-slate-900">Clientes</h2>
            <p>Directorio y CRM básico para registrar clientes y asignar clases (Premium, etc).</p>
        </div>
    );
};

export const AdminPage = () => {
    return (
        <div className="p-8 flex flex-col items-center justify-center h-full text-slate-500">
            <h2 className="text-2xl font-bold mb-2 text-slate-900">Administración</h2>
            <p>Panel para gestionar inventario, usuarios y ver estadísticas de ventas.</p>
        </div>
    );
};
