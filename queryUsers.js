import mongoose from 'mongoose';

const mongoUrl = "mongodb+srv://bagugan2009_db_user:kokops1213A@cluster0.kcjblbq.mongodb.net/legacyacademy?retryWrites=true&w=majority";

async function run() {
    try {
        console.log("Connecting...");
        await mongoose.connect(mongoUrl);
        console.log("Connected!");
        
        // Define a simple Schema for User to query
        const userSchema = new mongoose.Schema({
            username: String,
            email: String,
            role: String
        }, { strict: false });
        
        const User = mongoose.model('User', userSchema, 'users');
        
        const allUsers = await User.find({});
        console.log("Total users found:", allUsers.length);
        console.log("Users list:");
        allUsers.forEach(u => {
            console.log(`- ID: ${u._id}, Username: "${u.username}", Email: "${u.email}"`);
        });
        
        await mongoose.disconnect();
        console.log("Disconnected.");
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
