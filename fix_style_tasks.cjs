const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'legacy-academy-frontend', 'src');

// 1. Fix Icons.jsx
const iconsPath = path.join(srcDir, 'components', 'Icons.jsx');
let iconsContent = fs.readFileSync(iconsPath, 'utf8');
iconsContent = iconsContent.replace(/<svg /g, '<svg xmlns="http://www.w3.org/2000/svg" ');
fs.writeFileSync(iconsPath, iconsContent);
console.log('Fixed Icons.jsx');

// 2. Fix index.css
const cssPath = path.join(srcDir, 'index.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');
if (!cssContent.includes('.descriptor-founder-entrepreneur')) {
    const founderCss = `
.descriptor-founder-entrepreneur {
  color: #fbbf24 !important;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%) !important;
  border: 1px solid rgba(251, 191, 36, 0.5) !important;
  box-shadow: 0 0 10px rgba(251, 191, 36, 0.2) !important;
  font-weight: 900 !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

@media (hover: hover) {
  .descriptor-founder-entrepreneur:hover {
    border-color: rgba(251, 191, 36, 0.8) !important;
    box-shadow: 0 0 15px rgba(251, 191, 36, 0.4) !important;
    transform: translateY(-2px) scale(1.03);
  }
}
`;
    cssContent = cssContent.replace('.descriptor-entrepreneur {', founderCss + '\n.descriptor-entrepreneur {');
    fs.writeFileSync(cssPath, cssContent);
    console.log('Fixed index.css');
}

// 3. Fix App.jsx
const appPath = path.join(srcDir, 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// A. Insert getDescriptorAccentClass
if (!appContent.includes('const getDescriptorAccentClass')) {
    const helper = `
const getDescriptorAccentClass = (descriptor, role) => {
    if (descriptor === 'entrepreneur' && role === 'Founder') {
        return 'descriptor-founder-entrepreneur';
    }
    return PROFILE_DESCRIPTOR_MAP[descriptor]?.accentClass || '';
};
`;
    appContent = appContent.replace('const PROFILE_DESCRIPTOR_MAP = Object.fromEntries(PROFILE_DESCRIPTOR_OPTIONS.map(option => [option.value, option]));', 'const PROFILE_DESCRIPTOR_MAP = Object.fromEntries(PROFILE_DESCRIPTOR_OPTIONS.map(option => [option.value, option]));' + helper);
}

// B. Replace usages of accentClass
appContent = appContent.replace(/PROFILE_DESCRIPTOR_MAP\[([^\]]+)\]\.accentClass\.replace\(\/rounded-none\/g, ''\)/g, 'getDescriptorAccentClass($1, $1 === author?.profileDescriptor ? author?.role : ($1 === publicUser?.profileDescriptor ? publicUser?.role : ($1 === shareModalPost?.author?.profileDescriptor ? shareModalPost?.author?.role : undefined))).replace(/rounded-none/g, "")');
appContent = appContent.replace(/PROFILE_DESCRIPTOR_MAP\[shareModalProfile\.profileDescriptor\]\.accentClass/g, 'getDescriptorAccentClass(shareModalProfile.profileDescriptor, shareModalProfile.role)');

// In the settings modal (line ~4561)
appContent = appContent.replace(/option\.accentClass \+ ' border-current'/g, 'getDescriptorAccentClass(option.value, user?.role) + " border-current"');
appContent = appContent.replace(/\$\{isSelected \? `\$\{option\.accentClass\}/g, '${isSelected ? `${getDescriptorAccentClass(option.value, user?.role)}');

// C. Fix Free Agent / Motorsport
const teamFormatHelper = `
const formatPlayerTeam = (team, sport, t) => {
    if (!team) return sport || '';
    if (team.startsWith('_Retired')) return t('RETIRED_PLAYER', 'Retired Player');
    if (team.startsWith('_Deceased')) return t('DECEASED_PLAYER', 'Deceased Player');
    if (team.startsWith('_Free Agent')) return t('FREE_AGENT', 'Free Agent');
    if (sport && (sport.toLowerCase().includes('motorsport') || sport.toLowerCase().includes('formula'))) return team + ' (Formula 1)';
    return team;
};
`;

if (!appContent.includes('const formatPlayerTeam')) {
    appContent = appContent.replace('const App = () => {', teamFormatHelper + '\nconst App = () => {');
}

// Replace in favoritePlayer badge (2 places) and search results
appContent = appContent.replace(/\(favoritePlayer\?\.strTeam && favoritePlayer\.strTeam\.startsWith\('_Retired'\)\)[\s\S]*?\? t\('DECEASED_PLAYER', 'Deceased Player'\)[\s\S]*?: \(favoritePlayer\?\.strTeam \|\| t\('YOUR_DESIGNATED_PLAYER', 'Your designated favorite player'\)\)/g, '(favoritePlayer?.strTeam || favoritePlayer?.strSport) ? formatPlayerTeam(favoritePlayer.strTeam, favoritePlayer.strSport, t) : t("YOUR_DESIGNATED_PLAYER", "Your designated favorite player")');

appContent = appContent.replace(/\(player\.strTeam && player\.strTeam\.startsWith\('_Retired'\)\)[\s\S]*?\? t\('DECEASED_PLAYER', 'Deceased Player'\)[\s\S]*?: \(player\.strTeam \|\| player\.strSport \|\| ''\)/g, 'formatPlayerTeam(player.strTeam, player.strSport, t)');

fs.writeFileSync(appPath, appContent);
console.log('Fixed App.jsx');

// 4. Update locales
const localesDir = path.join(srcDir, 'locales');
const files = fs.readdirSync(localesDir);
for (const file of files) {
    if (file.endsWith('.json')) {
        const filePath = path.join(localesDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        let freeAgentTrans = 'Free Agent';
        let f1Trans = 'Formula 1';
        
        if (file === 'el.json' || file === 'cy.json') {
            freeAgentTrans = 'Ελεύθερος Παίκτης';
            f1Trans = 'Φόρμουλα 1';
        } else if (file === 'fr.json') {
            freeAgentTrans = 'Agent Libre';
        } else if (file === 'de.json') {
            freeAgentTrans = 'Freier Agent';
        } else if (file === 'es.json') {
            freeAgentTrans = 'Agente Libre';
        } else if (file === 'ru.json') {
            freeAgentTrans = 'Свободный Агент';
        } else if (file === 'tr.json') {
            freeAgentTrans = 'Serbest Oyuncu';
        } else if (file === 'ro.json') {
            freeAgentTrans = 'Agent Liber';
        }

        if (!data['FREE_AGENT']) data['FREE_AGENT'] = freeAgentTrans;
        if (!data['FORMULA_1']) data['FORMULA_1'] = f1Trans;
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
}
console.log('Updated Locales');
