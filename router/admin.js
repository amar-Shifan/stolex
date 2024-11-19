const express = require('express')
const router = express.Router();
const controller = require('../controller/adminControllers/authController');
const userController = require('../controller/adminControllers/userManagementController');
const categoryController = require('../controller/adminControllers/categoryController');
const productController = require('../controller/adminControllers/productController');
const env = require('../utils/env_var')
const upload = require('../middlewares/upload')
const { handleProductImages } = require('../middlewares/delete');


router.get('/',(req,res)=>{
    res.render('admin/admin');
})
router.get('/login',(req,res)=>{
    res.render('admin/adminLogin');
})
router.get('/products', productController.getProducts)
// router.get('/categories',(req,res)=>{
//     res.render("admin/category");
// })
router.get('/add-category',(req,res)=>{
    res.render('admin/add-category');
})
router.get("/users",userController.listUsers);
router.get('/logout',controller.logout);
router.get(`/search`,userController.searchUsers)

router.post('/verifyLogin', controller.adminLogin);
router.post('/addUser', userController.addUser);

router.patch('/users/toggleStatus/:userId', userController.toggleStatus);

router.post('/createCategory', categoryController.createCategory);

// Get all main categories
router.get('/categories', categoryController.getMainCategories);

router.get('/add-products',productController.getAddProduct);
router.get('/update-product/:id',productController.getUpdate);

router.post('/add-products', upload.array('images', 5), productController.addProduct);
router.post('/updateProduct/:id', 
    upload.array('images'),    // Middleware to handle new images
    handleProductImages,       // Middleware to process images
    productController.updateProduct // Controller function to update the product
);



module.exports = router
