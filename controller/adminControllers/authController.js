// Authentication Controllers
const bcrypt = require('bcrypt')
const Admin = require('../../model/adminSchema');

const Order = require('../../model/ordersSchema'); // Adjust the path based on your project structure

// Render Home page Controller 
const renderHome = async (req, res) => {
    try {
        // Fetch all orders
        const orders = await Order.find().populate('userId').populate('items.productId').populate('shippingAddress');

        // Calculate summary data
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalOrders = orders.length;
        const totalProducts = orders.reduce((sum, order) => sum + order.items.length, 0);

        // Replace with your logic to calculate monthly earnings
        const monthlyEarnings = orders
            .filter(order => new Date(order.createdAt).getMonth() === new Date().getMonth())
            .reduce((sum, order) => sum + order.totalAmount, 0);

        res.render('admin/admin', {
            orders,
            totalRevenue,
            totalOrders,
            totalProducts,
            monthlyEarnings
        });
    } catch (error) {
        console.error('Error rendering home page:', error);
        res.render('user/error', { message: 'Page not Rendering' });
    }
};


// Render Login page Controller
const renderLogin = async(req,res)=>{
    try {
        res.render('admin/adminLogin');
    } catch (error) {
        res.render('user/error',{message:'Page not Rendering!'})
    }
}

// Login Controller
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body; 

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.'});
        }

        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(400).json({ success: false, message: 'Admin not found. Please check your credentials.' });
        }

        const isPasswordMatch = await bcrypt.compare(password, admin.password);

        if (!isPasswordMatch) {
            return res.status(400).json({ success: false, message: 'Incorrect email or password.' });
        }

        req.session.isAuthenticated = true;
        req.session.admin = { id: admin._id, email: admin.email };
        return res.status(200).json({ success: true, message: 'Admin login successful!' });

    } catch (error) {
        console.error('Error during admin login:', error);
        return res.status(500).json({ success: false, message: 'An error occurred. Please try again later.' });
    }
};

// Logout Controller
const logout = async(req,res)=>{
    try {
        req.session.destroy(()=>{
            res.redirect('/admin/login');
        })

    } catch (error) {
        res.render('user/error');
    }
}


module.exports = { adminLogin , logout ,renderHome ,renderLogin };
