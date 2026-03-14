import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export const getSupabaseClient = (req: Request) => {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

    // Use the authorization header to maintain the user's session if available
    const authHeader = req.headers.get('Authorization') || '';

    return createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
    });
};

export const getServiceRoleClient = () => {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    return createClient(supabaseUrl, supabaseServiceKey);
};
