import express from "express";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffprobeStatic from "ffprobe-static";
import mongoose from "mongoose";
import Post from "../models/Post.js";
import User from "../models/User.js";
import upload from "../middleware/upload.js";
import { verifyToken } from "../middleware/auth.js";

// Ensure fluent-ffmpeg uses the static ffprobe binary
ffmpeg.setFfprobePath(ffprobeStatic.path);

const router = express.Router();

// HELPER: Content Moderation
const moderateContent = (text) => {
  const blacklist = [/scam/i, /crypto-scam/i, /offensiveWord1/i, /offensiveWord2/i, /spam-link-pattern/i];
  const urlPattern = /https?:\/\/(?!legacy-academy|onrender\.com)[^\s]+/gi;

  if (blacklist.some(regex => regex.test(text))) return { error: "Inappropriate content detected." };
  if ((text.match(urlPattern) || []).length > 2) return { error: "Too many external links (potential spam)." };
  return { success: true };
};

// PING
router.get("/ping", (req, res) => res.status(200).json("PONG (GET)"));
router.post("/ping", (req, res) => res.status(200).json("PONG (POST)"));
router.post("/debug/ping", (req, res) => res.status(200).json({ status: "alive", received: req.body }));

// LIKE HANDLER
const handleLike = async (req, res) => {
  const method = req.method;
  console.log(`[${method}] Processing LIKE for post:`, req.params.id, "by user:", req.user?.username);
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      console.warn("LIKE FAILED: Post not found:", req.params.id);
      return res.status(404).json("Post not found");
    }

    const userId = req.user.id || req.user.userId;
    if (!post.likes.includes(userId)) {
      const updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        { $push: { likes: userId }, $pull: { dislikes: userId } },
        { new: true }
      );
      res.status(200).json({ message: "Liked", likes: updatedPost.likes, dislikes: updatedPost.dislikes });
    } else {
      const updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        { $pull: { likes: userId } },
        { new: true }
      );
      res.status(200).json({ message: "Unliked", likes: updatedPost.likes, dislikes: updatedPost.dislikes });
    }
  } catch (e) {
    console.error("LIKE ERROR:", e);
    res.status(500).json(e);
  }
};

// DISLIKE HANDLER
const handleDislike = async (req, res) => {
  const method = req.method;
  console.log(`[${method}] Processing DISLIKE for post:`, req.params.id, "by user:", req.user?.username);
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      console.warn("DISLIKE FAILED: Post not found:", req.params.id);
      return res.status(404).json("Post not found");
    }

    const userId = req.user.id || req.user.userId;
    if (!post.dislikes?.includes(userId)) {
      const updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        { $push: { dislikes: userId }, $pull: { likes: userId } },
        { new: true }
      );
      res.status(200).json({ message: "Disliked", likes: updatedPost.likes, dislikes: updatedPost.dislikes });
    } else {
      const updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        { $pull: { dislikes: userId } },
        { new: true }
      );
      res.status(200).json({ message: "Removed dislike", likes: updatedPost.likes, dislikes: updatedPost.dislikes });
    }
  } catch (e) {
    console.error("DISLIKE ERROR:", e);
    res.status(500).json(e);
  }
};

// DEFINE SPECIFIC ROUTES FIRST (before generic /:id routes)
// This ensures /like, /dislike, /comment/:id routes match before /:id

// LIKE ROUTES
router.get("/:id/like", (req, res) => res.status(200).send("Like endpoint is LIVE. Use POST or PUT to engage."));
router.post("/:id/like", verifyToken, handleLike);
router.put("/:id/like", verifyToken, handleLike);

// DISLIKE ROUTES
router.get("/:id/dislike", (req, res) => res.status(200).send("Dislike endpoint is LIVE. Use POST or PUT to engage."));
router.post("/:id/dislike", verifyToken, handleDislike);
router.put("/:id/dislike", verifyToken, handleDislike);

// COMMENT ROUTES - MUST BE BEFORE GENERIC /:id ROUTES
// Update: Allow file upload for voice comments
router.post("/:id/comment", verifyToken, upload.single("file"), async (req, res) => {
  const reqId = req.requestId || 'no-id';
  console.log(`📡 [${reqId}] POST COMMENT attempt for Post: ${req.params.id}`);

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json("Invalid Post ID format");
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      console.warn(`[${reqId}] Post not found: ${req.params.id}`);
      return res.status(404).json("Post not found");
    }

    const currentUserId = req.user.id || req.user.userId || req.user._id;
    if (!currentUserId || !mongoose.Types.ObjectId.isValid(currentUserId)) {
      console.error(`[${reqId}] AUTH ERROR: Invalid or missing user ID`, req.user);
      return res.status(401).json("Unauthorized: User ID missing or invalid");
    }

    const currentUser = await User.findById(currentUserId).lean();
    if (!currentUser) {
      return res.status(401).json("User profile not found");
    }

    const commentText = (req.body.text || "").trim();
    const newComment = {
      text: commentText,
      audioUrl: req.file ? req.file.path : "",
      authorName: req.user.username || currentUser.username || "Anonymous",
      authorId: currentUserId,
      authorProfilePic: currentUser?.profilePic || '',
      createdAt: new Date()
    };

    if (!newComment.text && !newComment.audioUrl) {
      console.warn(`[${reqId}] REJECTED: Empty comment attempt`);
      return res.status(400).json("Comment cannot be empty");
    }

    console.log(`📡 [${reqId}] Pushing comment to DB for ${req.params.id} by ${newComment.authorName}`);

    // Using findByIdAndUpdate with $push to avoid full-document validation issues on .save()
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: newComment } },
      { new: true, runValidators: true }
    );

    if (!updatedPost) {
      throw new Error("Failed to update post with new comment");
    }

    // Send notifications in background to prevent request failure
    try {
      const authorIdStr = post.author ? post.author.toString() : '';
      if (authorIdStr && authorIdStr !== currentUserId.toString()) {
        const body = req.body || {};
        const notifText = newComment.audioUrl ? "Sent a voice note." : (body.text ? String(body.text).substring(0, 50) : "Commented.");
        await User.findByIdAndUpdate(post.author, {
          $push: {
            notifications: {
              type: 'comment',
              from: currentUserId,
              fromUsername: req.user.username || currentUser.username,
              fromProfilePic: currentUser?.profilePic || '',
              post: post._id,
              text: notifText,
              read: false,
              createdAt: new Date()
            }
          }
        });
      }

      // HANDLE MENTIONS
      const body = req.body || {};
      const mentionRegex = /@([\w.]+)/g;
      const commentTextForMentions = body.text || "";
      const mentions = [...new Set((commentTextForMentions.match(mentionRegex) || []).map(m => m.slice(1)))];

      for (const username of mentions) {
        const mentionedUser = await User.findOne({ username });
        if (mentionedUser && mentionedUser._id.toString() !== currentUserId.toString() && mentionedUser._id.toString() !== authorIdStr) {
          await mentionedUser.updateOne({
            $push: {
              notifications: {
                type: 'mention',
                from: currentUserId,
                fromUsername: req.user.username || currentUser.username,
                fromProfilePic: currentUser?.profilePic || '',
                post: post._id,
                text: `Mentioned you: ${commentTextForMentions.substring(0, 30)}...`,
                read: false,
                createdAt: new Date()
              }
            }
          });
        }
      }
    } catch (notifErr) {
      console.warn(`[${reqId}] Non-fatal notification error:`, notifErr.message);
    }

    res.status(200).json(updatedPost.comments);
  } catch (e) {
    console.error(`🔥 [${reqId}] Add comment ERROR:`, {
      message: e.message,
      stack: e.stack,
      params: req.params,
      user: req.user,
      file: req.file ? 'Present' : 'Missing'
    });
    res.status(500).json({ error: e.message || "Internal Server Error", requestId: reqId });
  }
});

router.put("/:id/comment/:commentId", verifyToken, async (req, res) => {
  console.log(`📡 [DEBUG] Comment Edit HIT: Post ${req.params.id}, Comment ${req.params.commentId}`);
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json("Post not found");

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json("Comment not found");

    const userId = req.user.id || req.user.userId;
    // Only comment author can edit
    if (comment.authorId?.toString() !== userId && req.user.role !== "Founder") {
      return res.status(403).json("Forbidden");
    }

    comment.text = req.body.text;
    await post.save();
    res.status(200).json(post.comments);
  } catch (e) { res.status(500).json(e); }
});

router.delete("/:id/comment/:commentId", verifyToken, async (req, res) => {
  console.log("Processing COMMENT DELETE: Post:", req.params.id, "Comment:", req.params.commentId);
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      console.warn("COMMENT DELETE FAILED: Post not found:", req.params.id);
      return res.status(404).json("Post not found");
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      console.warn("COMMENT DELETE FAILED: Comment not found in post:", req.params.commentId);
      return res.status(404).json("Comment not found");
    }
    const userId = req.user.id || req.user.userId;
    if (comment.authorId?.toString() !== userId && req.user.role !== "Founder" && post.author.toString() !== userId) {
      return res.status(403).json("Forbidden");
    }
    post.comments.pull(req.params.commentId);
    await post.save();
    res.status(200).json("Deleted");
  } catch (e) { res.status(500).json(e); }
});

// GET ALL POSTS (Public API)
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const posts = await Post.find()
      .populate('author', 'username profilePic role isPrivate')
      .sort({ createdAt: -1 })
      .limit(limit);

    // Allow simpler mobile clients to view JSON directly
    return res.status(200).json(posts);
  } catch (err) {
    return res.status(500).json(err);
  }
});

// CREATE POST
// NOTE: Add a short-lived duplicate-submission guard to reduce accidental double-uploads
const _recentCreates = new Map(); // key -> timestamp
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { title, desc, description, visibility, videoUrl } = req.body;
    const contentText = (title || "") + " " + (desc || description || "");
    const mod = moderateContent(contentText);
    if (!mod.success) return res.status(400).json(mod.error);

    console.log("Creating post. Body:", req.body, "User:", req.user?.username, "File:", req.file?.filename);

    if (!req.file && !desc && !title && !videoUrl) {
      return res.status(400).json("Intel content required.");
    }

    // Determine media type: file upload or provided videoUrl
    const isFileVideo = req.file?.mimetype?.includes("video") || (req.file?.path && req.file.path.match(/\.(mp4|mov|avi|webm)$/i));
    const isYouTube = typeof videoUrl === 'string' && /^\s*(?:https?:)?\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/i.test(videoUrl || '');

    const author = await User.findById(req.user.id || req.user.userId);

    // Short-circuit duplicate submissions within a small time window (5 seconds)
    const signature = `${req.user.id || req.user.userId}::${(desc || description || '').trim()}::${(videoUrl || '').trim()}::${req.file?.size || 0}`;
    const now = Date.now();
    const prev = _recentCreates.get(signature);
    if (prev && (now - prev) < 5000) {
      // attempt to find a recent matching post in DB to return instead of creating a duplicate
      const recent = await Post.findOne({ author: req.user.id || req.user.userId, desc: (desc || description || '').trim() }).sort({ createdAt: -1 }).limit(1);
      if (recent && (now - new Date(recent.createdAt).getTime()) < 10000) {
        console.log("Duplicate submission detected - returning recent post", recent._id);
        return res.status(200).json(recent);
      }
      return res.status(409).json({ message: "Duplicate submission ignored" });
    }
    _recentCreates.set(signature, now);
    // garbage collect key after short time
    setTimeout(() => _recentCreates.delete(signature), 15_000);

    // SERVER-SIDE: If user uploaded a local video file, probe duration and reject >10s
    try {
      const isLocalUpload = req.file && req.file.path && String(req.file.path).startsWith('uploads');
      if (isFileVideo && isLocalUpload && req.file.path) {
        const durMeta = await new Promise((resolve, reject) => {
          ffmpeg.ffprobe(req.file.path, (err, metadata) => err ? reject(err) : resolve(metadata));
        });
        const duration = durMeta?.format?.duration || 0;
        if (duration > 10) {
          // delete the uploaded file to avoid orphaned large assets
          try { fs.unlinkSync(req.file.path); } catch (e) { console.warn('Failed to cleanup large-upload', e && e.message); }
          return res.status(400).json({ message: 'Video duration exceeds 10 seconds. Please upload a shorter clip.' });
        }
      }
    } catch (probeErr) {
      console.warn('Video duration probe failed:', probeErr && probeErr.message);
      // proceed but warn -- client-side validation should catch most cases
    }

    const newPost = new Post({
      title: title || '',
      desc: desc || description || '',
      image: (!isFileVideo && req.file) ? req.file.path || "" : "",
      videoUrl: isFileVideo ? (req.file?.path || "") : (isYouTube ? videoUrl.trim() : (videoUrl || "")),
      thumbnailUrl: isYouTube ? `https://img.youtube.com/vi/${(videoUrl || '').match(/^\s*(?:https?:)?\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/i)?.[1]}/hqdefault.jpg` : undefined,
      author: req.user.id || req.user.userId,
      username: req.user.username,
      profilePic: author?.profilePic || "",
      role: req.user.role,
      visibility: visibility || 'public'
    });

    const savedPost = await newPost.save();

    // HANDLE MENTIONS IN POSTS
    const fullText = (title || '') + ' ' + (desc || description || '');
    const mentionRegex = /@([\w.]+)/g;
    const mentions = [...new Set((fullText.match(mentionRegex) || []).map(m => m.slice(1)))];

    if (mentions.length > 0) {
      for (const username of mentions) {
        const mentionedUser = await User.findOne({ username });
        if (mentionedUser && mentionedUser._id.toString() !== (req.user.id || req.user.userId)) {
          await mentionedUser.updateOne({
            $push: {
              notifications: {
                type: 'mention',
                from: req.user.id || req.user.userId,
                fromUsername: req.user.username,
                fromProfilePic: author?.profilePic || '',
                post: savedPost._id,
                text: `Mentioned you in intel: ${title || 'New Post'}`,
                read: false,
                createdAt: new Date()
              }
            }
          });
        }
      }
    }

    console.log("Intel Deployed:", savedPost._id);
    res.status(201).json(savedPost);
  } catch (err) {
    console.error("DEPLOYMENT FAILED:", err);
    res.status(500).json({ message: "SYSTEM ERROR: Deployment failed. Check file size/format." });
  }
});

// UPDATE POST
router.put("/:id", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      console.warn("UPDATE POST FAILED: Not found:", req.params.id);
      return res.status(404).json("Not found");
    }
    const currentUserId = req.user.id || req.user.userId;
    if (String(post.author) !== String(currentUserId) && req.user.role !== "Founder") {
      return res.status(403).json("Forbidden");
    }

    // Update fields
    if (req.body.title) post.title = req.body.title;
    if (req.body.desc) post.desc = req.body.desc;
    if (req.body.visibility) post.visibility = req.body.visibility;

    // If body contains videoUrl (YouTube or external), apply it and clear file-based image
    if (req.body.videoUrl) {
      const maybe = String(req.body.videoUrl || '').trim();
      const ytMatch = /^\s*(?:https?:)?\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/i.exec(maybe);
      if (ytMatch) {
        post.videoUrl = maybe;
        post.thumbnailUrl = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
        post.image = "";
      } else {
        // treat as generic external video link
        post.videoUrl = maybe;
        post.image = "";
      }
    }

    // Handle new media upload (file wins)
    if (req.file) {
      const isVideo = req.file.mimetype.includes("video");
      if (isVideo) {
        // If local upload, probe duration and reject > 10s
        try {
          const isLocalUpload = req.file.path && String(req.file.path).startsWith('uploads');
          if (isLocalUpload) {
            const durMeta = await new Promise((resolve, reject) => {
              ffmpeg.ffprobe(req.file.path, (err, metadata) => err ? reject(err) : resolve(metadata));
            });
            const duration = durMeta?.format?.duration || 0;
            if (duration > 10) {
              try { fs.unlinkSync(req.file.path); } catch (e) { console.warn('Failed to cleanup long video', e && e.message); }
              return res.status(400).json({ message: 'Video duration exceeds 10 seconds. Please upload a shorter clip.' });
            }
          }
        } catch (probeErr) { console.warn('Update-probe failed:', probeErr && probeErr.message); }

        post.videoUrl = req.file.path;
        post.image = "";
      } else {
        post.image = req.file.path;
        post.videoUrl = "";
      }
    }

    const updatedPost = await post.save();
    res.status(200).json(updatedPost);
  } catch (e) {
    console.error("Update failed", e);
    res.status(500).json(e);
  }
});

// DELETE POST
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json("Not found");
    // Allow Founder or Author to delete
    if (post.author.toString() !== (req.user.id || req.user.userId) && req.user.role !== "Founder") return res.status(403).json("Forbidden");
    await post.deleteOne();
    res.status(200).json("Deleted");
  } catch (e) { res.status(500).json(e); }
});

// GET FILTERED FEED (respects privacy settings) - MUST BE BEFORE GET /:id
router.get("/feed", verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.id || req.user.userId;

    // Get all posts - optimized
    const allPosts = await Post.find().sort({ createdAt: -1 }).lean();

    // Filter based on privacy
    const filteredPosts = [];

    for (const post of allPosts) {
      const postAuthor = await User.findById(post.author);

      if (!postAuthor) {
        // If author deleted, show public posts only
        if (post.visibility === 'public') filteredPosts.push(post);
        continue;
      }

      // Own posts - always show
      if (post.author.toString() === currentUserId) {
        filteredPosts.push(post);
        continue;
      }

      // HIDDEN mode (isPrivate = true)
      if (postAuthor.isPrivate) {
        // Only show if currentUser is a follower
        if (postAuthor.followers?.includes(currentUserId)) {
          filteredPosts.push(post);
        }
        continue;
      }

      // ELITE mode (isFollowersOnly = true)
      if (postAuthor.isFollowersOnly) {
        // Only show if currentUser is a follower
        if (postAuthor.followers?.includes(currentUserId)) {
          filteredPosts.push(post);
        }
        continue;
      }

      // PUBLIC mode - everyone can see
      filteredPosts.push(post);
    }

    res.status(200).json(filteredPosts);
  } catch (e) {
    console.error("Feed error:", e);
    res.status(500).json(e);
  }
});

// GET SINGLE POST - MUST BE AFTER SPECIFIC ROUTES LIKE /feed
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username profilePic role');
    if (!post) return res.status(404).json("Post not found");
    res.status(200).json(post);
  } catch (e) { res.status(500).json(e); }
});

// CATCH-ALL FOR DEBUGGING
router.use((req, res) => {
  console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`); // Added logging
  console.warn(`❌ [ROUTER 404] No match for: ${req.method} ${req.url}`);
  res.status(404).json({
    message: `Endpoint ${req.method} ${req.url} not found in Intel Router.`,
    debug: {
      method: req.method,
      url: req.url,
      params: req.params
    }
  });
});

export default router;
