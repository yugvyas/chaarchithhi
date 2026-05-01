require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('game_players').select('*');
  console.log("game_players rows:", data?.length);
  const { data: hist, error: he } = await supabase.from('game_history').select('*');
  console.log("game_history rows:", hist?.length);
}
check();
