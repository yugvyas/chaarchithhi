const RANKS = [
  { title: "Chithhi Beginner", emoji: "📝", min: 0, max: 1099 },
  { title: "Paper Folder", emoji: "📄", min: 1100, max: 1249 },
  { title: "Chithhi Shuffler", emoji: "🔀", min: 1250, max: 1399 },
  { title: "Sharp Passer", emoji: "⚡", min: 1400, max: 1549 },
  { title: "Slap Ready", emoji: "🖐️", min: 1550, max: 1699 },
  { title: "Dhappa Striker", emoji: "👊", min: 1700, max: 1849 },
  { title: "Dhappa Master", emoji: "👋", min: 1850, max: 1999 },
  { title: "Chithhi Champion", emoji: "🏅", min: 2000, max: 2199 },
  { title: "Table King", emoji: "👑", min: 2200, max: 2449 },
  { title: "Chithhi Legend", emoji: "🔥", min: 2450, max: 9999 },
];

function getRank(rating) {
  return RANKS.find(r => rating >= r.min && rating <= r.max) || RANKS[0];
}

module.exports = { RANKS, getRank };
