const express = require('express')
const router = express.Router();
const controller = require('../controller/adminControllers/authController');
const userController = require('../controller/adminControllers/userManagementController');
const categoryController = require('../controller/adminControllers/categoryController');
const env = require('../utils/env_var')


router.get('/',(req,res)=>{
    res.render('admin/admin');
})
router.get('/login',(req,res)=>{
    res.render('admin/adminLogin');
})
router.get('/products',(req,res)=>{
    res.render("admin/products");
})
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

// Update category
router.patch('/updateCategory', categoryController.updateCategory);


module.exports = router
