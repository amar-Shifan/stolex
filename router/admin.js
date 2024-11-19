const express = require('express')
const router = express.Router();
const controller = require('../controller/adminControllers/authController');
const userController = require('../controller/adminControllers/userManagementController');
const categoryController = require('../controller/adminControllers/categoryController');
const productController = require('../controller/adminControllers/productController');
const env = require('../utils/env_var')
const upload = require('../middlewares/upload')
const Product = require('../model/productSchema')


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

// router.get('/new',async (req,res)=>{
//     const products = await Product.find({})
//     console.log(products);
//     res.render('admin/update-product',{product:products})
// })

// Update category
router.patch('/updateCategory', categoryController.updateCategory);

router.get('/add-products',productController.getAddProduct);
router.get('/update-product/:id',productController.getUpdate);
router.post('/update-product/:id',productController.updateProduct);

router.post('/add-products', upload.array('images', 5), productController.addProduct);
router.patch('/updateProduct/:id', upload.array('images', 5), productController.updateProduct);



module.exports = router
