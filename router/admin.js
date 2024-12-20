const express = require('express')
const router = express.Router();
const controller = require('../controller/adminControllers/authController');
const userController = require('../controller/adminControllers/userManagementController');
const categoryController = require('../controller/adminControllers/categoryController');
const productController = require('../controller/adminControllers/productController');
const ordersController = require('../controller/adminControllers/orderController')
const offerController = require('../controller/adminControllers/offerController')
const couponController = require('../controller/adminControllers/couponController')
const graphController = require('../controller/adminControllers/graphController')
const env = require('../utils/env_var')
const upload = require('../middlewares/upload')
const { handleProductImages } = require('../middlewares/delete');
const { isAuthenticated , preventAccessIfAuthenticated} = require('../middlewares/admin-middleware');


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
router.post('/addBrand',isAuthenticated , categoryController.addBrand)
router.get('/categories', isAuthenticated, categoryController.getMainCategories);
router.patch('/:id' , isAuthenticated , categoryController.updateCategory);

router.get('/add-products', isAuthenticated, productController.getAddProduct);
router.get('/update-product/:id', isAuthenticated, productController.getUpdate);
router.post('/add-products', isAuthenticated, upload.array('images', 5), productController.addProduct);
router.post('/updateProduct/:id', isAuthenticated, upload.array('images'), handleProductImages, productController.updateProduct);
router.post('/getBrands' , productController.getBrands);

router.get('/stock' , productController.getStocks)
router.post('/add-stock' , productController.addStock)

router.get('/orders' ,ordersController.getOrders )
router.get('/orders/:id' , ordersController.getOrderDetails)
router.patch('/orders/update-status/:id' , ordersController.changeStatus)

router.get('/login',preventAccessIfAuthenticated, controller.renderLogin);
router.post('/verifyLogin', controller.adminLogin);


// Route to fetch details of a specific category
router.get('/categories/:id', productController.brandFetch);
  

router.get('/offers' , offerController.getOffers)
router.post('/offers/create' , offerController.createOffer)
router.get('/offers/categories' , offerController.getCategory)
router.get('/offers/products' , offerController.getProducts)
router.delete('/offers/category/:id/delete', offerController.deleteCategoryOffer);
router.delete('/offers/product/:id/delete', offerController.deleteProductOffer);

router.get('/coupons' , couponController.getCoupon);
router.post('/coupons/create' , couponController.createCoupon)
router.delete('/coupons/:id' , couponController.deleteCoupon)

router.post('/orders/:orderId/approve-return', ordersController.approveReturn);
router.post('/orders/:orderId/items/:itemId/approve-return', ordersController.approveReturn);

router.post('/orders/:orderId/reject-return', ordersController.rejectReturn);
router.post('/orders/:orderId/items/:itemId/reject-return', ordersController.rejectReturn);

router.get('/salesReport' , ordersController.getSalesReport)
router.get('/salesReport/pdf', ordersController.generateSalesReportPDF);
router.get('/salesReport/excel', ordersController.generateSalesReportExcel);        

router.get('/chart-data' , graphController.getChartData)




module.exports = router
