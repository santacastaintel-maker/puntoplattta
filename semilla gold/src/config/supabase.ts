import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
    }
});

// Helper para invocar Edge Functions con el token del vendedor si existe
export const invokeFunction = async <T>(functionName: string, body?: any, token?: string): Promise<T> => {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const { data, error } = await supabase.functions.invoke(functionName, {
        body,
        headers,
    });

    if (error) {
        throw error;
    }

    return data as T;
};
