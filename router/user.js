const express = require('express');
const router = express.Router();
const controller = require('../controller/userControllers/authController');
const productController = require('../controller/userControllers/productController');
const userController = require('../controller/userControllers/userController');
const cartController = require('../controller/userControllers/cartController');
const orderController = require('../controller/userControllers/orderController')
const middleware = require('../middlewares/user-middleware');
const passport = require('passport');
const upload = require('../middlewares/profile');
const multer = require('multer');
const { MulterError } = require('multer');

// Routes
router.get('/', controller.getHomePage);
router.get('/logout' , controller.logout);

// Login Page
router.get('/user-login',middleware.preventAccessIfAuthenticated, (req, res) => {
    const message = req.session.msg;
    req.session.msg = null; 
    res.render('user/login', { message });
});

router.get('/register', middleware.preventAccessIfAuthenticated, controller.getSignup);

router.get('/products', productController.getProducts);
router.get('/product',(req,res)=>res.render('user/topwear'))
// OTP Verification Page
router.get('/verify',middleware.preventAccessIfAuthenticated ,controller.getOtp)

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


router.get('/isAuth' , middleware.isAuthenticated);
router.post('/addProfile', upload.single('profile'), userController.addProfile);

//handling multer error
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
router.patch('/address/edit',userController.editAddress)
router.delete('/address/delete/:id' , userController.deleteAddress)
router.patch('/changePassword' , userController.changePassword)
router.post('/verifyEmail' , userController.verifyEmail)
router.get('/resetPassword' , userController.getResetPassword);
router.post('/resetPassword' , userController.resetPassword)
router.get('/emailEnter' , userController.emailEnter)

router.get('/wishlist' , userController.getWishlist)
router.post('/wishlist/add' ,userController.addToWishlist );
router.delete('/wishlist/remove/:productId' ,userController.remove );


router.get('/cart' ,middleware.isAuthen, cartController.getCart )
router.post('/cart/add', cartController.addToCart);
router.delete('/cart/remove/:id' , cartController.remove);
router.patch('/cart/update-quantity/:id' , cartController.updateQuantity)


router.get('/checkout', orderController.getCheckout )
router.post('/checkout/process' , orderController.checkoutProcess)

router.get('/cart/success' , orderController.getSuccess)
router.get('/orders' , orderController.getOrders)
router.get('/order/:orderId' , orderController.details);
router.get('/order' , (req,res)=>res.render('user/order-view-details'))
router.patch('/orders/cancel' , orderController.cancelOrder);


module.exports = router;
