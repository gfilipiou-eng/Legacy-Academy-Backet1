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

// SHARE HANDLER
const handleShare = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const post = await Post.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { shares: userId } },
            { new: true }
        );
        if (!post) return res.status(404).json("Post not found");
        res.status(200).json({ shares: post.shares });
    } catch (e) { res.status(500).json(e); }
};
router.post("/:id/share", verifyToken, handleShare);

// REPOST POST (Toggle repost status)
router.route("/:id/repost").all(verifyToken, async (req, res) => {
    try {
        const targetId = String(req.params.id).trim();
        const originalPost = await Post.findById(targetId);
        if (!originalPost) return res.status(404).json(`Post not found: ${targetId}`);

        const userId = String(req.user.id || req.user.userId);
        const isReposting = !(originalPost.reposts || []).some(id => String(id) === userId);
        console.log("🔄 [REPOST] User", userId, "is reposting post", targetId, "isReposting:", isReposting);

        let newReposts = (originalPost.reposts || []).map(id => String(id));
        if (isReposting) {
            newReposts.push(userId);
        } else {
            newReposts = newReposts.filter(id => id !== userId);
        }

        const updatedOriginalPost = await Post.findByIdAndUpdate(
            targetId,
            { $set: { reposts: [...new Set(newReposts)] } },
            { new: true }
        );

        let newRepostPost = null;
        if (isReposting) {
            // Create repost post
            console.log("🔄 [REPOST] Creating repost post for user:", userId);
            const currentUser = await User.findById(userId).select('username profilePic role');
            newRepostPost = new Post({
                author: originalPost.author,
                username: originalPost.username,
                profilePic: originalPost.profilePic,
                role: originalPost.role,
                desc: originalPost.desc,
                image: originalPost.image,
                videoUrl: originalPost.videoUrl,
                thumbnailUrl: originalPost.thumbnailUrl,
                audioUrl: originalPost.audioUrl,
                isRepost: true,
                repostedBy: userId,
                originalPost: targetId,
                isStory: originalPost.isStory
            });
            await newRepostPost.save();
            await newRepostPost.populate('author repostedBy', 'username profilePic role');
            console.log("🔄 [REPOST] Repost post created successfully:", newRepostPost._id);
        } else {
            // Delete repost post
            console.log("🔄 [REPOST] Deleting repost post for user:", userId);
            const deleted = await Post.deleteOne({ originalPost: targetId, repostedBy: userId, isRepost: true });
            console.log("🔄 [REPOST] Repost post deleted count:", deleted.deletedCount);
        }

        const io = req.app.get('io');
        if (io) {
            io.emit('post.reposted', { postId: targetId, reposts: updatedOriginalPost.reposts, newRepostPost, isReposting });
        }

        res.status(200).json({ 
            message: isReposting ? "Reposted" : "Unreposted", 
            reposts: updatedOriginalPost.reposts,
            newRepostPost,
            isReposting,
            originalPostId: targetId
        });
    } catch (err) {
        console.error("Repost error:", err);
        res.status(500).json(err);
    }
});

// COMMENT ROUTES - MUST BE BEFORE GENERIC /:id ROUTES
// Update: Allow file upload for voice comments w/ Safe Wrapper
const safeCommentUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      console.error("Comment Upload Middleware Error:", err.message);
      // If upload fails, we can either reject or continue without file. 
      // For comments, if it was voice note, it's critical. If text, maybe optional.
      // But usually this means "File too large" or "Unexpected field".
      return res.status(400).json({ message: "Upload failed: " + err.message });
    }
    next();
  });
};

router.post("/:id/comment", safeCommentUpload, verifyToken, async (req, res) => {
  const reqId = req.requestId || 'no-id';
  console.log(`📡 [${reqId}] POST COMMENT attempt for Post: ${req.params.id}`);

  // CRITICAL: Ensure req.user exists (set by verifyToken)
  if (!req || !req.user) {
    console.error(`[${reqId}] AUTH MISSING: req.user is undefined`);
    return res.status(401).json("Authentication required. Please refresh.");
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json("Invalid Post ID format");
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      console.warn(`[${reqId}] Post not found: ${req.params.id}`);
      return res.status(404).json("Post not found");
    }

    const currentUserId = req.user?.id || req.user?.userId || req.user?._id;
    if (!currentUserId || !mongoose.Types.ObjectId.isValid(String(currentUserId))) {
      console.error(`[${reqId}] AUTH ERROR: Invalid or missing user ID`, req.user);
      return res.status(401).json("Unauthorized: Session corrupted.");
    }

    const currentUser = await User.findById(currentUserId).select("username profilePic").lean();
    if (!currentUser) {
      console.error(`🚨 [${reqId}] USER NOT FOUND: ${currentUserId}`);
      return res.status(401).json("User profile no longer exists. Access denied.");
    }

    const body = req.body || {};
    const commentText = (body.text || "").trim();
    console.log(`[${reqId}] Body received:`, { text: commentText, hasFile: !!req.file });

    // SAFE CASTING to ObjectId
    let authorIdObj;
    try {
      if (!mongoose.Types.ObjectId.isValid(String(currentUserId))) {
        throw new Error(`Invalid User ID format: ${currentUserId}`);
      }
      authorIdObj = new mongoose.Types.ObjectId(String(currentUserId));
    } catch (castErr) {
      console.error(`[${reqId}] ObjectId Cast Failed for user ${currentUserId}:`, castErr.message);
      return res.status(401).json("Neural state mismatch. Re-log required.");
    }

    let audioPath = "";
    if (req.file && req.file.path) {
      audioPath = req.file.path;
      if (audioPath.startsWith('uploads')) {
        audioPath = '/' + audioPath.replace(/\\/g, '/');
      }
    }

    const newComment = {
      text: commentText,
      audioUrl: audioPath,
      authorName: req.user?.username || currentUser?.username || "Anonymous",
      authorId: authorIdObj,
      authorProfilePic: currentUser?.profilePic || '',
      createdAt: new Date()
    };

    if (!newComment.text && !newComment.audioUrl) {
      console.warn(`[${reqId}] Empty comment attempted`);
      return res.status(400).json("Comment cannot be empty");
    }

    console.log(`[${reqId}] Persisting comment...`, { authorId: authorIdObj });

    // Simplified and robust database update
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: newComment } },
      { new: true, runValidators: false }
    ).lean();

    if (!updatedPost) {
      console.warn(`[${reqId}] Post disappeared during update: ${req.params.id}`);
      return res.status(404).json("Post disappeared during update.");
    }

    // Send notifications in background (fully sandboxed)
    const runNotifications = async () => {
      try {
        const targetAuthorId = post.author;
        console.log(`📡 [${reqId}] Starting notifications. Author: ${targetAuthorId}`);
        if (targetAuthorId && String(targetAuthorId) !== String(currentUserId)) {
          const notifText = newComment.audioUrl ? "Sent a voice note." : (commentText.substring(0, 50) || "Commented.");
          const fromName = req.user.username || currentUser.username || "Someone";

          await User.findByIdAndUpdate(targetAuthorId, {
            $push: {
              notifications: {
                type: 'comment',
                from: authorIdObj,
                fromUsername: fromName,
                fromProfilePic: currentUser?.profilePic || '',
                post: post._id,
                text: notifText,
                read: false,
                createdAt: new Date()
              }
            }
          });
          console.log(`📡 [${reqId}] Notification sent to author`);

          // 🔥 REAL-TIME NOTIF
          const io = req.app.get('io');
          if (io) {
            io.to(String(targetAuthorId)).emit('notification.received', {
              type: 'comment',
              fromUsername: fromName,
              fromProfilePic: currentUser?.profilePic || '',
              postId: post._id
            });
          }
        }

        // HANDLE MENTIONS
        const mentionRegex = /@([\w.]+)/g;
        const matches = commentText.match(mentionRegex);
        if (matches) {
          const mentions = [...new Set(matches.map(m => m.slice(1)))];
          console.log(`📡 [${reqId}] Processing ${mentions.length} mentions`);
          for (const username of mentions) {
            const mentionedUser = await User.findOne({ username });
            if (mentionedUser && String(mentionedUser._id) !== String(currentUserId) && String(mentionedUser._id) !== String(post.author)) {
              await User.findByIdAndUpdate(mentionedUser._id, {
                $push: {
                  notifications: {
                    type: 'mention',
                    from: authorIdObj,
                    fromUsername: req.user.username || currentUser.username || "Someone",
                    fromProfilePic: currentUser?.profilePic || '',
                    post: post._id,
                    text: `Mentioned you: ${commentText.substring(0, 30)}...`,
                    read: false,
                    createdAt: new Date()
                  }
                }
              });

              // 🔥 REAL-TIME NOTIF
              const io = req.app.get('io');
              if (io) {
                io.to(String(mentionedUser._id)).emit('notification.received', {
                  type: 'mention',
                  fromUsername: req.user.username || currentUser.username || "Someone",
                  fromProfilePic: currentUser?.profilePic || '',
                  postId: post._id
                });
              }
            }
          }
        }
      } catch (notifErr) {
        console.warn(`⚠️ [${reqId}] Notification Background Error (Non-Fatal):`, notifErr && notifErr.message);
      }
    };

    // Fire and forget
    runNotifications().catch(e => console.error(`🚨 [${reqId}] runNotifications Critical Fail:`, e));

    console.log(`✅ [${reqId}] Comment DEPLOYED. Returning comments. Count: ${updatedPost?.comments?.length || 0}`);

    const finalData = (updatedPost && updatedPost.comments) ? updatedPost.comments : [];

    // 🔥 REAL-TIME EMIT
    const io = req.app.get('io');
    if (io) {
      io.emit('comment.added', { postId: req.params.id, comments: finalData });
      console.log(`📡 [SOCKET] Broadcast 'comment.added' for post ${req.params.id}`);
    }

    return res.status(200).json(finalData);
  } catch (e) {
    const errorId = req.requestId || 'err-' + Date.now().toString(36);
    console.error(`🚨 COMMENT ERROR [${errorId}] ON POST ${req.params.id}:`, e);
    return res.status(500).json({
      error: "Transmission Failed",
      message: "An internal protocol error occurred while deploying the comment.",
      detail: (e && e.message) || "Unknown error",
      requestId: errorId,
      code: "COM_ERR_500"
    });
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

    // 🔥 REAL-TIME EMIT
    const io = req.app.get('io');
    if (io) {
      io.emit('comment.updated', { postId: req.params.id, comments: post.comments });
    }

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

    // 🔥 REAL-TIME EMIT
    const io = req.app.get('io');
    if (io) {
      io.emit('comment.deleted', { postId: req.params.id, comments: post.comments });
    }

    res.status(200).json("Deleted");
  } catch (e) { res.status(500).json(e); }
});

// CLEAR ALL COMMENTS ON A POST
router.delete("/:id/comments", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json("Post not found");
    const userId = req.user.id || req.user.userId;
    if (post.author.toString() !== userId && req.user.role !== "Founder") {
      return res.status(403).json("Insufficient clearance to clear intelligence logs.");
    }
    post.comments = [];
    await post.save();

    // 🔥 REAL-TIME EMIT
    const io = req.app.get('io');
    if (io) {
      io.emit('comment.deleted', { postId: req.params.id, comments: [] });
    }

    res.status(200).json([]);
  } catch (e) { res.status(500).json(e); }
});

// GET ALL POSTS (With Privacy Filter)
// GET ALL POSTS (With Privacy Filter)
router.get("/", verifyToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const posts = await Post.find()
            .populate('author', 'username profilePic role isPrivate isFollowersOnly followers')
            .populate('repostedBy', 'username profilePic role')
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
    return res.status(200).json(filtered.slice(0, limit));
  } catch (err) {
    console.error("Fetch posts error:", err);
    return res.status(500).json(err);
  }
});

// GET POSTS BY USER ID
router.get("/user/:userId", verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const author = await User.findById(userId).select('isPrivate isFollowersOnly followers role');
        if (!author) return res.status(404).json("Agent not found.");
        const currentUserId = String(req.user?.id || req.user?.userId || '');
        const isFounder = req.user?.role === 'Founder';
        const isOwner = String(userId) === currentUserId;
        const isFollower = Array.isArray(author?.followers) && author.followers.some(id => String(id) === currentUserId);
        const isPrivate = !!(author?.isPrivate || author?.isFollowersOnly);
        if (isPrivate && !isOwner && !isFollower && !isFounder) {
            return res.status(403).json("Intel is encrypted. Clearance restricted to followers.");
        }
        const posts = await Post.find({
            $or: [
                { author: userId },
                { repostedBy: userId }
            ]
        })
            .populate('author', 'username profilePic role isPrivate isFollowersOnly followers')
            .populate('repostedBy', 'username profilePic role')
            .sort({ createdAt: -1 })
            .lean();

    res.status(200).json(posts);
  } catch (err) {
    console.error("Fetch user posts error:", err);
    res.status(500).json(err);
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
        if (duration > 1200) { // Standardized to 20 minutes
          // delete the uploaded file to avoid orphaned large assets
          try { fs.unlinkSync(req.file.path); } catch (e) { console.warn('Failed to cleanup large-upload', e && e.message); }
          return res.status(400).json({ message: 'Intelligence packets exceed 20 minutes. Truncate required.' });
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
      visibility: visibility || 'public',
      isPrivate: author?.isPrivate || false,
      isFollowersOnly: author?.isFollowersOnly || false,
      isStory: req.body.isStory === 'true' || req.body.isStory === true,
      is18Plus: req.body.is18Plus === 'true' || req.body.is18Plus === true
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

          // 🔥 REAL-TIME NOTIF
          const io = req.app.get('io');
          if (io) {
            io.to(String(mentionedUser._id)).emit('notification.received', {
              type: 'mention',
              fromUsername: req.user.username,
              fromProfilePic: author?.profilePic || '',
              postId: savedPost._id
            });
          }
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
  const reqId = req.requestId || 'put-' + Date.now().toString(36);
  console.log(`📡 [${reqId}] UPDATE POST attempt for: ${req.params.id}`);

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.warn(`[${reqId}] Invalid Post ID format: ${req.params.id}`);
      return res.status(400).json({ message: "Invalid Post ID format" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      console.warn(`[${reqId}] Intelligence node not found: ${req.params.id}`);
      return res.status(404).json("Intelligence node not found in sector.");
    }

    const currentUserId = req.user.id || req.user.userId;
    const isFounder = req.user.role === "Founder";
    const isAuthor = String(post.author) === String(currentUserId);

    if (!isAuthor && !isFounder) {
      console.warn(`[${reqId}] Unauthorized edit attempt by ${currentUserId} on post by ${post.author}`);
      return res.status(403).json("Mission Denied: Insufficient clearance level.");
    }

    // Update basic fields
    if (req.body.title !== undefined) post.title = req.body.title;
    if (req.body.desc !== undefined) post.desc = req.body.desc;
    if (req.body.is18Plus !== undefined) {
      post.is18Plus = req.body.is18Plus === 'true' || req.body.is18Plus === true;
    }

    // Explicitly handle visibility with fallback
    if (req.body.visibility) {
      const allowedVisibility = ['public', 'followers', 'private'];
      if (allowedVisibility.includes(req.body.visibility)) {
        post.visibility = req.body.visibility;
      }
    }

    // Handle YouTube/External Links
    if (req.body.videoUrl !== undefined) {
      const maybe = String(req.body.videoUrl || '').trim();
      if (maybe === "") {
        // Only clear if explicitly sent as empty
        post.videoUrl = "";
      } else {
        const ytMatch = /^\s*(?:https?:)?\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/i.exec(maybe);
        if (ytMatch) {
          post.videoUrl = maybe;
          post.thumbnailUrl = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
          post.image = "";
          console.log(`[${reqId}] YouTube link updated: ${ytMatch[1]}`);
        } else {
          post.videoUrl = maybe;
          post.image = "";
          console.log(`[${reqId}] External video link updated`);
        }
      }
    }

    // Handle new media upload (file wins over text-based URLs)
    if (req.file) {
      console.log(`[${reqId}] New media detected: ${req.file.mimetype}`);
      const isVideo = req.file.mimetype.includes("video");
      if (isVideo) {
        // If local upload, probe duration and reject > 10s
        const isLocalUpload = req.file.path && String(req.file.path).startsWith('uploads');
        if (isLocalUpload) {
          try {
            const durMeta = await new Promise((resolve, reject) => {
              ffmpeg.ffprobe(req.file.path, (err, metadata) => err ? reject(err) : resolve(metadata));
            });
            const duration = durMeta?.format?.duration || 0;
            if (duration > 1200) { // Keep consistent with 20min limit in frontend
              try { fs.unlinkSync(req.file.path); } catch (e) { }
              return res.status(400).json({ message: 'Intelligence packets exceed 20 minutes. Truncate required.' });
            }
          } catch (probeErr) {
            console.warn(`[${reqId}] Probe failed, proceeding with caution:`, probeErr.message);
          }
        }
        post.videoUrl = req.file.path;
        post.image = "";
      } else {
        post.image = req.file.path;
        post.videoUrl = "";
      }
    }

    console.log(`[${reqId}] Target locked. Saving intelligence...`);
    const updatedPost = await post.save();
    console.log(`✅ [${reqId}] Intelligence SYNCHRONIZED: ${post._id}`);
    res.status(200).json(updatedPost);

  } catch (e) {
    console.error(`🚨 [${reqId}] CRITICAL INTELLIGENCE CORRUPTION:`, e);
    res.status(500).json({
      error: "Neural Link Severed",
      message: "An internal protocol error occurred during intelligence update.",
      detail: e.message || "Unknown anomaly",
      requestId: reqId,
      code: "POST_EDIT_500"
    });
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

    // 🔥 REAL-TIME EMIT
    const io = req.app.get('io');
    if (io) {
      io.emit('post.deleted', { postId: req.params.id });
    }

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
      const isFounder = req.user.role === 'Founder' || req.user.role === 'Admin';

      if (!postAuthor) {
        if (post.visibility === 'public') filteredPosts.push(post);
        continue;
      }

      // Own posts or Admin bypass
      if (post.author.toString() === currentUserId || isFounder) {
        filteredPosts.push(post);
        continue;
      }

      // Privacy check (Unified)
      const isPrivate = postAuthor.isPrivate || postAuthor.isFollowersOnly || post.isPrivate || post.isFollowersOnly;
      if (isPrivate) {
        if (postAuthor.followers?.some(id => String(id) === currentUserId)) {
          filteredPosts.push(post);
        }
        continue;
      }

      filteredPosts.push(post);
    }

    res.status(200).json(filteredPosts);
  } catch (e) {
    console.error("Feed error:", e);
    res.status(500).json(e);
  }
});

// GET SINGLE POST (With Privacy Filter)
router.get("/:id", verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('author', 'username profilePic role isPrivate isFollowersOnly followers').populate('repostedBy', 'username profilePic role');
    if (!post) return res.status(404).json("Post not found");

    const currentUserId = req.user.id || req.user.userId;

    // Check privacy
    const isOwner = String(post.author?._id || post.author) === String(currentUserId);
    const isPrivate = post.isPrivate || post.isFollowersOnly || post.author?.isPrivate || post.author?.isFollowersOnly;
    const isFollower = post.author?.followers?.some(id => String(id) === String(currentUserId));

    if (isPrivate && !isOwner && !isFollower && req.user.role !== 'Founder') {
      return res.status(403).json("This intel is encrypted. Access restricted to authorized followers.");
    }

    res.status(200).json(post);
  } catch (e) {
    console.error("Fetch single post error:", e);
    res.status(500).json(e);
  }
});

// CATCH-ALL FOR DEBUGGING (404 for API, but identifying the cause)
router.use((req, res) => {
  const timestamp = new Date().toLocaleTimeString();
  console.warn(`❌ [ROUTER 404] No match for: ${req.method} ${req.originalUrl} [${timestamp}]`);

  // Return consistent 404 for unmatched API routes
  res.status(404).json({
    message: `Endpoint ${req.method} ${req.url} not found in Intel Router.`,
    tip: "If this should be a POST, check why the browser or client sent a GET.",
    debug: {
      method: req.method,
      url: req.url,
      params: req.params,
      headers: {
        'content-type': req.headers['content-type'],
        'auth': req.headers.authorization ? 'present' : 'missing'
      }
    }
  });
});

export default router;
