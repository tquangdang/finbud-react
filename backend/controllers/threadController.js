import Thread from '../models/Thread.js';
import Chat from '../models/Chat.js';

// Get all threads for a user, sorted by creation date (newest first)
export const getThreads = async (req, res) => {
    try {
        // find({ userId: req.user._id }):  Restricts results to threads owned by the logged-in user
        // .sort({ creationDate: -1 }) — Descending date order = newest first
        const threads = await Thread.find({ userId: req.user._id }).sort({ creationDate: -1 });
        res.json(threads);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch threads' });
    }
};

//  Create a thread with a title (default "New Chat") and the user's ID
export const createThread = async (req, res) => {
    try {
        const thread = await Thread.create({
            title: req.body.title || 'New Chat',
            userId: req.user._id,
        });
        res.status(201).json(thread);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create thread' });
    }
};

export const updateThread = async (req, res) => {
    try {
        const thread = await Thread.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { returnDocument: 'after' }
        );
        if (!thread) return res.status(404).json({ error: 'Thread not found' });
        res.json(thread);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update thread' });
    }
};

// delete a thread, but only if it belongs to the logged-in user
export const deleteThread = async (req, res) => {
    try {
        const thread = await Thread.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });
        if (!thread) return res.status(404).json({ error: 'Thread not found' });
        // Only delete chats if the thread was actually deleted
        await Chat.deleteMany({ threadId: req.params.id });
        res.json({ message: 'Thread deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete thread' });
    }
};