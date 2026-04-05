import Chat from '../models/Chat.js';
import Thread from '../models/Thread.js';
import { streamAIResponse } from '../services/aiService.js';
import { marked } from 'marked';

export const getChats = async (req, res) => {
    try {
        const thread = await Thread.findOne({
            _id: req.params.threadId,
            userId: req.user._id,
        });
        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }
        const chats = await Chat.find({ threadId: thread._id });
        res.json(chats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chats' });
    }
};

export const createChat = async (req, res) => {
    try {
        const thread = await Thread.findOne({
            _id: req.params.threadId,
            userId: req.user._id,
        });
        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        const previousChats = await Chat.find({ threadId: thread._id }).sort({
            creationDate: 1,
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        let fullResponse = '';

        for await (const event of streamAIResponse(req.body.prompt, previousChats)) {
            if (event.type === 'token') {
                fullResponse += event.content;
            }
            res.write(`data: ${JSON.stringify(event)}\n\n`);
        }

        const htmlResponse = marked(fullResponse);

        if (thread.title === 'New Chat') {
            thread.title = req.body.prompt.slice(0, 100);
            await thread.save();
        }

        const chat = await Chat.create({
            prompt: req.body.prompt,
            response: [fullResponse],
            htmlContent: [htmlResponse],
            threadId: thread._id,
        });

        res.write(`data: ${JSON.stringify({ type: 'done', chat })}\n\n`);
        res.end();
    } catch (error) {
        console.error('Chat error:', error);
        if (res.headersSent) {
            res.write(
                `data: ${JSON.stringify({ type: 'error', message: 'Failed to get AI response' })}\n\n`
            );
            res.end();
        } else {
            res.status(500).json({ error: 'Failed to get AI response' });
        }
    }
};
