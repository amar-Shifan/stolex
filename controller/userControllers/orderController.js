const User = require('../../model/userSchema');
const Cart = require('../../model/cartSchema');
const Order = require('../../model/ordersSchema');
const Address = require('../../model/addressSchema');
const Product = require('../../model/productSchema');


const getCheckout = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.status(400).json({ success: false, message: "User is not logged in" });
        }

        const user = await User.findById(userId).populate('address');
        const cart = await Cart.findOne({ userId }).populate('items.productId');

        if (!cart) {
            return res.status(400).json({ success: false, message: 'Cart not found' });
        }

        let updatedItems = [];

        for (const item of cart.items) {
            const product = item.productId;
            const selectedSize = item.size;

            if (product.status !== 'Active') {
                continue;
            }

            const sizeStock = product.stock.find(stockItem => stockItem.size === selectedSize);

            if (!sizeStock || sizeStock.quantity < item.quantity) {
                continue; 
            }

            updatedItems.push(item); 
        }

        cart.items = updatedItems;
        cart.subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
        await cart.save();

        res.render('user/checkout', { cart, user });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Something went wrong!' });
    }
};


const checkoutProcess = async (req, res) => {
    try {
        const { shippingAddress, paymentMethod, couponCode } = req.body;
        console.log(shippingAddress)
        const userId = req.session.userId;

        if (!userId) return res.status(400).json({ success: false, message: 'User not logged in' });
        

        if (!shippingAddress || !paymentMethod) return res.status(400).json({ success: false, message: 'Shipping address and payment method are required' });
        

        const address = await Address.findOne({ _id : shippingAddress});
        if (!address) return res.status(400).json({ success: false, message: 'Invalid shipping address' });
        

        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart || cart.items.length === 0)  return res.status(400).json({ success: false, message: 'Cart is empty' });
    

        const items = cart.items.map((item) => ({
            productId: item.productId,
            size: item.size,
            quantity: item.quantity, 
            price: item.price,
            total: item.total,
        }));

        for(const item of items){

            const product = await Product.findById(item.productId);
            if(!product) return res.status(400).json({success : false , message : `Product not found: ${item.productId}`});

            const stockEntry = product.stock.find((stock) => stock.size === item.size );
            if(!stockEntry || stockEntry.quantity < item.quantity) return res.status(400).json({success : false , message : 'Size not found'})
                
            stockEntry.quantity -= item.quantity;

            await product.save();
        }


        const shippingCharge = 50;
        const totalAmount = cart.subtotal + shippingCharge;

        const order = new Order({
            userId,
            items,
            totalAmount,
            shippingAddress,
            paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
            orderStatus: 'pending',
            razorpayDetails: paymentMethod === 'razorpay' ? {} : undefined,
        });

        await order.save();

        await Cart.findOneAndUpdate(
            { userId },
            { items: [], subtotal: 0 } 
        );

        res.status(200).json({ success: true, message: 'Order placed successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error!' });
    }
};

const getSuccess = async(req,res)=>{
    try {

        res.render('user/order-complete')
        
    } catch (error) {
        console.log(error)
    }
}

const getOrders = async (req,res)=>{
    try {

        const orders = await Order.find({})
            .populate('items.productId' , 'name images')
            .populate('shippingAddress')
            .sort({createdAt : -1})

        res.render('user/orders-page' , {orders})

    } catch (error) {
        console.log(error);
        res.render('user/error',{message:"Page Cant render"});
    }
}

const details = async(req,res)=>{
    try {
        const {orderId} = req.params;
        const userId = req.session.userId;

        if(!userId) res.status(400).json({success:false , message:"User not logged in"});
        if(!orderId) res.status(400).json({success:false , message : 'Order id not found!'});

        const order = await Order.findOne({_id:orderId})
                            .populate('items.productId')
                            .populate('shippingAddress')

        if(!order) return res.status(400).json({success:false , message : 'Order is not valid'});

        const flowStatus = ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

        // Pass the generated diagram and other variables to the template
        res.render('user/order-view-details', { order, flowStatus });

    } catch (error) {
        console.log(error);
        res.status(500).json({success:false , message:'Something went wrong!'})
    }
}    

const cancelOrder = async (req, res) => {
    try {
        const { orderId, itemId } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User not logged in' });
        }

        const order = await Order.findById(orderId).populate('items.productId');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.userId.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized access to this order' });
        }

        if (order.orderStatus === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Order is already canceled' });
        }

        if (itemId) {
            const item = order.items.find(item => item._id.toString() === itemId);
            if (!item) {
                return res.status(404).json({ success: false, message: 'Item not found in order' });
            }

            const product = await Product.findById(item.productId._id);
            if (product) {
                const stockEntry = product.stock.find(stock => stock.size === item.size);
                if (stockEntry) {
                    stockEntry.quantity += item.quantity;
                }
                await product.save();
            }

            item.status = 'Cancelled';

            const allItemsCancelled = order.items.every(item => item.status === 'Cancelled');
            if (allItemsCancelled) {
                order.orderStatus = 'cancelled';
            }

            await order.save();
            return res.status(200).json({ success: true, message: 'Item successfully canceled', order });
        }

        for (const item of order.items) {
            const product = await Product.findById(item.productId._id);
            if (product) {
                const stockEntry = product.stock.find(stock => stock.size === item.size);
                if (stockEntry) {
                    stockEntry.quantity += item.quantity;
                }
                await product.save();
            }
            item.status = 'Cancelled';
        }

        order.orderStatus = 'cancelled';

        await order.save();
        return res.status(200).json({ success: true, message: 'Order successfully canceled', order });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


module.exports = {getCheckout , getSuccess ,checkoutProcess , getOrders , details ,cancelOrder}