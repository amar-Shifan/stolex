const express = require('express');
const router = express.Router();
const controller = require('../controller/userControllers/authController');
const productController = require('../controller/userControllers/productController');
const userController = require('../controller/userControllers/userController');
const middleware = require('../middlewares/user-middleware');
const passport = require('passport');
const upload = require('../middlewares/profile');
const multer = require('multer');
const { MulterError } = require('multer');

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

router.get('/products', productController.getProducts);
router.get('/product',(req,res)=>res.render('user/topwear'))
// OTP Verification Page
router.get('/verify',controller.getOtp);

router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))
router.get('/google/callback',passport.authenticate('google',{failureRedirect:'/register'}),(req,res)=>{
    res.redirect('/')
})

router.get('/user_profile', userController.getProfile);

router.get('/productDetails/:id',productController.getProductDetail);

// POST Routes
router.post('/otp-verification', controller.otpVerification);
router.post('/user-login', controller.userLogin);
router.post('/register', controller.insertUser);
router.post('/resend-otp', controller.resendOtp);


router.get('/isAuth' , middleware.isAuthenticated)
router.post('/addProfile', upload.single('profile'), userController.addProfile);
router.use((err, req, res ,next)=>{
    if(err instanceof multer.MulterError){
        return res.status(400).json({success : false  , message : err.message})
    }else if (err){
        return res.status(500).json({success:false , message :'Something went wrong!'})
    }
    next();
})

router.patch('/updateDetails' , userController.updateUser);
router.post('/addAddress' , userController.addAddress);
router.patch('/changePassword' , userController.changePassword)
router.post('/verifyEmail' , userController.verifyEmail)
router.get('/resetPassword' , userController.getResetPassword);
router.post('/resetPassword' , userController.resetPassword)


router.get('/cart' , )


module.exports = router;
