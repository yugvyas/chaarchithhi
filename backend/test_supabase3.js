require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('profiles').insert([{ id: '22222222-2222-2222-2222-222222222222', username: 'Yug Vyas' }]);
  console.log("Insert duplicate check:", error);
  if (!error) {
     await supabase.from('profiles').delete().eq('id', '22222222-2222-2222-2222-222222222222');
  }
}
test();
