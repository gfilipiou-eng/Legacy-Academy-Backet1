import express from "express";
import Post from "../models/Post.js";
import User from "../models/User.js";
import upload from "../middleware/upload.js";
import { verifyToken } from "../middleware/auth.js";

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
router.post("/:id/comment", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json("Post not found");

    const currentUserId = req.user.id || req.user.userId;
    const currentUser = await User.findById(currentUserId);

    const newComment = {
      text: req.body.text,
      authorName: req.user.username,
      authorId: currentUserId,
      authorProfilePic: currentUser?.profilePic || '',
      createdAt: new Date()
    };
    post.comments.push(newComment);
    await post.save();

    // Send notification to post author if commenter is not the author
    if (post.author.toString() !== currentUserId) {
      await User.findByIdAndUpdate(post.author, {
        $push: {
          notifications: {
            type: 'comment',
            from: currentUserId,
            fromUsername: req.user.username,
            fromProfilePic: currentUser?.profilePic || '',
            post: post._id,
            text: req.body.text.substring(0, 50),
            read: false,
            createdAt: new Date()
          }
        }
      });
    }

    // HANDLE MENTIONS IN COMMENTS
    const mentionRegex = /@([\w.]+)/g;
    const mentions = [...new Set((req.body.text.match(mentionRegex) || []).map(m => m.slice(1)))];

    for (const username of mentions) {
      const mentionedUser = await User.findOne({ username });
      if (mentionedUser && mentionedUser._id.toString() !== currentUserId && mentionedUser._id.toString() !== post.author.toString()) {
        await mentionedUser.updateOne({
          $push: {
            notifications: {
              type: 'mention',
              from: currentUserId,
              fromUsername: req.user.username,
              fromProfilePic: currentUser?.profilePic || '',
              post: post._id,
              text: `Mentioned you in a comment: ${req.body.text.substring(0, 30)}...`,
              read: false,
              createdAt: new Date()
            }
          }
        });
      }
    }

    res.status(200).json(post.comments);
  } catch (e) {
    console.error("Add comment error:", e);
    res.status(500).json(e);
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
    const signature = `${req.user.id || req.user.userId}::${(desc||description||'').trim()}::${(videoUrl||'').trim()}::${req.file?.size || 0}`;
    const now = Date.now();
    const prev = _recentCreates.get(signature);
    if (prev && (now - prev) < 5000) {
      // attempt to find a recent matching post in DB to return instead of creating a duplicate
      const recent = await Post.findOne({ author: req.user.id || req.user.userId, desc: (desc||description||'').trim() }).sort({ createdAt: -1 }).limit(1);
      if (recent && (now - new Date(recent.createdAt).getTime()) < 10000) {
        console.log("Duplicate submission detected - returning recent post", recent._id);
        return res.status(200).json(recent);
      }
      return res.status(409).json({ message: "Duplicate submission ignored" });
    }
    _recentCreates.set(signature, now);
    // garbage collect key after short time
    setTimeout(() => _recentCreates.delete(signature), 15_000);

    const newPost = new Post({
      title: title || '',
      desc: desc || description || '',
      image: (!isFileVideo && req.file) ? req.file.path || "" : "",
      videoUrl: isFileVideo ? (req.file?.path || "") : (isYouTube ? videoUrl.trim() : (videoUrl || "")),
      thumbnailUrl: isYouTube ? `https://img.youtube.com/vi/${(videoUrl||'').match(/^\s*(?:https?:)?\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/i)?.[1]}/hqdefault.jpg` : undefined,
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
