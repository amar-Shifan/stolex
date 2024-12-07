const bcrypt = require('bcrypt')
const Admin = require('../../model/adminSchema');

const renderHome = async (req,res)=>{
    res.render('admin/admin');
}

const renderLogin = async(req,res)=>{
    res.render('admin/adminLogin');
}
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body; 
        console.log("Received email and password:", email, password);

        if (!email || !password) {
            console.log("Missing email or password");
            return res.status(400).json({ success: false, message: 'Email and password are required.'});
        }

        const admin = await Admin.findOne({ email });
        console.log("Admin found:", admin);

        if (!admin) {
            console.log("Admin not found");
            return res.status(400).json({ success: false, message: 'Admin not found. Please check your credentials.' });
        }

        const isPasswordMatch = await bcrypt.compare(password, admin.password);
        console.log("Password match:", isPasswordMatch);

        if (!isPasswordMatch) {
            console.log("Incorrect password");
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

const logout = async(req,res)=>{
    try {
        console.log("session destroying")
        req.session.destroy(()=>{
            res.redirect('/admin/login');
        })

    } catch (error) {
        console.log(error.message)
    }
}
    

module.exports = { adminLogin , logout ,renderHome ,renderLogin};
