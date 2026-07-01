import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables from .env file
dotenv.config();

// Helper to clean up duplicate IDs in array
const cleanIdArray = (arr) => {
    const seen = new Set();
    return (arr || []).filter(id => {
        const strId = String(id);
        if (seen.has(strId)) return false;
        seen.add(strId);
        return true;
    });
};

const runCleanup = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/legacy-academy');
        console.log('✅ Connected to MongoDB');

        const allUsers = await User.find();
        const validUserIds = new Set(allUsers.map(u => u._id.toString()));
        let cleanedCount = 0;
        console.log(`Found ${allUsers.length} total users`);
        console.log(`Valid user IDs:`, [...validUserIds]);

        for (const user of allUsers) {
            console.log(`\n📊 User: ${user.username} (${user._id})`);
            console.log(`  Followers (raw):`, user.followers);
            console.log(`  Followers (unique count):`, cleanIdArray(user.followers).length);
            console.log(`  Following (raw):`, user.following);
            console.log(`  Following (unique count):`, cleanIdArray(user.following).length);
            console.log(`  FollowRequests (raw):`, user.followRequests);
            
            let modified = false;

            // Clean followers: unique + only valid users
            const originalFollowers = [...(user.followers || [])];
            const uniqueFollowers = cleanIdArray(originalFollowers);
            const validFollowers = uniqueFollowers.filter(id => validUserIds.has(id));
            if (JSON.stringify(originalFollowers) !== JSON.stringify(validFollowers)) {
                user.followers = validFollowers;
                modified = true;
                console.log(`  ✅ Cleaned followers (${originalFollowers.length} → ${validFollowers.length})`);
            }

            // Clean following: unique + only valid users
            const originalFollowing = [...(user.following || [])];
            const uniqueFollowing = cleanIdArray(originalFollowing);
            const validFollowing = uniqueFollowing.filter(id => validUserIds.has(id));
            if (JSON.stringify(originalFollowing) !== JSON.stringify(validFollowing)) {
                user.following = validFollowing;
                modified = true;
                console.log(`  ✅ Cleaned following (${originalFollowing.length} → ${validFollowing.length})`);
            }

            // Clean follow requests: unique + only valid users
            const originalRequests = [...(user.followRequests || [])];
            const uniqueRequests = cleanIdArray(originalRequests);
            const validRequests = uniqueRequests.filter(id => validUserIds.has(id));
            if (JSON.stringify(originalRequests) !== JSON.stringify(validRequests)) {
                user.followRequests = validRequests;
                modified = true;
                console.log(`  ✅ Cleaned followRequests (${originalRequests.length} → ${validRequests.length})`);
            }

            if (modified) {
                await user.save();
                cleanedCount++;
            }
        }

        console.log(`✅ Done! Cleaned up ${cleanedCount} user(s)`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Cleanup failed:', err);
        process.exit(1);
    }
};

runCleanup();
