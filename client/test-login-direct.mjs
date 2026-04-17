import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://jitljrmyzycoulqeloph.supabase.co';
const supabaseKey = 'sb_publishable_gFLzWZduaqarSNq_V-vTPw_bxrbtddH';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'testcustomer@example.com',
        password: 'password123'
    });
    fs.writeFileSync('login-error.json', JSON.stringify({ data, error }, null, 2));
}
test();
