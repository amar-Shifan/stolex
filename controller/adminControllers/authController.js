const bcrypt = require('bcrypt')
const Admin = require('../../model/adminSchema');

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("email and pass",email,password);

        if (!email || !password) {
            console.log("entered not equal")
            req.session.msg = 'Email and password are required.';
            return res.redirect('/admin/login');
        }


        const admin = await Admin.findOne({ email });
        console.log('')
        if (!admin) {
            console.log("not admin")
            req.session.msg = 'Admin not found. Please check your credentials.';
            return res.redirect('/admin/login');
        }


        const isPasswordMatch = await bcrypt.compare(password, admin.password);
        if (!isPasswordMatch) {
            console.log("not password ")
            req.session.msg = 'Incorrect email or password.';
            return res.redirect('/admin/login');
        }


        console.log("succes ful login")
        req.session.admin = { id: admin._id, email: admin.email, role: admin.role };
        req.session.msg = 'Admin login successful!';
        return res.redirect('/admin');
    } catch (error) {
        console.error('Error during admin login:', error);
        req.session.msg = 'An error occurred. Please try again later.';
        return res.redirect('/admin/login');
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
    

module.exports = { adminLogin , logout };
