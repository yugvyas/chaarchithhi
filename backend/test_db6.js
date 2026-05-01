require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testSave() {
  try {
    const roomCode = 'TEST2';
    const winnerId = '5d2a8366-da4f-4fbf-b3e2-f5d28c8d5681';
    
    // 1. Insert into game_history
    const { data: gameData, error: gameError } = await supabase
      .from('game_history')
      .insert({
        room_code: roomCode,
        total_rounds: 5,
        winner_id: winnerId
      })
      .select()
      .single();

    if (gameError) throw gameError;
    console.log("History inserted:", gameData.id);

    // 2. Prepare game_players
    const playerRecords = [{
      game_id: gameData.id,
      user_id: winnerId,
      total_score: 1000,
      final_rank: 1,
      total_dhappas: 0,
      false_dhappas: 0,
      successful_challenges: 0,
      fastest_slap_ms: null
    }];

    const { error: playersError } = await supabase
      .from('game_players')
      .insert(playerRecords);
      
    if (playersError) throw playersError;
    console.log("Players inserted");
  } catch (error) {
    console.error("ERROR:", error.message || error);
  }
}
testSave();
