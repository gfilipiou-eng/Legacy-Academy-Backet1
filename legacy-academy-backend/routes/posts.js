import express from "express";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import mongoose from "mongoose";
import { deleteCloudinaryFile, deleteCloudinaryFiles } from "../utils/cloudinaryCleanup.js";

const router = express.Router();

// GET ALL POSTS (Feed)
router.get("/", verifyToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const posts = await Post.find()
            .populate("author", "username profilePic role isPrivate isFollowersOnly followers")
            .populate("comments.user", "username profilePic role")
            .sort({ createdAt: -1 })
            .lean();

        const currentUserId = String(req.user?.id || req.user?.userId || '');
        const isFounder = req.user?.role === 'Founder';
        const filtered = posts.filter(p => {
            const a = p.author || {};
            const isOwner = String(a?._id || a) === currentUserId;
            const isFollower = Array.isArray(a?.followers) && a.followers.some(id => String(id) === currentUserId);
            const isPrivate = !!(a?.isPrivate || a?.isFollowersOnly);
            return !isPrivate || isOwner || isFollower || isFounder;
        });
        res.status(200).json(filtered.slice(0, limit));
    } catch (err) {
        console.error("FEED ERROR:", err);
        res.status(500).json(err);
    }
});

// GET USER POSTS (Profile)
// CRITICAL FIX: Respect Privacy Settings
router.get("/user/:userId", verifyToken, async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const author = await User.findById(targetUserId).select('isPrivate isFollowersOnly followers');
        if (!author) return res.status(404).json("Agent not found.");
        const currentUserId = String(req.user?.id || req.user?.userId || '');
        const isFounder = req.user?.role === 'Founder';
        const isOwner = String(targetUserId) === currentUserId;
        const isFollower = Array.isArray(author?.followers) && author.followers.some(id => String(id) === currentUserId);
        const isPrivate = !!(author?.isPrivate || author?.isFollowersOnly);
        if (isPrivate && !isOwner && !isFollower && !isFounder) {
            return res.status(403).json("Intel is encrypted. Clearance restricted to followers.");
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
            comments: [],
            isStory: req.body.isStory === 'true'
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

        // 🔥 REAL-TIME EMIT
        const io = req.app.get('io');
        if (io) {
            io.emit('comment.added', { postId: req.params.id, comments: updatedPost.comments });

            // NOTIFY AUTHOR (Real-time)
            if (String(post.author) !== String(req.user.id)) {
                io.to(String(post.author)).emit('notification.received', {
                    type: 'comment',
                    fromUsername: req.user.username || 'Someone',
                    fromProfilePic: req.user.profilePic || '',
                    postId: post._id
                });
            }
        }

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
            // 🗑️ CLOUDINARY CLEANUP: Delete comment audio if exists
            if (comment.audioUrl) {
                deleteCloudinaryFile(comment.audioUrl).catch(() => { });
            }

            await post.updateOne({ $pull: { comments: { _id: req.params.commentId } } });

            // 🔥 REAL-TIME EMIT
            const io = req.app.get('io');
            if (io) {
                const updated = await Post.findById(req.params.id).populate("comments.user", "username profilePic role");
                io.emit('comment.deleted', { postId: req.params.id, comments: updated?.comments || [] });
            }

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

            // 🔥 REAL-TIME EMIT
            const io = req.app.get('io');
            if (io) {
                const updated = await Post.findById(req.params.id).populate("comments.user", "username profilePic role");
                io.emit('comment.updated', { postId: req.params.id, comments: updated?.comments || [] });
            }

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
        if (!post) return res.status(404).json("Post not found");
        if (post.author.toString() === req.user.id || req.user.role === "Admin" || req.user.role === "Founder") {
            // 🗑️ CLOUDINARY CLEANUP: Delete post media + all comment audio
            const mediaToDelete = [];
            if (post.image) mediaToDelete.push(post.image);
            if (post.videoUrl && post.videoUrl !== post.image) mediaToDelete.push(post.videoUrl);
            if (post.audioUrl) mediaToDelete.push(post.audioUrl);
            if (post.thumbnailUrl) mediaToDelete.push(post.thumbnailUrl);
            // Collect all comment audio files
            (post.comments || []).forEach(c => {
                if (c.audioUrl) mediaToDelete.push(c.audioUrl);
            });

            console.log(`🗑️ [POST DELETE] Post ${req.params.id} has ${mediaToDelete.length} media files to clean:`, mediaToDelete);

            // AWAIT cleanup before deleting post
            try { await deleteCloudinaryFiles(mediaToDelete); } catch (e) { console.warn("Cloudinary cleanup partial fail:", e.message); }

            await post.deleteOne();

            // 🔥 REAL-TIME EMIT
            const io = req.app.get('io');
            if (io) {
                io.emit('post.deleted', { postId: req.params.id });
            }

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
