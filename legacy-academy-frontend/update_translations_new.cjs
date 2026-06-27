const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const newKeys = {
    CAT_ELITE: "Elite",
    CAT_ELITE_DESC: "Missions designed for the top 1%. Networking, advanced strategies, and wealth creation.",
    MISSION_ELITE_AUDIT: "Financial Audit",
    MISSION_ELITE_AUDIT_DESC: "Track every cent you spent today. Optimize for maximum return on investment.",
    MISSION_ELITE_NETWORK: "High-Value Outreach",
    MISSION_ELITE_NETWORK_DESC: "Send 3 personalized messages to people operating at a higher level than you.",
    MISSION_ELITE_INVEST: "Asset Allocation",
    MISSION_ELITE_INVEST_DESC: "Dedicate time to researching or acquiring an asset that compounds in value.",
    MISSION_SURV_HUNT: "Provide",
    MISSION_SURV_HUNT_DESC: "Hunt or forage. Provide for your tribe.",
    MISSION_MIND_JOURNAL: "Deep Journaling",
    MISSION_MIND_JOURNAL_DESC: "Write down your thoughts, fears, and ultimate goals. Clarify the path.",
    MISSION_COMBAT_ENDURANCE: "Blood & Sweat",
    MISSION_COMBAT_ENDURANCE_DESC: "Push your body until you want to quit, then do 10 more."
};

files.forEach(file => {
  const data = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf8'));
  
  // Merge
  for (const [key, val] of Object.entries(newKeys)) {
    if (!data[key]) {
      data[key] = val; // fallback to English for all
    }
  }
  
  fs.writeFileSync(path.join(localesDir, file), JSON.stringify(data, null, 2));
  console.log('Updated ' + file);
});
