function isAuthenticated(req, res, next) {
    if (req.session.isAuthenticated) {
      return next();  
    } else {
      return res.redirect('/admin/login');  
    }
}

function preventAccessIfAuthenticated(req, res, next) {
    if (req.session.admin) {
        return res.redirect('/admin'); 
    }
    next();
}

module.exports = {isAuthenticated, preventAccessIfAuthenticated}