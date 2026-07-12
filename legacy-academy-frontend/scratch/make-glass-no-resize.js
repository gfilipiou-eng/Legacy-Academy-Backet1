const sharp = require('sharp');
const fs = require('fs');

async function main() {
  try {
    const origPath = '../public/Applogo.png';
    const tempPath = '../public/Applogo_temp.png';

    // Get metadata of original logo to know its exact size
    const metadata = await sharp(origPath).metadata();
    const w = metadata.width;
    const h = metadata.height;

    // Read the original image into a buffer
    const logoBuffer = await sharp(origPath).toBuffer();

    // Create a very dark "glass" background of the EXACT same size
    await sharp({
      create: {
        width: w,
        height: h,
        channels: 4,
        background: { r: 12, g: 12, b: 14, alpha: 1 }
      }
    })
    .composite([
      { input: logoBuffer, gravity: 'center' }
    ])
    .png()
    .toFile(tempPath);

    // Replace original
    fs.renameSync(tempPath, origPath);

    // Make iOS copy
    await sharp(origPath).toFile('../public/Applogo-ios.png');

    console.log("Success! Dark background applied WITHOUT resizing.");
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
