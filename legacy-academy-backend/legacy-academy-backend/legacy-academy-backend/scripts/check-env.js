// Environment Variable Check Script
console.log("🔍 Checking Environment Variables...\n");

const requiredVars = [
    'MONGO_URL',
    'JWT_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
];

let allPresent = true;

requiredVars.forEach(varName => {
    if (process.env[varName]) {
        console.log(`✅ ${varName}: Present`);
    } else {
        console.log(`❌ ${varName}: MISSING!`);
        allPresent = false;
    }
});

console.log("\n" + "=".repeat(50));
if (allPresent) {
    console.log("✅ All environment variables are set!");
    console.log("✅ Server can start safely.");
    process.exit(0);
} else {
    console.log("❌ FATAL: Missing environment variables!");
    console.log("❌ Please set them in Render Dashboard → Environment Variables");
    process.exit(1);
}
