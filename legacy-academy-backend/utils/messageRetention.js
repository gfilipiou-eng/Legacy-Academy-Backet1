import Message, { MESSAGE_TTL_MS } from "../models/Message.js";
import { deleteCloudinaryFiles } from "./cloudinaryCleanup.js";

export const MESSAGE_RETENTION_SWEEP_MS = 5 * 60 * 1000;

const buildExpiredMessageQuery = (query = {}) => {
    const now = new Date();
    const legacyCutoff = new Date(now.getTime() - MESSAGE_TTL_MS);
    const retentionQuery = {
        isLocked: { $ne: true },
        $or: [
            { expiresAt: { $lte: now } },
            { expiresAt: { $exists: false }, createdAt: { $lte: legacyCutoff } },
            { expiresAt: null, createdAt: { $lte: legacyCutoff } },
        ],
    };

    if (Object.keys(query).length === 0) {
        return retentionQuery;
    }

    return {
        $and: [query, retentionQuery],
    };
};

export const cleanupExpiredMessages = async ({ app, io, query = {} } = {}) => {
    const expiredMessages = await Message.find(buildExpiredMessageQuery(query));
    if (expiredMessages.length === 0) return [];

    const mediaToDelete = [];
    expiredMessages.forEach((message) => {
        if (message.audio) mediaToDelete.push(message.audio);
        if (message.image) mediaToDelete.push(message.image);
    });

    await deleteCloudinaryFiles(mediaToDelete).catch(() => { });
    await Message.deleteMany({ _id: { $in: expiredMessages.map((message) => message._id) } });

    const socketServer = io || app?.get?.("io");
    if (socketServer) {
        expiredMessages.forEach((message) => {
            socketServer.to(String(message.sender)).emit("message.deleted", {
                messageId: message._id,
                conversationWith: message.recipient,
            });
            socketServer.to(String(message.recipient)).emit("message.deleted", {
                messageId: message._id,
                conversationWith: message.sender,
            });
        });
    }

    return expiredMessages;
};

export const cleanupSnapchatMessages = async ({ app, io, currentUserId, chatUserId }) => {
    // Find messages between these two users that are read and not locked
    const messagesToDelete = await Message.find({
        isLocked: { $ne: true },
        isRead: true,
        $or: [
            { sender: currentUserId, recipient: chatUserId },
            { sender: chatUserId, recipient: currentUserId }
        ]
    });

    if (messagesToDelete.length === 0) return [];

    const mediaToDelete = [];
    messagesToDelete.forEach((message) => {
        if (message.audio) mediaToDelete.push(message.audio);
        if (message.image) mediaToDelete.push(message.image);
    });

    await deleteCloudinaryFiles(mediaToDelete).catch(() => { });
    await Message.deleteMany({ _id: { $in: messagesToDelete.map((m) => m._id) } });

    const socketServer = io || app?.get?.("io");
    if (socketServer) {
        const messageIds = messagesToDelete.map(m => m._id);
        socketServer.to(String(currentUserId)).emit("messages.cleared", { messageIds });
        socketServer.to(String(chatUserId)).emit("messages.cleared", { messageIds });
    }

    return messagesToDelete;
};
