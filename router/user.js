const express = require('express');
const router = express.Router();
const controller = require('../controller/userControllers/authController');
const productController = require('../controller/userControllers/productController');
const passport = require('passport');

// Routes
router.get('/', controller.getHomePage);

// Login Page
router.get('/user-login', (req, res) => {
    const message = req.session.msg;
    req.session.msg = null; 
    res.render('user/login', { message });
});

// Registration Page
router.get('/register', (req, res) => {
    res.render('user/signup');
});

// OTP Verification Page
router.get('/verify', (req, res) => {
    const message = req.session.message || null;
    req.session.message = null;

    const error = req.session.error || null;
    req.session.error = null;

    res.render('user/otp-verification', { message, error });
});

router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))
router.get('/google/callback',passport.authenticate('google',{failureRedirect:'/register'}),(req,res)=>{
    res.redirect('/')
})

router.get('/productDetails/:id',productController.getProductDetail);

// POST Routes
router.post('/otp-verification', controller.otpVerification);
router.post('/user-login', controller.userLogin);
router.post('/register', controller.insertUser);
router.post('/resend-otp', controller.resendOtp);

module.exports = router;
