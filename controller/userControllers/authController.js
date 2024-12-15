const User = require('../../model/userSchema');
const Product = require('../../model/productSchema')
const Category = require('../../model/categorySchema')
const bcrypt = require('bcrypt');
const generateOtp = require('../../utils/generateOtp');
const Otp = require('../../model/otpSchema');
const sendOtpToMail = require('../../service/mailService');
const env = require('../../utils/env_var');


const logout = async (req,res)=>{
    try {
        req.session.destroy(()=>{
            res.redirect('/')
        })
    } catch (error) {
        console.log(error,'error in logout')
    }
}

const userLogin = async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required.' });
        

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'User does not exist. Please sign up first.' });
        

        if (user.block) return res.status(403).json({ success: false, message: 'You are blocked!' });
        

        const verifypass = await bcrypt.compare(password, user.password);
        if (!verifypass) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        

        req.session.userId = user._id;

        const redirectUrl = req.query.redirect || '/';
        console.log(req.session)
        // Save the session
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ success: false, message: 'Failed to save session' });
            }
            res.status(200).json({ success: true, message: 'Logged in successfully' ,redirectUrl});
        });
        console.log(req.session)

    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred. Please try again later.',
        });
    }
    
};

const getSignup = async(req,res)=>{
    try {
            res.render('user/signup');
    } catch (error) {
        console.log('error',error);
        res.render('user/error' , {message:'Something went wrong'})
    }
}

const getHomePage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = 6; 
        const skip = (page - 1) * limit; 

        const products = await Product.find({status:'Active'}).limit(8)

        const categories = await Category.find({ level: 1, status: 'Active' });

        const categoryProducts = await Promise.all(
            categories
                .filter(category => category.status === 'Active') 
                .map(async (category) => {
                    const product = await Product.findOne({ category: category._id, status: 'Active' })
                        .populate('category');
                    return {
                        category: category.name,
                        product,
                    };
                })
        );
        

        const brands = await Product.distinct('brand');

        const brandProducts = await Promise.all(
            brands.map(async (brand) => {
                const product = await Product.findOne({ brand, status: 'Active' })
                    .populate('category')
                return {
                    brand,
                    product,
                };
            })
        );

        const allSpotlightProducts = brandProducts.filter((item) => item.product);

        const spotlightProducts = allSpotlightProducts.slice(skip, skip + limit);

        const totalPages = Math.ceil(allSpotlightProducts.length / limit);

        res.render('user/user_home', {
            categoryProducts,
            products,
            spotlightProducts, 
            currentPage: page,
            totalPages, 
        });
    } catch (error) {
        console.log("Error in getting home: ", error.message);
        res.status(500).render('error', { message: 'Internal server error' });
    }
};


const insertUser = async(req,res)=>{
    
    const { username, email, password, dob, phoneNumber } = req.body;
    try{

        const existingUser = await User.findOne({email})
        if(existingUser){
            res.status(403).json({success:false , message: "Email already Exists"})
            return;
        }

        const otp = generateOtp();

        const otpMail = await sendOtpToMail(
            email,
            "Your OTP Code", 
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; color: #333;">
                <h2 style="color: #4CAF50; text-align: center;">Verification Code</h2>
                <p>Hello,</p>
                <p>Your OTP (One-Time Password) for verification is:</p>
                <h3 style="text-align: center; color: #333; font-size: 24px; padding: 10px 20px; border-radius: 5px; background-color: #f4f4f4;">${otp}</h3>
                <p>Please enter this code to complete your verification. This code is valid for 2 minutes.</p>
                <p>If you didn’t request this code, please ignore this message or contact support if you have any concerns.</p>
                <hr style="border: none; border-top: 1px solid #ddd;">
                <p style="text-align: center; font-size: 0.8em; color: #777;">This is an automated message, please do not reply.</p>
            </div>
            `
        );
        
        console.log("sended otp ");
        
        if(!otpMail){
            res.status(403).json({success:false,message:"something went wrong"})
        }
        console.log('ok send')
        const expiresAt = new Date(Date.now() + 60 * 1000);
        const otpEntry = Otp({
            email,
            otp,
            expiresAt
        });
        await otpEntry.save();
        console.log('saved');

        req.session.tempUserData = { username, email, password, dob, phoneNumber };
        console.log("req.session.temp",req.session.tempUserData);

        return res.status(200).json({success:true,message:"OTP Sent successfully"});

    }
        catch(err){
        console.log(err.message);
        return res.status(500).json({ success:false , message : 'Server Error'});
        }
}

const getOtp = async (req, res) => {
    const email = req.session.tempUserData.email;
    const otpDoc = await Otp.findOne({ email });

    let remainingTime = 0;
    if (otpDoc) {
        const now = new Date();
        remainingTime = Math.max(0, Math.floor((new Date(otpDoc.expiresAt) - now) / 1000));
    }

    res.render('user/otp-verification', { remainingTime });
};


const otpVerification = async (req, res) => {
    try {
        const { username, email, password, dob, phoneNumber } = req.session.tempUserData;
        const { otp1, otp2, otp3, otp4 } = req.body;

        const otp = `${otp1}${otp2}${otp3}${otp4}`;
        console.log('Combined OTP:', otp);

        const validOtp = await Otp.findOne({ otp, email });
        if (!validOtp) {
            console.log('OTP is not valid!');
            return res.status(401).json({ success: false, message: 'Please enter a valid OTP' });
        }

        if (validOtp.expiresAt < Date.now()) {
            console.log('OTP has expired!');
            return res.status(401).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        const deletedOtp = await Otp.deleteOne({ email, otp });
        if (deletedOtp.deletedCount === 0) {
            return res.status(500).json({ success: false, message: 'Error during OTP deletion. Please try again.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            dob,
            phoneNumber,
        });

        await newUser.save();

        delete req.session.tempUserData;
        req.session.userId = newUser._id;

        // Save the session
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ success: false, message: 'Failed to save session' });
            }
            res.status(200).json({ success: true, message: 'Signed in Successfully' });
        });

    } catch (error) {
        console.error('Error in OTP verification:', error);
        return res.status(500).json({ success: false, message: 'An error occurred. Please try again later.' });
    }
};

const resendOtp = async (req, res) => {
    try {
        const { tempUserData } = req.session;

        if (!tempUserData || !tempUserData.email) {
            return res.status(400).json({ success : false , message: 'No user session found. Please try again.' });
        }

        const { email } = tempUserData;

        const otp = generateOtp(); 
        const expiresAt = Date.now() + 1 * 60 * 1000; // 1 minutes 

        const updatedOtp = await Otp.findOneAndUpdate(
            { email },
            { otp, expiresAt },
            { upsert: true, new: true }
        );

        console.log(`OTP sent to ${email}: ${otp}`);
        console.log('New OTP:', updatedOtp);

        const otpMail = await sendOtpToMail(
            email,
            "Your OTP Code", 
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; color: #333;">
                <h2 style="color: #4CAF50; text-align: center;">Verification Code</h2>
                <p>Hello,</p>
                <p>Your OTP (One-Time Password) for verification is:</p>
                <h3 style="text-align: center; color: #333; font-size: 24px; padding: 10px 20px; border-radius: 5px; background-color: #f4f4f4;">${otp}</h3>
                <p>Please enter this code to complete your verification. This code is valid for 2 minutes.</p>
                <p>If you didn’t request this code, please ignore this message or contact support if you have any concerns.</p>
                <hr style="border: none; border-top: 1px solid #ddd;">
                <p style="text-align: center; font-size: 0.8em; color: #777;">This is an automated message, please do not reply.</p>
            </div>
            `
        );

        console.log('OTP email sent:', otpMail);

        res.status(200).json({
            success:true,
            message: 'OTP has been resent successfully.',
            expiresAt
        });

    } catch (error) {
        console.error('Error in resending OTP:', error);
        res.status(500).json({ message: 'Failed to resend OTP. Please try again later.' });
    }
};

module.exports = {
    logout,
    insertUser,
    otpVerification,
    userLogin,
    resendOtp,
    getHomePage,
    getOtp,
    getSignup
}