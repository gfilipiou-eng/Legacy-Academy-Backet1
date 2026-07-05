const fs = require('fs');
async function run() {
    const teams = [
        { name: 'paok', url: 'https://en.wikipedia.org/wiki/PAOK_FC' },
        { name: 'olympiacos', url: 'https://en.wikipedia.org/wiki/Olympiacos_F.C.' },
        { name: 'aek', url: 'https://en.wikipedia.org/wiki/AEK_Athens_F.C.' },
        { name: 'pao', url: 'https://en.wikipedia.org/wiki/Panathinaikos_F.C.' },
        { name: 'aris', url: 'https://en.wikipedia.org/wiki/Aris_Thessaloniki_F.C.' }
    ];
    for (const t of teams) {
        const res = await fetch(t.url, { headers: { 'User-Agent': 'Bot/1.0' } });
        const html = await res.text();
        const match = html.match(/<table class="infobox[^>]*>.*?src="(\/\/upload\.wikimedia\.org\/wikipedia\/[^"]+)"/is);
        if (match) {
            const fileUrl = 'https:' + match[1];
            console.log(t.name, fileUrl);
            const imgRes = await fetch(fileUrl, { headers: { 'User-Agent': 'Bot/1.0' } });
            const imgData = Buffer.from(await imgRes.arrayBuffer());
            const ext = fileUrl.endsWith('.svg') ? '.svg' : '.png';
            fs.writeFileSync('src/assets/' + t.name + ext, imgData);
        } else {
            console.log('Not found for', t.name);
        }
    }
}
run();
