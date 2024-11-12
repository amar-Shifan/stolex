const User = require('../../model/userSchema');
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
    
    // try {
        const { email, password } = req.body;
        if (!email || !password) {
            req.session.msg = 'Email and password are required.';
            return res.redirect('/user-login');
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            req.session.msg = 'User does not exist. Please sign up first.';
            return res.redirect('/user-login');
        }
        console.log(user)
        console.log("wortrkiong")
        // Check if the password is correct
        console.log(password,"password", user.password)
        const verifypass = await bcrypt.compare(password, user.password)
        if(verifypass) return res.redirect('/')
        
    // } catch (error) {
    //     console.error("Error during login:", error);
    //     req.session.msg = 'An error occurred. Please try again later.';
    //     return res.redirect('/user-login');
    // }

};


const insertUser = async(req,res)=>{
    
    const { username, email, password, dob, phoneNumber } = req.body;
    try{
        const existingUser = await User.findOne({email})
        if(existingUser){
            console.log('email already exists ')
            res.status(403).json({message: "Email already Exists"})
            return;
        }

        // Generate and send OTP 
        console.log('existing 1 ')
        const otp = generateOtp();
        const otpMail = await sendOtpToMail(
            email,
            "Your OTP Code", // This is the email subject
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
            console.log("cant send")
            res.status(403).json({message:"something went wrong"})
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

        return res.status(200).json({status:true,message:"OTP Sent success"});

    }
        catch(err){
        console.log(err.message);
        return res.status(500).json({ message : 'Server Error'});
        }
}

const otpVerification = async (req, res) => {
    try {
        console.log('sessioin',req.session);
        console.log('session items ',req.session.tempUserData);
        const { username, email, password, dob, phoneNumber } = req.session.tempUserData;
        const { otp1, otp2, otp3, otp4 } = req.body;
        const otp = `${otp1}${otp2}${otp3}${otp4}`;

        console.log('Combined OTP:', otp);

        // Find the OTP entry with the provided email and OTP code
        const validOtp = await Otp.findOne({ otp, email });
        console.log(validOtp, "valid otp");

        if (!validOtp) {
            console.log('otp is not valid !')
            req.session.error = 'Please enter a valid OTP';
            return res.redirect('/verify'); // Redirect to verification page if OTP is invalid
        }

        // Check if OTP has expired
        if (validOtp.expiresAt < Date.now()) {
            console.log("otp get expired !")
            req.session.error = 'OTP has expired. Please request a new one.';
            return res.redirect('/verify'); // Redirect if OTP has expired
        }

        // OTP is valid and not expired
        const deletedOtp = await Otp.deleteOne({ email, otp });
        if (!deletedOtp) {
            req.session.error = 'Error during OTP deletion. Please try again.';
            return res.redirect('/verify'); // Redirect if OTP deletion fails
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username : username , 
            email : email,
            password : hashedPassword,
            dob : dob, 
            phoneNumber : phoneNumber,
            verified : true
        }); 
        await newUser.save();

        delete req.session.tempUserData;

        req.session.message = 'Signup successfully';
        res.redirect('/'); // Redirect to home or success page 

    } catch (error) {
        console.error('Error in OTP verification:', error);
        req.session.error = 'An error occurred. Please try again later.';
        res.redirect('/otp-verify'); // Redirect in case of server error
    }
};


const resendOtp = async (req, res) => {
    try {
        const { tempUserData } = req.session;
        if (!tempUserData || !tempUserData.email) {
            return res.status(400).json({ message: 'No user session found. Please try again.' });
        }

        const { email } = tempUserData;

        const otp = generateOtp();
        const expiresAt = Date.now() + 60 * 1000; 

        // Update OTP in the database or create a new one
        const updatedOtp = await Otp.findOneAndUpdate(
            { email },
            { otp, expiresAt },
            { upsert: true, new: true }
        );

        console.log('New OTP:', updatedOtp);

        console.log(`OTP sent to ${email}: ${otp}`);

        res.status(200).json({ message: 'OTP has been resent successfully.' });
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
    resendOtp
}