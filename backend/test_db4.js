require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: gameData, error: gameError } = await supabase
    .from('game_history')
    .insert({
      room_code: 'TEST',
      total_rounds: 3,
      winner_id: null
    })
    .select()
    .single();

  console.log("Insert test:", gameError);
}
check();
