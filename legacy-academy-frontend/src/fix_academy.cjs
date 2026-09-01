const fs = require('fs');
const dir = 'locales';
const files = fs.readdirSync(dir);
files.forEach(file => {
    if (file.endsWith('.json')) {
        let content = fs.readFileSync(dir + '/' + file, 'utf8');
        content = content.replace(/"UNLOCK ACADEMY ACCESS"/g, '"UNLOCK PLATFORM ACCESS"');
        content = content.replace(/"ΞΕΚΛΕΙΔΩΣΕ ΤΗΝ ΠΡΟΣΒΑΣΗ ΣΤΗΝ ΑΚΑΔΗΜΙΑ"/g, '"ΞΕΚΛΕΙΔΩΣΕ ΤΗΝ ΠΛΑΤΦΟΡΜΑ"');
        fs.writeFileSync(dir + '/' + file, content);
    }
});
