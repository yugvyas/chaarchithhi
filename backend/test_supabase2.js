require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('profiles').insert([{ id: '11111111-1111-1111-1111-111111111111', username: 'Yug Vyas' }]);
  console.log("Insert duplicate check:", error);
}
test();
