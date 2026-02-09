import express from "express";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";
import upload from "../middleware/upload.js"; // Assuming upload middleware exists
import mongoose from "mongoose";

const router = express.Router();

// GET ALL POSTS (Feed)
router.get("/", verifyToken, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const followingList = currentUser.following || [];

        const posts = await Post.find()
            .populate("author", "username profilePic role isPrivate") // Populate isPrivate to filter in frontend if needed?
            .populate("comments.user", "username profilePic role")
            .sort({ createdAt: -1 })
            .limit(parseInt(req.query.limit) || 20);

        // Filter out private posts from non-followed authors
        const filteredPosts = posts.filter(post => {
            if (!post.author) return false;
            // 1. My own posts -> Always visible
            if (post.author._id.toString() === req.user.id) return true;
            // 2. Public Account -> Visible
            if (!post.author.isPrivate) return true;
            // 3. Private Account -> Visible ONLY if following
            if (followingList.includes(post.author._id.toString())) return true;

            return false; // Hide otherwise
        });

        res.status(200).json(filteredPosts);
    } catch (err) {
        res.status(500).json(err);
    }
});

// GET USER POSTS (Profile)
// CRITICAL FIX: Respect Privacy Settings
router.get("/user/:userId", verifyToken, async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const currentUserId = req.user.id;

        const user = await User.findById(targetUserId);
        if (!user) return res.status(404).json("User not found");

        // Privacy Check
        const isOwner = currentUserId === targetUserId;
        const isFollower = user.followers.map(id => id.toString()).includes(currentUserId);

        if (user.isPrivate && !isOwner && !isFollower) {
            console.log(`[PRIVACY] Blocked access to posts of ${user.username} for ${currentUserId}`);
            return res.status(200).json([]); // Return empty array so UI shows "No posts" or handles it
        }

        const posts = await Post.find({ author: targetUserId })
            .populate("author", "username profilePic role")
            .populate("comments.user", "username profilePic role")
            .sort({ createdAt: -1 });

        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json(err);
    }
});

// CREATE POST
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
    try {
        let mediaUrl = "";
        let mediaType = "text";

        if (req.file) {
            mediaUrl = req.file.path; // Cloudinary path
            mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";
        }

        const newPost = new Post({
            author: req.user.id,
            desc: req.body.desc,
            image: mediaUrl,
            videoUrl: mediaType === "video" ? mediaUrl : "",
            likes: [],
            dislikes: [],
            comments: []
        });

        const savedPost = await newPost.save();
        await savedPost.populate("author", "username profilePic role");
        res.status(200).json(savedPost);
    } catch (err) {
        res.status(500).json(err);
    }
});

// LIKE POST
router.put("/:id/like", verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json("Post not found");

        const userId = req.user.id;

        if (!post.likes.includes(userId)) {
            await post.updateOne({ $push: { likes: userId }, $pull: { dislikes: userId } });
            // Add Notification call here if needed
            res.status(200).json({ message: "Liked", likes: [...post.likes, userId], dislikes: post.dislikes.filter(id => id !== userId) });
        } else {
            await post.updateOne({ $pull: { likes: userId } });
            res.status(200).json({ message: "Unliked", likes: post.likes.filter(id => id !== userId), dislikes: post.dislikes });
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// DISLIKE POST
router.put("/:id/dislike", verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json("Post not found");

        const userId = req.user.id;

        if (!post.dislikes.includes(userId)) {
            await post.updateOne({ $push: { dislikes: userId }, $pull: { likes: userId } });
            res.status(200).json({ message: "Disliked", likes: post.likes.filter(id => id !== userId), dislikes: [...post.dislikes, userId] });
        } else {
            await post.updateOne({ $pull: { dislikes: userId } });
            res.status(200).json({ message: "Undisliked", likes: post.likes, dislikes: post.dislikes.filter(id => id !== userId) });
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// COMMENT ON POST
router.post("/:id/comment", verifyToken, upload.single("file"), async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json("Post not found");

        let audioUrl = "";
        if (req.file) {
            audioUrl = req.file.path; // Cloudinary path from upload middleware
        }

        const comment = {
            user: req.user.id,
            text: req.body.text || "",
            audioUrl: audioUrl,
            createdAt: new Date()
        };

        await post.updateOne({ $push: { comments: comment } });

        // Return updated comments with population
        const updatedPost = await Post.findById(req.params.id).populate("comments.user", "username profilePic role");
        res.status(200).json(updatedPost.comments);
    } catch (err) {
        console.error("Comment Error:", err);
        res.status(500).json(err);
    }
});

// DELETE COMMENT
router.delete("/:id/comment/:commentId", verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json("Post not found");

        const comment = post.comments.find(c => c._id.toString() === req.params.commentId);
        if (!comment) return res.status(404).json("Comment not found");

        if (comment.user.toString() === req.user.id || req.user.role === "Admin" || req.user.role === "Founder") {
            await post.updateOne({ $pull: { comments: { _id: req.params.commentId } } });
            res.status(200).json("Comment deleted");
        } else {
            res.status(403).json("You can delete only your comment");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// EDIT COMMENT
router.put("/:id/comment/:commentId", verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json("Post not found");

        const comment = post.comments.find(c => c._id.toString() === req.params.commentId);
        if (!comment) return res.status(404).json("Comment not found");

        if (comment.user.toString() === req.user.id || req.user.role === "Founder") {
            // We need to update a specific item in the array. 
            // Mongoose array update: "comments.$.text"
            await Post.updateOne(
                { _id: req.params.id, "comments._id": req.params.commentId },
                { $set: { "comments.$.text": req.body.text } }
            );
            res.status(200).json("Comment updated");
        } else {
            res.status(403).json("You can update only your comment");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});


// DELETE POST
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post.author.toString() === req.user.id || req.user.role === "Admin" || req.user.role === "Founder") {
            await post.deleteOne();
            res.status(200).json("Post deleted");
        } else {
            res.status(403).json("You can delete only your post");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// GET POST BY ID (for Modal?)
router.get("/find/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate("author").populate("comments.user");
        res.status(200).json(post);
    } catch (err) {
        res.status(500).json(err);
    }
});

export default router;
