import Goal from '../models/Goal.js';

// CRUD endpoints for goals

// Get all goals for a user
export const getGoals = async (req, res) => {
    try {
        const goals = await Goal.find({ userId: req.user._id });
        res.json(goals);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch goals' });
    }
};

// Create a new goal
export const createGoal = async (req, res) => {
    try {
        const goal = await Goal.create({
            ...req.body,
            userId: req.user._id,
        });
        res.status(201).json(goal);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create goal' });
    }
};

// Update a goal
export const updateGoal = async (req, res) => {
    try {
        const goal = await Goal.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { returnDocument: 'after' }
        );
        if (!goal) return res.status(404).json({ error: 'Goal not found' });
        res.json(goal);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update goal' });
    }
};

// Delete a goal
export const deleteGoal = async (req, res) => {
    try {
        const goal = await Goal.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });
        if (!goal) return res.status(404).json({ error: 'Goal not found' });
        res.json({ message: 'Goal deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete goal' });
    }
};