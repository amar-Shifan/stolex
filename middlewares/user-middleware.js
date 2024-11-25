

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


module.exports = {isAuthenticated , globalVarsMiddleware}
