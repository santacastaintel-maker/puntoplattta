import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Aplica headers CORS para que el frontend pueda llamar la API */
export const cors = (res: VercelResponse) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

/** Maneja preflight OPTIONS y aplica CORS. Devuelve true si ya respondió */
export const handleCors = (req: VercelRequest, res: VercelResponse): boolean => {
    cors(res);
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return true;
    }
    return false;
};

/** Respuesta de error estandarizada */
export const sendError = (res: VercelResponse, status: number, message: string) => {
    return res.status(status).json({ error: message });
};
