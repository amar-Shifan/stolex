//User Management Controller
const User = require("../../model/userSchema");
const bcrypt = require('bcrypt')

// Render User Listing Page Controller
const listUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query; 
        const skip = (page - 1) * limit;

        const users = await User.find().skip(skip).limit(limit);

        const totalUsers = await User.countDocuments();

        res.render('admin/user-management', {
            users,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalUsers / limit),
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.render('user/error',{message:'Something went wrong!'})
    }
};

// Toggle Status Controller
const toggleStatus = async (req, res) => {
    try {

        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found!' });
        }

        // Toggle the block status
        user.block = !user.block;
        await user.save();

        return res.status(200).json({ 
            message: `User status updated to ${user.block ? 'Blocked' : 'Active'}`, 
            status: user.block 
        });

    } catch (error) {
        console.error('Error toggling user status:', error);
        return res.status(500).json({ message: 'An error occurred. Please try again.' });
    }
};

//Add User Controller
const addUser = async (req, res) => {
    try {
        const { username, email, block, password, phoneNumber } = req.body;

        if (!username || !email || !password || !phoneNumber) {
            return res.status(400).json({ success: false, message: 'All fields are required!' });
        }
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            email,
            block,
            password: hashedPassword,
            phoneNumber
        });

        const saved = await user.save();
        if (saved) {
            return res.status(201).json({ success: true, message: 'User successfully added' });
        }
    } catch (error) {
        console.error('Error adding user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const searchUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; 
        const skip = (page - 1) * limit;
        const searchQuery = req.query.q || '';

        const query = {
            $or: [
                { username: { $regex: searchQuery, $options: 'i' } },
                { email: { $regex: searchQuery, $options: 'i' } }
            ]
        };

        const totalUsers = await User.countDocuments(query);
        const totalPages = Math.ceil(totalUsers / limit);

        const users = await User.find(query)
            .skip(skip)
            .limit(limit)
            .select('username email block profileImage');

        res.json({
            success: true,
            users,
            currentPage: page,
            totalPages,
            totalUsers
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching users'
        });
    }
};

module.exports = {listUsers , toggleStatus , addUser ,searchUsers};
