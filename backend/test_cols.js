require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function check() {
  const { data, error } = await supabase.rpc('get_columns', { table_name: 'game_players' });
  console.log('Columns error:', error);
  if (error) {
     // alternative way to get columns without rpc
     const { data: cols, error: e2 } = await supabase.from('game_players').select('*').limit(1);
     console.log('Keys:', cols && cols.length > 0 ? Object.keys(cols[0]) : 'no rows to infer');
  }
}
check();
