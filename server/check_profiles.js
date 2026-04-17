const supabase = require('./config/supabaseClient');

async function testQuery() {
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    console.log("Profiles:", profiles);
    console.log("Error:", error);
}
testQuery();
