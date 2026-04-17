import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://jitljrmyzycoulqeloph.supabase.co';
const supabaseKey = 'sb_publishable_gFLzWZduaqarSNq_V-vTPw_bxrbtddH';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const email = 'testcustomer2@example.com';
    const password = 'password123';
    console.log('Attempting signup...');
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: 'Test Customer 2',
            },
        },
    });
    console.log('Signup result data:', JSON.stringify(data, null, 2));
    console.log('Signup result error:', error);
}
test();
