import mongoose from "mongoose";
import dotenv from "dotenv";
import Post from "../models/Post.js";

// Load environment variables
dotenv.config();

// Sample posts data
const samplePosts = [
    {
        title: "Η Κληρονομιά του Andrew Tate",
        desc: "Ο Andrew Tate είναι ένας από τους πιο αμφιλεγόμενους αλλά και επιτυχημένους επιχειρηματίες της εποχής μας. Η φιλοσοφία του βασίζεται στην αυτοβελτίωση, την οικονομική ελευθερία και την πειθαρχία.",
        image: "https://res.cloudinary.com/demo/image/upload/sample.jpg", // Placeholder image
    },
    {
        title: "10 Μαθήματα Ζωής από τον Tate",
        desc: "Στο Legacy διδάσκουμε την αξία της σκληρής δουλειάς, της επιμονής και του mindset του νικητή. Ανακαλύψτε τα 10 βασικά μαθήματα που θα αλλάξουν τη ζωή σας.",
        image: "https://res.cloudinary.com/demo/image/upload/sample_2.jpg", // Placeholder image
    },
    {
        title: "Πώς να Γίνεις Επιτυχημένος Επιχειρηματίας",
        desc: "Η επιτυχία δεν είναι τυχαία. Χρειάζεται στρατηγική, σκληρή δουλειά και το σωστό mindset. Μάθε τα μυστικά της επιχειρηματικότητας από τους καλύτερους.",
        image: "https://res.cloudinary.com/demo/image/upload/sample_3.jpg", // Placeholder image
    },
];

// Seed function
const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL);
        console.log("✅ Connected to MongoDB");

        // Clear existing posts (optional - comment out if you want to keep existing data)
        await Post.deleteMany({});
        console.log("🗑️  Cleared existing posts");

        // Insert sample posts
        const createdPosts = await Post.insertMany(samplePosts);
        console.log(`✅ Created ${createdPosts.length} sample posts:`);
        createdPosts.forEach((post, index) => {
            console.log(`   ${index + 1}. ${post.title}`);
        });

        // Disconnect
        await mongoose.disconnect();
        console.log("✅ Disconnected from MongoDB");
        console.log("\n🎉 Database seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding database:", error);
        process.exit(1);
    }
};

// Run seed
seedDatabase();
