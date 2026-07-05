import fs from 'fs';
import path from 'path';
import translate from 'google-translate-api-x';

const localesDir = path.join(process.cwd(), 'src', 'locales');
const enPath = path.join(localesDir, 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json') && f !== 'en.json');
const delay = ms => new Promise(res => setTimeout(res, ms));

const ignoreKeys = ['APP_NAME', 'VERSION', 'API_URL'];

async function main() {
    for (const file of files) {
        const langCode = file.replace('.json', '');
        console.log(`\nProcessing ${langCode}...`);
        
        const filePath = path.join(localesDir, file);
        let data = {};
        try {
            data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch(e) {
            console.log(`Creating new file for ${langCode}`);
        }
        
        let modified = false;

        for (const [key, text] of Object.entries(enData)) {
            if (ignoreKeys.includes(key) || !text) continue;
            
            const isMissing = data[key] === undefined;
            const isUntranslatedEnglish = data[key] === text && text.length > 2 && !text.match(/^[A-Z0-9_]+$/);

            if (isMissing || isUntranslatedEnglish) {
                try {
                    let safeText = text.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, 'VAR_$1_VAR');
                    const res = await translate(safeText, { from: 'en', to: langCode });
                    
                    let translated = res.text.replace(/VAR_([a-zA-Z0-9_]+)_VAR/gi, '{{$1}}');
                    // Fix potential spaces added by google translate around variables
                    translated = translated.replace(/VAR_ ([a-zA-Z0-9_]+) _VAR/gi, '{{$1}}');
                    translated = translated.replace(/VAR_ ([a-zA-Z0-9_]+)_VAR/gi, '{{$1}}');
                    translated = translated.replace(/VAR_([a-zA-Z0-9_]+) _VAR/gi, '{{$1}}');

                    data[key] = translated;
                    modified = true;
                    console.log(`[${langCode}] ${key}: ${text} -> ${translated}`);
                    await delay(150);
                } catch (e) {
                    console.error(`Failed ${key}: ${e.message}`);
                }
            }
        }

        if (modified) {
            // Sort keys to match en.json order
            const sortedData = {};
            for (const key of Object.keys(enData)) {
                if (data[key] !== undefined) sortedData[key] = data[key];
            }
            fs.writeFileSync(filePath, JSON.stringify(sortedData, null, 2) + '\n', 'utf8');
            console.log(`Saved ${file}`);
        }
    }
}
main();
