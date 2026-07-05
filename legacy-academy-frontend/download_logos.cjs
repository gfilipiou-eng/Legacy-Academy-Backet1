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
        const res = await fetch(t.url);
        const html = await res.text();
        const match = html.match(/src="\/\/upload\.wikimedia\.org\/(wikipedia\/(?:commons|el|en)\/)(?:thumb\/)?([^"]+\.svg)/);
        if (match) {
            const svgUrl = 'https://upload.wikimedia.org/' + match[1] + match[2];
            console.log(t.name, svgUrl);
            const svgRes = await fetch(svgUrl);
            const svgData = await svgRes.text();
            fs.writeFileSync('src/assets/' + t.name + '.svg', svgData);
        } else {
            const pngMatch = html.match(/src="\/\/upload\.wikimedia\.org\/(wikipedia\/(?:commons|el|en)\/)(?:thumb\/)?([^"]+\.png)/);
            if(pngMatch) {
                const pngUrl = 'https://upload.wikimedia.org/' + pngMatch[1] + pngMatch[2];
                console.log(t.name, pngUrl);
                const pRes = await fetch(pngUrl);
                const pData = Buffer.from(await pRes.arrayBuffer());
                fs.writeFileSync('src/assets/' + t.name + '.png', pData);
            } else {
                console.log('Not found for', t.name);
            }
        }
    }
}
run();
