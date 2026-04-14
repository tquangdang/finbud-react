import User from '../models/User.js';

// return the logged-in user's data (just req.user, strip password)
export const getProfile = (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        const userResponse = typeof user.toObject === 'function'
            ? user.toObject()
            : { ...user };
        delete userResponse.accountData?.password;
        res.json(userResponse);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

// update the logged-in user's identityData (firstName, lastName, displayName, profilePicture)
export const updateProfile = async (req, res) => {
    try {
        const updates = {};
        const { firstName, lastName, displayName, profilePicture } = req.body;
        if (firstName) updates['identityData.firstName'] = firstName;
        if (lastName) updates['identityData.lastName'] = lastName;
        if (displayName) updates['identityData.displayName'] = displayName;
        if (profilePicture) updates['identityData.profilePicture'] = profilePicture;

        // Use $set so only the fields that are provided are updated
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { returnDocument: 'after' }
        );
        const userResponse = user.toObject();
        delete userResponse.accountData.password;
        res.json(userResponse);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
};