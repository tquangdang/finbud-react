// Middleware to check if user is authenticated
export const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ error: 'Please log in' });
  };