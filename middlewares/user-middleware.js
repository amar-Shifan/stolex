
const User = require('../model/userSchema');

const isAuthenticated = (req, res) => {
    if (req.session.userId) {        
        return res.status(200).json({success:true })
    } else {
        return res.status(401).json({success:false })
    }
};

// Middleware to handle global variables
const globalVarsMiddleware = (req, res, next) => {
    res.locals.message = req.query.message || null;
    res.locals.redirect = req.query.redirect || false; 
    res.locals.redirectUrl = req.query.redirectUrl || ''; 
    next();
};

const isAuthen = async (req, res, next) => {
  try {
    const userId = req.session.userId;

    // Check if userId exists in the session
    if (!userId) {
      return res.redirect('/user-login');
    }

    // Query the database for the active user
    const user = await User.findOne({ _id: userId, block: false });

    // If user exists, is not blocked, and is active, proceed to the next middleware
    if (user) {
      return next();
    }

    // If user is blocked, clear the session and provide a message
    req.session.destroy((err) => {
      if (err) {
        console.error('Error clearing session:', err);
      }
    });

    // Redirect to login page with blocked message
    return res.render('user/error',{message:'Your account is blocked. Please contact support.'})

  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).send('Internal Server Error');
  }
};

function preventAccessIfAuthenticated(req, res, next) {
    if (req.session.userId) {
        return res.redirect('/'); 
    }
    next();
}

module.exports = {isAuthenticated , globalVarsMiddleware , preventAccessIfAuthenticated ,isAuthen}
