const fs = require('fs');
const path = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/App.jsx';
let code = fs.readFileSync(path, 'utf8');

// 1. More missions
code = code.replace(
    /\{ id: 'gym_cardio', titleKey: 'MISSION_GYM_CARDIO', descKey: 'MISSION_GYM_CARDIO_DESC', icon: '🔥' \}/g,
    `{ id: 'gym_cardio', titleKey: 'MISSION_GYM_CARDIO', descKey: 'MISSION_GYM_CARDIO_DESC', icon: '🔥' },\n                { id: 'gym_core', titleKey: 'MISSION_GYM_CORE', descKey: 'MISSION_GYM_CORE_DESC', icon: '🛡️' },\n                { id: 'gym_endurance', titleKey: 'MISSION_GYM_ENDURANCE', descKey: 'MISSION_GYM_ENDURANCE_DESC', icon: '🏃‍♂️' }`
);
code = code.replace(
    /\{ id: 'adv_explore', titleKey: 'MISSION_ADV_EXPLORE', descKey: 'MISSION_ADV_EXPLORE_DESC', icon: '🌍' \}/g,
    `{ id: 'adv_explore', titleKey: 'MISSION_ADV_EXPLORE', descKey: 'MISSION_ADV_EXPLORE_DESC', icon: '🌍' },\n                { id: 'adv_nature', titleKey: 'MISSION_ADV_NATURE', descKey: 'MISSION_ADV_NATURE_DESC', icon: '🏕️' },\n                { id: 'adv_sea', titleKey: 'MISSION_ADV_SEA', descKey: 'MISSION_ADV_SEA_DESC', icon: '🌊' }`
);
code = code.replace(
    /\{ id: 'surv_cold', titleKey: 'MISSION_SURV_COLD', descKey: 'MISSION_SURV_COLD_DESC', icon: '🧊' \}/g,
    `{ id: 'surv_cold', titleKey: 'MISSION_SURV_COLD', descKey: 'MISSION_SURV_COLD_DESC', icon: '🧊' },\n                { id: 'surv_shelter', titleKey: 'MISSION_SURV_SHELTER', descKey: 'MISSION_SURV_SHELTER_DESC', icon: '⛺' },\n                { id: 'surv_fast', titleKey: 'MISSION_SURV_FAST', descKey: 'MISSION_SURV_FAST_DESC', icon: '⏳' }`
);
code = code.replace(
    /\{ id: 'mind_puzzle', titleKey: 'MISSION_MIND_PUZZLE', descKey: 'MISSION_MIND_PUZZLE_DESC', icon: '🧩' \}/g,
    `{ id: 'mind_puzzle', titleKey: 'MISSION_MIND_PUZZLE', descKey: 'MISSION_MIND_PUZZLE_DESC', icon: '🧩' },\n                { id: 'mind_meditate', titleKey: 'MISSION_MIND_MEDITATE', descKey: 'MISSION_MIND_MEDITATE_DESC', icon: '🧘' },\n                { id: 'mind_focus', titleKey: 'MISSION_MIND_FOCUS', descKey: 'MISSION_MIND_FOCUS_DESC', icon: '🎯' }`
);
code = code.replace(
    /\{ id: 'combat_spar', titleKey: 'MISSION_COMBAT_SPAR', descKey: 'MISSION_COMBAT_SPAR_DESC', icon: '🥊' \}/g,
    `{ id: 'combat_spar', titleKey: 'MISSION_COMBAT_SPAR', descKey: 'MISSION_COMBAT_SPAR_DESC', icon: '🥊' },\n                { id: 'combat_reflex', titleKey: 'MISSION_COMBAT_REFLEX', descKey: 'MISSION_COMBAT_REFLEX_DESC', icon: '⚡' },\n                { id: 'combat_power', titleKey: 'MISSION_COMBAT_POWER', descKey: 'MISSION_COMBAT_POWER_DESC', icon: '💥' }`
);
code = code.replace(
    /\{ id: 'chal_dare', titleKey: 'MISSION_CHAL_DARE', descKey: 'MISSION_CHAL_DARE_DESC', icon: '🔥' \}/g,
    `{ id: 'chal_dare', titleKey: 'MISSION_CHAL_DARE', descKey: 'MISSION_CHAL_DARE_DESC', icon: '🔥' },\n                { id: 'chal_endure', titleKey: 'MISSION_CHAL_ENDURE', descKey: 'MISSION_CHAL_ENDURE_DESC', icon: '🛡️' },\n                { id: 'chal_conquer', titleKey: 'MISSION_CHAL_CONQUER', descKey: 'MISSION_CHAL_CONQUER_DESC', icon: '👑' }`
);

// 2. Add Profile Link
code = code.replace(
    /\{ id: 'home', icon: Icons\.Home, label: t\('HOME'\) \},/,
    `{ id: 'home', icon: Icons.Home, label: t('HOME') },\n                            { id: 'profile', icon: Icons.User, label: t('PROFILE', 'Profile'), action: () => onViewProfile(user) },`
);

// 3. Remove animate-pulse
code = code.replace(/animate-pulse/g, '');

// 4. Remove framer-motion tags without touching props
code = code.replace(/<motion\.([a-zA-Z]+)/g, '<$1');
code = code.replace(/<\/motion\.([a-zA-Z]+)\s*>/g, '</$1>');
code = code.replace(/<AnimatePresence[^>]*>/g, '<>');
code = code.replace(/<\/AnimatePresence>/g, '</>');
code = code.replace(/authLoading \? 'opacity-50 animate-pulse' : 'opacity-100'/g, "'opacity-100'");

fs.writeFileSync(path, code, 'utf8');
console.log('App.jsx updated safely');
