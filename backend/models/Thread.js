import mongoose from 'mongoose';

// define Thread schema
const threadSchema = new mongoose.Schema({
    title: {
        type: String,
        default: 'New Chat',
    },
    creationDate: {
        type: Date,
        default: Date.now,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
});

export default mongoose.model('Thread', threadSchema);