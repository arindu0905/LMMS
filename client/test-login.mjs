import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '.env');
const env = fs.readFileSync(envPath, 'utf-8');
const matchUrl = env.match(/VITE_SUPABASE_URL=(.*)/);
const matchAnon = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
const supabase = createClient(matchUrl[1].trim(), matchAnon[1].trim());

async function test() {
    const email = 'testuser_' + Date.now() + '@example.com';
    console.log('Testing SignUp for:', email);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password: 'password123' });
    console.log('SignUp Data:', signUpData?.user?.id);
    console.log('SignUp Error:', signUpError);

    if (signUpData?.user) {
        console.log('Testing SignIn for:', email);
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password: 'password123' });
        console.log('SignIn Session:', !!signInData?.session);
        console.log('SignIn Error:', signInError);

        if (signInData?.user) {
            console.log('Testing profile fetch...');
            const { data: profile, error: profErr } = await supabase.from('profiles').select('*').eq('id', signInData.user.id).single();
            console.log('Profile:', profile);
            console.log('Profile Error:', profErr);
        }
    }
}
test().catch(console.error);
