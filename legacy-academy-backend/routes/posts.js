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

// REPOST POST (Toggle repost status) - PROMOTED FOR MATCHING
router.route("/:id/repost").all(verifyToken, async (req, res) => {
    try {
        const targetId = String(req.params.id).trim();
        const currentPost = await Post.findById(targetId);
        if (!currentPost) return res.status(404).json(`Post not found: ${targetId}`);

        const userId = String(req.user.id);
        const isReposting = !(currentPost.reposts || []).some(id => String(id) === userId);

        let newReposts = (currentPost.reposts || []).map(id => String(id));
        if (isReposting) {
            newReposts.push(userId);
        } else {
            newReposts = newReposts.filter(id => id !== userId);
        }

        const updatedPost = await Post.findByIdAndUpdate(
            targetId,
            { $set: { reposts: [...new Set(newReposts)] } },
            { new: true }
        );

        const io = req.app.get('io');
        if (io) {
            io.emit('post.reposted', { postId: targetId, reposts: updatedPost.reposts });

            if (isReposting && String(updatedPost.author) !== userId) {
                // Fetch real actor info (JWT only has id+role)
                const actor = await User.findById(userId).select('username profilePic').lean();
                const fromUsername = actor?.username || 'Unknown';
                const fromProfilePic = actor?.profilePic || '';

                await User.findByIdAndUpdate(updatedPost.author, {
                    $push: {
                        notifications: {
                            $each: [{ type: 'repost', from: userId, fromUsername, fromProfilePic, post: updatedPost._id, read: false, createdAt: new Date() }],
                            $position: 0
                        }
                    }
                });
                io.to(String(updatedPost.author)).emit('notification.received', { type: 'repost', fromUsername, fromProfilePic, postId: updatedPost._id });
            }
        }

        res.status(200).json({ message: isReposting ? "Reposted" : "Unreposted", reposts: updatedPost.reposts });
    } catch (err) {
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
        const posts = await Post.find({
            $or: [
                { author: targetUserId },
                { reposts: targetUserId }
            ]
        })
            .populate("author", "username profilePic role")
            .populate("comments.user", "username profilePic role")
            .sort({ createdAt: -1 });

        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json(err);
    }
});

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
            videoUrl: req.file && mediaType === "video" ? mediaUrl : (req.body.videoUrl || ""),
            likes: [],
            dislikes: [],
            comments: [],
            isStory: req.body.isStory === 'true'
        });

        const savedPost = await newPost.save();
        await savedPost.populate("author", "username profilePic role isPrivate isFollowersOnly followers");

        const io = req.app.get('io');
        if (io) {
            io.emit('post.created', savedPost);
        }

        res.status(200).json(savedPost);
    } catch (err) {
        res.status(500).json(err);
    }
});

// LIKE POST
router.put("/:id/like", verifyToken, async (req, res) => {
    try {
        const currentPost = await Post.findById(req.params.id);
        if (!currentPost) return res.status(404).json("Post not found");

        const userId = String(req.user.id);
        const isLiking = !currentPost.likes.some(id => String(id) === userId);

        let newLikes = currentPost.likes.map(id => String(id));
        let newDislikes = currentPost.dislikes.map(id => String(id));

        if (isLiking) {
            newLikes.push(userId);
            newDislikes = newDislikes.filter(id => id !== userId);
        } else {
            newLikes = newLikes.filter(id => id !== userId);
            newDislikes = newDislikes.filter(id => id !== userId);
        }

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            { $set: { likes: [...new Set(newLikes)], dislikes: [...new Set(newDislikes)] } },
            { new: true }
        );

        const io = req.app.get('io');
        if (io) {
            io.emit('post.liked', { postId: req.params.id, likes: updatedPost.likes, dislikes: updatedPost.dislikes });

            if (isLiking && String(updatedPost.author) !== userId) {
                // Fetch real actor info
                const actor = await User.findById(userId).select('username profilePic').lean();
                const fromUsername = actor?.username || 'Unknown';
                const fromProfilePic = actor?.profilePic || '';

                await User.findByIdAndUpdate(updatedPost.author, {
                    $push: {
                        notifications: {
                            $each: [{ type: 'like', from: userId, fromUsername, fromProfilePic, post: updatedPost._id, read: false, createdAt: new Date() }],
                            $position: 0
                        }
                    }
                });
                io.to(String(updatedPost.author)).emit('notification.received', { type: 'like', fromUsername, fromProfilePic, postId: updatedPost._id });
            }
        }

        res.status(200).json({ message: isLiking ? "Liked" : "Unliked", likes: updatedPost.likes, dislikes: updatedPost.dislikes });
    } catch (err) {
        res.status(500).json(err);
    }
});

// DISLIKE POST
router.put("/:id/dislike", verifyToken, async (req, res) => {
    try {
        const currentPost = await Post.findById(req.params.id);
        if (!currentPost) return res.status(404).json("Post not found");

        const userId = String(req.user.id);
        const isDisliking = !currentPost.dislikes.some(id => String(id) === userId);

        let newLikes = currentPost.likes.map(id => String(id));
        let newDislikes = currentPost.dislikes.map(id => String(id));

        if (isDisliking) {
            newDislikes.push(userId);
            newLikes = newLikes.filter(id => id !== userId);
        } else {
            newDislikes = newDislikes.filter(id => id !== userId);
            newLikes = newLikes.filter(id => id !== userId);
        }

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            { $set: { likes: [...new Set(newLikes)], dislikes: [...new Set(newDislikes)] } },
            { new: true }
        );

        const io = req.app.get('io');
        if (io) {
            io.emit('post.liked', { postId: req.params.id, likes: updatedPost.likes, dislikes: updatedPost.dislikes });

            if (isDisliking && String(updatedPost.author) !== userId) {
                // Fetch real actor info
                const actor = await User.findById(userId).select('username profilePic').lean();
                const fromUsername = actor?.username || 'Unknown';
                const fromProfilePic = actor?.profilePic || '';

                await User.findByIdAndUpdate(updatedPost.author, {
                    $push: {
                        notifications: {
                            $each: [{ type: 'dislike', from: userId, fromUsername, fromProfilePic, post: updatedPost._id, read: false, createdAt: new Date() }],
                            $position: 0
                        }
                    }
                });
                io.to(String(updatedPost.author)).emit('notification.received', { type: 'dislike', fromUsername, fromProfilePic, postId: updatedPost._id });
            }
        }

        res.status(200).json({ message: isDisliking ? "Disliked" : "Undisliked", likes: updatedPost.likes, dislikes: updatedPost.dislikes });
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
        if (req.file) { audioUrl = req.file.path; }

        const comment = { user: req.user.id, text: req.body.text || "", audioUrl, createdAt: new Date() };
        await post.updateOne({ $push: { comments: comment } });

        const updatedPost = await Post.findById(req.params.id).populate("comments.user", "username profilePic role");

        const io = req.app.get('io');
        if (io) {
            io.emit('comment.added', { postId: req.params.id, comments: updatedPost.comments });

            if (String(post.author) !== String(req.user.id)) {
                // Fetch real actor info
                const actor = await User.findById(req.user.id).select('username profilePic').lean();
                const fromUsername = actor?.username || 'Unknown';
                const fromProfilePic = actor?.profilePic || '';

                await User.findByIdAndUpdate(post.author, {
                    $push: {
                        notifications: {
                            $each: [{ type: 'comment', from: req.user.id, fromUsername, fromProfilePic, post: post._id, read: false, createdAt: new Date() }],
                            $position: 0
                        }
                    }
                });
                io.to(String(post.author)).emit('notification.received', { type: 'comment', fromUsername, fromProfilePic, postId: post._id });
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
            await Post.updateOne(
                { _id: req.params.id, "comments._id": req.params.commentId },
                { $set: { "comments.$.text": req.body.text } }
            );

            // Fetch the updated post to return correct comments array
            const updated = await Post.findById(req.params.id).populate("comments.user", "username profilePic role");

            // 🔥 REAL-TIME EMIT
            const io = req.app.get('io');
            if (io) {
                io.emit('comment.updated', { postId: req.params.id, comments: updated?.comments || [] });
            }

            // Return the updated comments array to the frontend
            res.status(200).json(updated.comments);
        } else {
            res.status(403).json("You can update only your comment");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// EDIT POST
router.put("/:id", verifyToken, upload.single("image"), async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json("Post not found");

        if (post.author.toString() === req.user.id || req.user.role === "Founder" || req.user.role === "Admin") {
            let updateData = { desc: req.body.desc };

            // Handle Media Update if provided
            if (req.file) {
                const mediaUrl = req.file.path;
                const mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";
                updateData.image = mediaUrl;
                updateData.videoUrl = mediaType === "video" ? mediaUrl : "";
            } else if (req.body.videoUrl) {
                // For YouTube URLs
                updateData.videoUrl = req.body.videoUrl;
                updateData.image = ""; // Clear existing image
            }

            const updatedPost = await Post.findByIdAndUpdate(
                req.params.id,
                { $set: updateData },
                { new: true }
            ).populate("author", "username profilePic role isPrivate isFollowersOnly followers");

            res.status(200).json(updatedPost);
        } else {
            res.status(403).json("You can update only your post");
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
