const express = require('express')
const router = express.Router();
const controller = require('../controller/adminControllers/authController');
const userController = require('../controller/adminControllers/userManagementController');
const categoryController = require('../controller/adminControllers/categoryController');
const productController = require('../controller/adminControllers/productController');
const env = require('../utils/env_var')
const upload = require('../middlewares/upload')
const { handleProductImages } = require('../middlewares/delete');
const { isAuthenticated , preventAccessIfAuthenticated} = require('../middlewares/admin-middleware');


// Apply middleware only to routes that need admin access
router.get('/', isAuthenticated, controller.renderHome);
router.get('/products', isAuthenticated, productController.getProducts);
router.get('/add-category', isAuthenticated, (req, res) => {
    res.render('admin/add-category');
});
router.get('/users', isAuthenticated, userController.listUsers);
router.get('/logout', isAuthenticated, controller.logout);
router.get('/search', isAuthenticated, userController.searchUsers);
router.patch('/users/toggleStatus/:userId', isAuthenticated, userController.toggleStatus);
router.post('/createCategory', isAuthenticated, categoryController.createCategory);
router.get('/categories', isAuthenticated, categoryController.getMainCategories);
router.patch('/:id' , isAuthenticated , categoryController.updateCategory);
router.get('/add-products', isAuthenticated, productController.getAddProduct);
router.get('/update-product/:id', isAuthenticated, productController.getUpdate);
router.post('/add-products', isAuthenticated, upload.array('images', 5), productController.addProduct);
router.post('/updateProduct/:id', isAuthenticated, upload.array('images'), handleProductImages, productController.updateProduct);


router.get('/login',preventAccessIfAuthenticated, controller.renderLogin);
router.post('/verifyLogin', controller.adminLogin);


module.exports = router
