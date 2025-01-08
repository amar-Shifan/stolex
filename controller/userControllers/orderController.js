// Order Controllers 
const User = require('../../model/userSchema');
const Cart = require('../../model/cartSchema');
const Order = require('../../model/ordersSchema');
const Address = require('../../model/addressSchema');
const Product = require('../../model/productSchema');
const Coupon = require('../../model/couponSchema');
const Offer = require("../../model/offerSchema");
const Wallet = require('../../model/walletSchema');
const env = require('../../utils/env_var')
const generateInvoice = require('../../utils/generateInvoice');

// Render CheckOut page Controller
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

            let itemTotal = item.total;
            if (product.offer) {
                const offer = await Offer.findById(product.offer);

                if (offer && product.discountedPrice) {
                    itemTotal = product.discountedPrice * item.quantity;
                } else {
                    itemTotal = product.price * item.quantity;
                }
            } else {
                itemTotal = product.price * item.quantity;
            }

            updatedItems.push({
                ...item.toObject(), 
                total: itemTotal, 
            });
        }

        cart.items = updatedItems;
        cart.subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0); 

        await cart.save();

        res.render('user/checkout', { cart, user });

    } catch (error) {
        console.error(error);
        res.render('user/error',{message : 'Something went wrong!'})
    }
};

const Razorpay = require('razorpay');
const crypto = require('crypto');
const { type } = require('os');

// Initialize Razorpay instance (configure with your Razorpay keys)
const razorpayInstance = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_SECRET_ID,
});

// generate OrderId
const generateOrderId = async () => {
    let orderId;
    let isUnique = false;

    // Define a function to generate a random alphanumeric string
    const generateRandomString = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            result += characters[randomIndex];
        }
        return result;
    };

    // Try generating a unique orderId
    while (!isUnique) {
        // Generate a 6-character alphanumeric orderId
        orderId = generateRandomString();

        // Check if this orderId already exists in the database
        const existingOrder = await Order.findOne({ orderId });
        if (!existingOrder) {
            isUnique = true; 
        }
    }

    return orderId;
};


// CheckOut Process Controller
const checkoutProcess = async (req, res) => {
    try {
        const { shippingAddress, paymentMethod, couponCode } = req.body;
        const userId = req.session.userId;

        if (!userId) return res.status(400).json({ success: false, message: 'User not logged in' });

        if(!paymentMethod) return res.status(400).json({success:false , message:'Payment Method is required'});

        if (!shippingAddress || !paymentMethod) return res.status(400).json({ success: false, message: 'Shipping address and payment method are required' });

        const address = await Address.findOne({ _id: shippingAddress });
        if (!address) return res.status(400).json({ success: false, message: 'Invalid shipping address' });

        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) return res.status(400).json({ success: false, message: 'Cart is empty' });

        const items = cart.items.map((item) => ({
            productId: item.productId,
            size: item.size,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
        }));

        let couponDiscount = 0;
        let totalAmount = cart.subtotal + 50;  
        if(paymentMethod === 'cod'){

            if (totalAmount > 1000) {
                return res.status(400).json({ success: false, message: 'Cannot use COD for amounts above 1000 rupees' });
            }

        }
        
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
            if (!coupon) return res.status(400).json({ success: false, message: 'Invalid or expired coupon' });
        
            if (new Date() < coupon.startDate || new Date() > coupon.expiryDate) {
                return res.status(400).json({ success: false, message: 'Coupon has expired' });
            }
        
            if (totalAmount < coupon.minPurchaseAmount) {
                return res.status(400).json({
                    success: false,
                    message: `Minimum purchase of ${coupon.minPurchaseAmount} required`,
                });
            }
        
            const user = await User.findById(userId); 
            const hasUsedCoupon = user.usedCoupons.some(
                (used) => used.couponId.toString() === coupon._id.toString()
            );
        
            if (hasUsedCoupon) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already used this coupon',
                });
            }
        
            if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon usage limit has been reached',
                });
            }
        
            if (coupon.discountType === 'fixed') {
                couponDiscount = coupon.discountValue;
            } else if (coupon.discountType === 'percentage') {
                couponDiscount = (totalAmount * coupon.discountValue) / 100;
            }
        
            if (coupon.maxDiscountAmount && couponDiscount > coupon.maxDiscountAmount) {
                couponDiscount = coupon.maxDiscountAmount;
            }
        
            coupon.usedCount += 1; 
            await coupon.save();
        
            user.usedCoupons.push({ couponId: coupon._id });
            await user.save();
        }
        



        let totalDiscountApplied = 0;
        const updatedItems = items.map(item => {
            const itemDiscount = (item.total / totalAmount) * couponDiscount;
            totalDiscountApplied += itemDiscount;

            return {
                ...item,
                discountApplied: itemDiscount,
                refundAmount: item.total - itemDiscount,  
                total: item.total - itemDiscount,  
            };
        });

        // If the total discount applied is less than the coupon discount, adjust the last item
        if (totalDiscountApplied < couponDiscount) {
            const lastItem = updatedItems[updatedItems.length - 1];
            const remainingDiscount = couponDiscount - totalDiscountApplied;
            lastItem.discountApplied += remainingDiscount;
            lastItem.refundAmount = lastItem.total - remainingDiscount;  
            lastItem.total -= remainingDiscount;  
        }

        let wallet = null;
        if (paymentMethod === 'wallet') {
            wallet = await Wallet.findOne({ userId });
            if (!wallet) return res.status(400).json({ success: false, message: 'Wallet not found' });

            if (wallet.amount < totalAmount) {
                return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
            }
        }

         // Generate a unique orderId
        const orderId = await generateOrderId();

        const order = new Order({
            orderId,
            userId,
            items: updatedItems,
            totalAmount: totalAmount - couponDiscount,  
            shippingAddress: {
                fullName: address.fullName,
                address: address.address,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                phoneNumber: address.phoneNumber
            },
            paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'success',
            orderStatus: 'pending',
        });

        if (paymentMethod === 'razorpay') {
            const razorpayOrder = await razorpayInstance.orders.create({
                amount: (totalAmount - couponDiscount) * 100,  
                currency: 'INR',
                receipt: order._id.toString(),
            });

            order.razorpayDetails.orderId = razorpayOrder.id;
        }

        await order.save();

        // Reduce the Stock
        try {
            const bulkOperations = updatedItems.map((item) => {
                return {
                    updateOne: {
                        filter: {
                            _id: item.productId,
                            "stock.size": item.size,
                            "stock.quantity": { $gte: item.quantity }, // Ensure sufficient stock
                        },
                        update: {
                            $inc: { "stock.$.quantity": -item.quantity }, // Decrease stock
                        },
                    },
                };
            });

            // Perform bulk write
            const result = await Product.bulkWrite(bulkOperations);

            // Check if any updates failed
            if (result.modifiedCount < updatedItems.length) {
                return res.status(400).json({
                    success: false,
                    message: "One or more items failed due to insufficient stock or invalid size.",
                });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: "An error occurred during the stock update process.",
            });
        }

        


        if (paymentMethod === 'razorpay') {
            return res.status(200).json({
                success: true,
                message: 'Order created successfully',
                razorpayOrderId: order.razorpayDetails.orderId,
                orderId: order._id,
                totalAmount: totalAmount - couponDiscount,
            });
        }

         if (paymentMethod === 'wallet') {
            wallet.amount -= totalAmount;
            wallet.transactionHistory.push({
                type: 'debit',
                amount: totalAmount,
                description: `Order #${order._id} payment`,
            });

            await wallet.save();
        }

        await Cart.findOneAndUpdate(
            { userId },
            { items: [], subtotal: 0 } 
        );

        res.status(200).json({ success: true, message: 'Order placed successfully' , orderId: order._id});

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error!' });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Missing payment details' });
        }

        // Find the order in the database
        const order = await Order.findOne({ 'razorpayDetails.orderId': razorpay_order_id });
        if (!order) {
            return res.status(400).json({ success: false, message: 'Order not found' });
        }

        // Verify the signature
        const hmac = crypto.createHmac('sha256', env.RAZORPAY_SECRET_ID);
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature === razorpay_signature) {
            // Payment is successful
            order.paymentStatus = 'success';
            order.razorpayDetails.paymentId = razorpay_payment_id;
            order.razorpayDetails.signature = razorpay_signature;

            // Save the order and clear the cart
            await order.save();
            await Cart.findOneAndUpdate(
                { userId: order.userId },
                { items: [], subtotal: 0 }
            );

            return res.status(200).json({ success: true, message: 'Payment verified and order completed'});
        } else {
            // Payment verification failed
            order.paymentStatus = 'failed';
            order.razorpayDetails.signature = null;

            await order.save();
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }
    } catch (error) {
        console.error('Error in verifyPayment:', error);
        return res.status(500).json({ success: false, message: 'Server error!' });
    }
};

// Payment Failure Controller
const paymentFailure = async (req, res) => {
    try {
        const { razorpay_order_id } = req.body;

        if (!razorpay_order_id) {
            return res.status(400).json({ success: false, message: 'Order ID is required' });
        }

        const order = await Order.findOne({ 'razorpayDetails.orderId': razorpay_order_id });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.paymentStatus = 'failed'; 

        // Save the order and clear the cart
        await order.save();
        await Cart.findOneAndUpdate(
            { userId: order.userId },
            { items: [], subtotal: 0 }
        );

        res.status(200).json({ success: true, message: 'Payment status updated to pending' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error!' });
    }
};

// Repay Controller
const repayOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order ID is required' });
        }

        // Find the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.paymentStatus === 'success') {
            return res.status(400).json({ success: false, message: 'Payment already completed for this order' });
        }
        // Generate a new Razorpay order
        const razorpayOrder = await razorpayInstance.orders.create({
            amount: order.totalAmount * 100, // Amount in paise
            currency: 'INR',
            receipt: order._id.toString(),
        });

        // Update order with new Razorpay details
        order.razorpayDetails.orderId = razorpayOrder.id;
        order.paymentStatus = 'pending';
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Repay order created successfully',
            razorpayOrderId: razorpayOrder.id,
            totalAmount: order.totalAmount,
        });
    } catch (error) {
        console.error('Error in repayOrder:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Render Success Page Controller
const getSuccess = async(req,res)=>{
    try {
        const orderId = req.query.orderId;
        res.render('user/order-complete', { orderId });
    } catch (error) {
        res.render('user/error',{message:'Something went wrong'})
    }
}

//Invoice download
const invoiceDownload = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId).populate('items.productId').populate('shippingAddress');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        generateInvoice(order, res); // Call the utility function
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error generating invoice' });
    }
}

// Render Orders Page
const getOrders = async (req, res) => {
    try {
        const userId = req.session.userId; 
        
        if (!userId) {
            return res.redirect('/login'); 
        }

        const orders = await Order.find({ userId }) 
            .populate('items.productId', 'name images') 
            .populate('shippingAddress') 
            .sort({ createdAt: -1 }); 

        res.render('user/orders', { orders }); 

    } catch (error) {
        res.render('user/error', { message: "Page Can't render" }); 
    }
};

// Render Order Details page Controller
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

        const flowStatus = ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered' ];

        // Pass the generated diagram and other variables to the template
        res.render('user/order-view-details', { order, flowStatus });

    } catch (error) {
        res.render('user/error',{message:'Something went wrong!'})
    }
}    

// Cancel Order Controller
const cancelOrder = async (req, res) => {
    try {
        const { orderId, itemId, reason } = req.body;
        const userId = req.session.userId;
        console.log('wroking')

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User not logged in' });
        }

        const order = await Order.findById(orderId).populate('items.productId');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        console.log(order,'wokig');
        
        if (order.userId.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized access to this order' });
        }

        // Check if the order is already cancelled
        if (order.orderStatus === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Order is already canceled' });
        }

        let description = '';

        if (itemId) {
            // Cancel a single item
            const item = order.items.find(item => item._id.toString() === itemId);
            if (!item) {
                return res.status(404).json({ success: false, message: 'Item not found in order' });
            }

            if (item.status === 'Cancelled' || item.status === 'Returned') {
                return res.status(400).json({ success: false, message: 'Item is already canceled or returned' });
            }

            item.status = 'cancel-request';  // Mark as cancel request
            item.cancelReason = reason;      // Save the cancel reason

            description = `Cancel request for item in Order #${orderId}`;

            await order.save();
        } else {
            // If no itemId is provided, cancel the whole order
            order.orderStatus = 'cancel-request';  // Mark as cancel request
            order.cancelReason = reason;           // Save the cancel reason

            order.items.forEach((item) => {
                if (item.status !== 'Cancelled' && item.status !== 'Returned') {
                    item.status = 'cancel-request';  
                    item.cancelReason = reason;
                }
            });

            description = `Cancel request for Order #${orderId}`;

            await order.save();
        }

        // Return success response
        return res.status(200).json({
            success: true,
            message: itemId ? 'Item cancel request successfully created' : 'Order cancel request successfully created',
            order,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

//Return Order Controller 
const returnOrder = async (req, res) => {
    try {

      const { orderId, itemId, reason } = req.body;
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
  
      if (itemId) {
        const item = order.items.find((item) => item._id.toString() === itemId);
        if (!item) {
          return res.status(404).json({ success: false, message: 'Item not found in order' });
        }
  
        if (item.status === 'Returned') {
          return res.status(400).json({ success: false, message: 'Item is already returned' });
        }
  
        item.status = 'return-request'; 
        item.returnReason = reason; 
  
        await order.save(); 
  
        return res.status(200).json({
          success: true,
          message: 'Item return request successfully created',
          item, 
        });
      }
  
      if (order.orderStatus === 'returned') {
        return res.status(400).json({ success: false, message: 'Order is already returned' });
      }
  
      order.orderStatus = 'return-request'; 
      order.returnReason = reason; 
  
      order.items.forEach((item) => {
        if (item.status !== 'Returned') {
          item.status = 'return-request';
          item.returnReason = reason;
        }
      });
  
      await order.save(); 
  
      return res.status(200).json({
        success: true,
        message: 'Order return request successfully created',
        order, 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};
  
// Render Wallet Page Controller
const getWallet = async (req, res) => {
    try {
        const userId = req.session.userId;
        const wallet = await Wallet.findOne({ userId }); 

        if (!wallet) {
            return res.render('user/wallet', { wallet: null, error: 'Wallet not found!' });
        }

        res.render('user/wallet', { wallet, error: null });
    } catch (error) {
        console.error(error);
        res.render('user/wallet', { wallet: null, error: 'Something went wrong!' });
    }
};

module.exports = {getCheckout , getSuccess ,checkoutProcess , getOrders , details ,cancelOrder ,verifyPayment 
                 ,getWallet , returnOrder , paymentFailure , repayOrder , invoiceDownload}