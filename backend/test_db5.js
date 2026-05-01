require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: hist } = await supabase.from('game_history').select('*').limit(1);
  const gameId = hist[0].id;
  
  const record = {
    game_id: gameId,
    user_id: '5d2a8366-da4f-4fbf-b3e2-f5d28c8d5681',
    total_score: 1000,
    final_rank: 1,
    total_dhappas: 0,
    false_dhappas: 0,
    successful_challenges: 0,
    fastest_slap_ms: null
  };

  const { error: playersError } = await supabase.from('game_players').insert([record]);
  console.log("Insert player test:", playersError);
}
check();
