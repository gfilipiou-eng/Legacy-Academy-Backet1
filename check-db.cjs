require('dotenv').config({path: './legacy-academy-backend/.env'});
const mongoose = require('mongoose');

async function check() {
    await mongoose.connect(process.env.MONGO_URL);
    const User = require('./legacy-academy-backend/models/User.js').default || require('./legacy-academy-backend/models/User.js');
    const users = await User.find({ username: /filippos/i });
    console.log("Found users:");
    users.forEach(u => console.log(`- ID: ${u._id}, Username: "${u.username}", Email: "${u.email}", Role: "${u.role}"`));
    process.exit(0);
}

check().catch(e => {
    console.error(e);
    process.exit(1);
});
