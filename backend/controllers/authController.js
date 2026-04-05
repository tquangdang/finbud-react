import User from "../models/User.js";
import passport from 'passport';

// Signup controller
export const signup = async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // If user does not exist, create new user
        const newUser = await new User({
            email,
            accountData: {
                username: email,
                password,
                priviledge: "user",
            },
            identityData: {
                firstName,
                lastName,
                displayName: `${firstName} ${lastName}`,
            },
        }).save();

        // Remove password before sending response
        const userResponse = newUser.toObject();
        delete userResponse.accountData.password;

        res.status(201).json(userResponse);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Email already registered" });
        }
        res.status(500).json({ error: 'Registration failed' });
    }
};

// Login controller
export const login = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return res.status(500).json({ error: 'Login failed' });
        if (!user) return res.status(401).json({ error: info.message });

        // Log in the user
        req.logIn(user, (err) => {
            if (err) return res.status(500).json({ error: 'Login failed' });
            const userResponse = user.toObject();
            delete userResponse.accountData.password;
            res.json(userResponse);
        });
    })(req, res, next);
};

// Logout controller
export const logout = (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ error: 'Logout failed' });
        req.session.destroy();
        res.json({ message: 'Logged out' });
    });
};

// Get current user controller
export const getCurrentUser = (req, res) => {
    if (req.isAuthenticated()) {
        const userResponse = req.user.toObject();
        delete userResponse.accountData.password;
        res.json({ isAuthenticated: true, user: userResponse });
    } else {
        res.status(401).json({ isAuthenticated: false });
    }
};

// Google authentication controller
// This function is used to authenticate the user with Google
// It redirects the user to the Google login page, and then the user is 
// redirected to the callback URL
export const googleAuth = passport.authenticate('google', {
    scope: ['email', 'profile'],
  });
  
  export const googleCallback = (req, res, next) => {
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    passport.authenticate('google', (err, user) => {
      if (err || !user) {
        return res.redirect(`${frontendURL}/login?error=auth_failed`);
      }
      req.logIn(user, (err) => {
        if (err) return res.redirect(`${frontendURL}/login?error=auth_failed`);
        res.redirect(frontendURL);
      });
    })(req, res, next);
  };