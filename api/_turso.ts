// Cliente de Turso compartido para todas las Vercel Functions
// Usa transporte HTTP — funciona en cualquier entorno serverless
import { createClient } from '@libsql/client/http';

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error('Faltan variables TURSO_DATABASE_URL o TURSO_AUTH_TOKEN');
}

export const turso = createClient({
    url: process.env.TURSO_DATABASE_URL as string,
    authToken: process.env.TURSO_AUTH_TOKEN as string,
});
