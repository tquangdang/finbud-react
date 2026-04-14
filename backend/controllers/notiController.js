import Noti from '../models/Noti.js';
import { getIO } from '../lib/socket.js';

// This function is used to emit a notification update to the user
function emitNotiUpdate(userId) {
    // Get the socket.io instance
    const io = getIO();
    // Emit the notification update to the user
    // The user is identified by the userId
    if (io) io.to(`user:${userId}`).emit('noti:update');
}

export const getNotis = async (req, res) => {
    try {
        const notis = await Noti.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(notis);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

export const createNoti = async (req, res) => {
    try {
        const noti = await Noti.create({
            ...req.body,
            userId: req.user._id,
        });
        emitNotiUpdate(req.user._id.toString());
        res.status(201).json(noti);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create notification' });
    }
};

export const updateNoti = async (req, res) => {
    try {
        const noti = await Noti.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { isRead: true },
            { returnDocument: 'after' }
        );
        if (!noti) return res.status(404).json({ error: 'Notification not found' });
        emitNotiUpdate(req.user._id.toString());
        res.json(noti);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notification' });
    }
};

export const deleteNoti = async (req, res) => {
    try {
        const noti = await Noti.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });
        if (!noti) return res.status(404).json({ error: 'Notification not found' });
        emitNotiUpdate(req.user._id.toString());
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete notification' });
    }
};
