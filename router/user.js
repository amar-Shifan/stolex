const express = require('express');
const router = express.Router();
const controller = require('../controller/userControllers/authController');
const productController = require('../controller/userControllers/productController');
const userController = require('../controller/userControllers/userController');
const cartController = require('../controller/userControllers/cartController');
const orderController = require('../controller/userControllers/orderController')
const couponController = require('../controller/userControllers/couponController')
const middleware = require('../middlewares/user-middleware');
const passport = require('passport');
const upload = require('../middlewares/profile');
const multer = require('multer');
const { MulterError } = require('multer');

// Authentication routes
router.get('/', controller.getHomePage);
router.get('/logout' , controller.logout);
router.get('/user-login',middleware.preventAccessIfAuthenticated, controller.getLogin);
router.get('/register', middleware.preventAccessIfAuthenticated, controller.getSignup);
router.get('/verify',middleware.preventAccessIfAuthenticated ,controller.getOtp)
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))
router.get('/google/callback',passport.authenticate('google',{failureRedirect:'/register'}),(req,res)=>{
    req.session.userId = req.user._id
    res.redirect('/')
})

router.post('/otp-verification', controller.otpVerification);
router.post('/user-login', controller.userLogin);
router.post('/register', controller.insertUser);
router.post('/resend-otp', controller.resendOtp);

//User routes
router.get('/user_profile', middleware.isAuthen , userController.getProfile);
router.get('/productDetails/:id', middleware.isAuthen , productController.getProductDetail);

router.get('/shop', productController.getShop)

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
router.post('/cart/add',middleware.isAuthen, cartController.addToCart);
router.delete('/cart/remove/:id' ,middleware.isAuthen, cartController.remove);
router.patch('/cart/update-quantity/:id' ,middleware.isAuthen, cartController.updateQuantity)


router.get('/checkout',middleware.isAuthen, orderController.getCheckout )
router.post('/checkout/process' ,middleware.isAuthen, orderController.checkoutProcess);
router.post('/payment/verify' ,middleware.isAuthen, orderController.verifyPayment);

router.get('/cart/success' , middleware.isAuthen , orderController.getSuccess);
router.get('/order/:id/invoice',orderController.invoiceDownload);
router.get('/orders' , middleware.isAuthen ,orderController.getOrders)
router.get('/order/:orderId' , middleware.isAuthen , orderController.details);
router.get('/order' , (req,res)=>res.render('user/order-view-details'))
router.patch('/orders/cancel' ,middleware.isAuthen, orderController.cancelOrder);
router.patch('/orders/return' , middleware.isAuthen, orderController.returnOrder);

router.post('/apply-coupon', couponController.applyCoupon);
router.get('/available-coupons' , couponController.availableCoupon);
router.post('/remove-coupon', couponController.removeCoupon);

router.get('/wallet' , middleware.isAuthen ,orderController.getWallet);

router.get('/isAuth' , middleware.isAuthenticated);
router.post('/addProfile', upload.single('profile'), userController.addProfile);

router.post('/payment/failure', orderController.paymentFailure);
router.post('/repay/order', orderController.repayOrder);

//handling multer error
router.use((err, req, res ,next)=>{
    if(err instanceof multer.MulterError){
        return res.status(400).json({success : false  , message : err.message})
    }else if (err){
        return res.status(500).json({success:false , message :'Something went wrong!'})
    }
    next();
})




module.exports = router;
