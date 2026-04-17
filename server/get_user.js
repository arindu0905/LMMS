const supabase = require('./config/supabaseClient');

async function getValidUser() {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (!error && data && data.length > 0) {
        console.log("Valid user ID:", data[0].id);
    } else {
        console.log("No valid profiles found.");
    }
    process.exit(0);
}

getValidUser();
