// USER CONTROLLER PAGE
const User = require('../../model/userSchema');
const Address = require('../../model/addressSchema');
const Wishlist = require('../../model/wishlistSchema')
const bcrypt = require('bcrypt')
const sendToMail = require('../../service/mailService')
const env = require('../../utils/env_var');


// GET PROFILE
const getProfile = async (req,res)=>{
    try {
        
        const userId = req.session.userId;
        const user = await User.findById(userId).populate('address')
        res.render('user/user_profile',{user , addresses : user.address})
        
    } catch (error) {
        console.log(error)
        res.render('error',{message:"something went wrong "})
    }
}

// ADD PROFILE
const addProfile  = async (req,res)=>{
    try {

        console.log('userProfile Controller');
        const id = req.session.userId
        const profilePath = req.file ? `/uploads/profiles/${req.file.filename}` : null;

        if(!id) return res.status(401).json({success:false , message : "User not logged in"})

        if(!profilePath) return res.status(400).json({success:false , message:"No image uploaded"})

        await User.findByIdAndUpdate(id , {profile:profilePath})

        res.status(200).json({success:true , message : "Profile updated successfully"});

    } catch (error) {
        res.status(500).json({success:false , message:'Something went wrong!'});
    }
}

//UPDATE USER
const updateUser = async (req, res) => {
    try {
        console.log("working the controller ")
        const { username, dob, phoneNumber } = req.body;
        const id = req.session.userId;

        if (!id) {
            return res.status(400).json({ success: false, message: "User is not logged in" });
        }

        if (!username || username.trim() === '') {
            return res.status(400).json({ success: false, message: 'Username is required' });
        }
        if (!dob || isNaN(Date.parse(dob))) {
            return res.status(400).json({ success: false, message: 'Invalid Date of Birth' });
        }
        if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) { 
            return res.status(400).json({ success: false, message: 'Invalid phone number' });
        }

        const user = await User.findByIdAndUpdate(id, { username, dob, phoneNumber }, { new: true });

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, message: "Updated successfully" });

    } catch (error) {
        console.error(error, "error in updating the user");
        res.status(500).json({ success: false, message: "Something went wrong!" });
    }
};

// ADD ADDRESS
const addAddress = async (req,res)=>{
    try {
        
        const {fullName , address ,city , state , pincode ,phoneNumber} = req.body;
        const id = req.session.userId;

        if(!id){
            return res.status(400).json({ success: false, message: 'User is not logged in' });
        }

        const user = await User.findById(id);

        if(!user) return res.status(400).json({ success: false, message: 'User does not exist' });

        if (!fullName || fullName.trim().length < 3) return res.status(400).json({success:false ,message : 'Full name must be at least 3 characters long'})
        

        if (!address || address.trim() === '') return res.status(400).json({success:false ,message : 'Address is required'})
        

        if (!city || city.trim() === '') return res.status(400).json({success:false ,message : 'City is required'})
    

        if (!state || state.trim() === '') return res.status(400).json({success:false ,message : 'State is required'})
        

        if (!pincode || !/^\d{6}$/.test(pincode)) return res.status(400).json({success:false , message:'Pin code must be exactly 6 digits'})
        

        if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) return res.status(400).json({success : false , message : 'Phone number must be exactly 10 digits'});


        const userAddress = await Address.create({
            fullName,
            address,
            city,
            state,
            pincode,
            phoneNumber
        })

        user.address.push(userAddress._id);
        await user.save();

        res.status(200).json({success:true , message : 'Address added successfully'})

    } catch (error) {
        console.log(error)
        res.status(500).json({success:false , message : 'Something went wrong!'})
    }
}

//EDIT ADDRESS
const editAddress = async (req, res) => {
    try {
        const { fullName, address, city, state, pincode, phoneNumber, addressId } = req.body;
        const userId = req.session.userId;

        if (!userId) return res.status(400).json({ success: false, message: 'User is not logged in' });

        const user = await User.findById(userId);
        if (!user || user.block) return res.status(400).json({ success: false, message: 'User doesn’t exist or is blocked' });

        // Validate input fields
        if (!fullName || fullName.trim().length < 3)
            return res.status(400).json({ success: false, message: 'Full name must be at least 3 characters long' });

        if (!address || address.trim() === '')
            return res.status(400).json({ success: false, message: 'Address is required' });

        if (!city || city.trim() === '')
            return res.status(400).json({ success: false, message: 'City is required' });

        if (!state || state.trim() === '')
            return res.status(400).json({ success: false, message: 'State is required' });

        if (!pincode || !/^\d{6}$/.test(pincode))
            return res.status(400).json({ success: false, message: 'Pin code must be exactly 6 digits' });

        if (!phoneNumber || !/^\d{10}$/.test(phoneNumber))
            return res.status(400).json({ success: false, message: 'Phone number must be exactly 10 digits' });

        if (!addressId) return res.status(400).json({ success: false, message: 'Address ID not found' });

        await Address.findByIdAndUpdate(addressId, {
            fullName,
            address,
            pincode,
            city,
            state,
            phoneNumber,
        });

        res.status(200).json({ success: true, message: 'Address updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server issue' });
    }
};

// DELETE ADDRESS
const deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;

        if (!id) return res.status(400).json({ success: false, message: 'No address ID provided' });

        if (!userId) return res.status(400).json({ success: false, message: 'User is not logged in' });

        const user = await User.findById(userId);
        if (!user || user.block) return res.status(400).json({ success: false, message: 'User doesn’t exist or is blocked' });

        const address = await Address.findById(id);
        if (!address) return res.status(404).json({ success: false, message: 'Address not found' });

        await Address.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: 'Address deleted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// CHANGE PASSWORD
const changePassword = async(req,res)=>{
    try {
        
        const {currentPassword , newPassword , confirmPassword} = req.body;
        const id = req.session.userId;
        
        if(!id) return res.status(400).json({ success: false, message: 'User is not logged in' });

        const user = await User.findById(id);

        if(!user) return res.status(400).json({ success: false, message: 'User does not exist' });

        const passwordExists = await bcrypt.compare(currentPassword , user.password);

        if(!passwordExists) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                success: false,
                message: 'New password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character',
            });
        }

        if(newPassword !== confirmPassword) return res.status(400).json({ success: false, message: 'Passwords do not match' });
        
        const hashedPassword = await bcrypt.hash(newPassword , 10);

        await User.findByIdAndUpdate(id ,{password:hashedPassword});

        return res.status(200).json({ success: true, message: 'Password changed successfully' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({success:false , message:'Something went wrong!'})
    }
}

//GET THE EMAIL ENTER PAGE
const emailEnter = async(req,res)=>{
    try {

        res.render('user/email-enter');
        
    } catch (error) {
        console.log(error);
        res.render('user/error',{message : 'Server Error Cant find the page'})
    }
}

//VERIFY EMAIL
const verifyEmail = async (req, res) => {
    try {
        const { email } = req.body;
    
        const user = await User.findOne({ email, block: false });
    
        if (!user) {
            return res.status(400).json({ success: false, message: 'User does not exist' });
        }
    
        if (user.email.toLowerCase().trim() !== email.toLowerCase().trim()) {
            return res.status(400).json({ success: false, message: 'It is not the email you have logged in with' });
        }
    
        const resetPasswordLink = `${env.BASE_URL || 'http://localhost:3000'}resetPassword?userId=${user._id}`;
    
        const sendMail = await sendToMail(
            email,
            'Your Reset Password Link',
            `
            <p>Hello,</p>
            <p>You requested a password reset. Click the link below to reset your password:</p><br>
            <p><a href="${resetPasswordLink}">${resetPasswordLink}</a></p>
            <p>If you did not request this, please ignore this email or contact support if you have concerns.</p>
            `
        );
    
        if (sendMail) {
            return res.status(200).json({ success: true, message: 'Reset link sent to the email' });
        } else {
            return res.status(500).json({ success: false, message: 'Failed to send email' });
        }
    
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Something went wrong!' });
    }
    
};

// GET RESSET PASSWORD
const getResetPassword = async(req,res)=>{
    try {
        const id = req.query.userId;
        const user = await User.findById(id);

        res.render('user/resetPassword' ,{user})
    } catch (error) {
        console.log(error)
        res.status(500).json({success:false , message:'Something went wrong!'})
    }
}

// RESET PASSWORD
const resetPassword = async (req, res) => {
    try {
        const { id, newPassword, confirmPassword } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        if (!newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'Both password fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(400).json({ success: false, message: 'User does not exist' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.findByIdAndUpdate(id, { password: hashedPassword });

        res.status(200).json({ success: true, message: 'Successfully changed the password' });

    } catch (error) {
        console.error(error); 
        res.status(500).json({ success: false, message: 'Something went wrong!' });
    }
};

// Get Wishlist
const getWishlist = async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.render('user/error', { message: 'User not logged in' });

    try {
        const wishlist = await Wishlist.findOne({ userId }).populate('items.productId');
        res.render('user/wishlist', { wishlist });
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.render('user/error', { message: "Server Error" });
    }
};

// Add to Wishlist
const addToWishlist = async (req, res) => {
    console.log('Request Body:', req.body); // Debugging

    const { productId } = req.body;
    const userId = req.session.userId;

    if (!userId) return res.status(400).json({ success: false, message: 'User is not logged in' });

    try {
        let wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            wishlist = new Wishlist({ userId, items: [] });
        }

        const itemExists = wishlist.items.some(item => item.productId.toString() === productId);
        if (!itemExists) {
            wishlist.items.push({ productId });
            await wishlist.save();
        }

        res.status(200).json({ success: true, message: 'Item added to wishlist' });
    } catch (error) {
        console.log('Error adding item to wishlist:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


// Remove from Wishlist
const remove = async (req, res) => {
    const productId = req.params.productId;
    const userId = req.session.userId;
    console.log("working");
    console.log(productId);
    
    
    if (!userId) return res.status(400).json({ success: false, message: "User not logged in" });

    try {
        console.log('working still');
        
        const wishlist = await Wishlist.findOneAndUpdate(
            { userId },
            { $pull: { items: { _id: productId } } },
            { new: true } 
          );

        if(!wishlist)  return res.status(404).json({ success: false, message: 'Wishlist not found' });
        
        if (wishlist.items.length === 0) {
            await Wishlist.findOneAndDelete({ userId });
            return res.status(200).json({ success: true, message: 'Wishlist is now empty and deleted' });
        }

        res.status(200).json({ success: true, message: 'Item removed from wishlist' });
        
    } catch (error) {
        console.log('Error removing item from wishlist:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {getProfile , addProfile ,updateUser , addAddress ,changePassword ,getResetPassword ,verifyEmail 
                 ,resetPassword ,editAddress ,deleteAddress ,getWishlist ,addToWishlist ,remove ,emailEnter};