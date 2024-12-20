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

// CheckOut Process Controller
const checkoutProcess = async (req, res) => {
    try {
        const { shippingAddress, paymentMethod, couponCode } = req.body;
        const userId = req.session.userId;

        if (!userId) return res.status(400).json({ success: false, message: 'User not logged in' });

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

        const order = new Order({
            userId,
            items: updatedItems,
            totalAmount: totalAmount - couponDiscount,  
            shippingAddress,
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
        for (const item of updatedItems) {
            const product = await Product.findById(item.productId);
            if (!product || !product.stock) continue; 

            const stockIndex = product.stock.findIndex((s) => s.size === item.size);

            if (stockIndex !== -1) {
                if (product.stock[stockIndex].quantity < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for ${product.name} (size: ${item.size})`,
                    });
                }

                product.stock[stockIndex].quantity -= item.quantity;

                await product.save();
            } else {
                return res.status(400).json({
                    success: false,
                    message: `Size ${item.size} not found for ${product.name}`,
                });
            }
        }


        if (paymentMethod === 'razorpay') {
            return res.status(200).json({
                success: true,
                message: 'Order created successfully',
                razorpayOrderId: order.razorpayDetails.orderId,
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

        res.status(200).json({ success: true, message: 'Order placed successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error!' });
    }
};

// Verification Payment Controller
const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Missing payment details' });
        }

        const hmac = crypto.createHmac('sha256', env.RAZORPAY_SECRET_ID);
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature === razorpay_signature) {
            res.json({ success: true, message: 'Payment verified successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }


        const order = await Order.findOne({ 'razorpayDetails.orderId': razorpay_order_id });
        if (!order) return res.status(400).json({ success: false, message: 'Order not found' });

        order.paymentStatus = 'success';
        order.razorpayDetails.paymentId = razorpay_payment_id;
        order.razorpayDetails.signature = razorpay_signature;

        await order.save();

        await Cart.findOneAndUpdate(
            { userId: order.userId },
            { items: [], subtotal: 0 }
        );

        res.status(200).json({ success: true, message: 'Payment verified and order completed' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error!' });
    }
};

// Render Success Page Controller
const getSuccess = async(req,res)=>{
    try {
        res.render('user/order-complete')
        
    } catch (error) {
        res.render('user/error',{message:'Something went wrong'})
    }
}

// Rendre Orders Page
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
        console.log(error);
        res.render('user/error',{message:'Something went wrong!'})
    }
}    

// Cancel Order Controller
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

        let refundAmount = 0;
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

            console.log('working reached the product ')
            const product = await Product.findById(item.productId._id);
            console.log('got the product ', product);
            
            if (product) {
                console.log('enter in product')
                const stockEntry = product.stock.find(stock => stock.size === item.size);
                
                if (stockEntry) {
                    stockEntry.quantity += item.quantity;
    
                    await Product.updateOne(
                        { _id: item.productId._id, 'stock.size': item.size },
                        { $inc: { 'stock.$.quantity': item.quantity } }
                    );
    
                    console.log('Stock updated successfully');
                } else {
                    console.log('Stock entry not found');
                }
                
            }

            item.status = 'Cancelled';
            refundAmount = item.refundAmount; 
            description = `Refund for item in Order #${orderId}`;

            const allItemsCancelled = order.items.every(item => item.status === 'Cancelled');
            if (allItemsCancelled) {
                order.orderStatus = 'cancelled';
            }

            await order.save();
        } else {
            for (const item of order.items) {
                if (item.status === 'Cancelled' || item.status === 'Returned') {
                    continue;
                }

                const product = await Product.findById(item.productId._id);
                if (product) {
                    const stockEntry = product.stock.find(stock => stock.size === item.size);
                    if (stockEntry) {
                        stockEntry.quantity += item.quantity;
        
                        await Product.updateOne(
                            { _id: item.productId._id, 'stock.size': item.size },
                            { $inc: { 'stock.$.quantity': item.quantity } }
                        );
        
                        console.log('Stock updated successfully');
                    } else {
                        console.log('Stock entry not found');
                    }
                }
                item.status = 'Cancelled';
                refundAmount += item.refundAmount; 
            }

            description = `Refund for Order #${orderId}`;
            order.orderStatus = 'cancelled';
            await order.save();
        }

        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            wallet = new Wallet({
                userId,
                amount: 0,
                transactionHistory: []
            });
        }

        wallet.amount += refundAmount;
        wallet.transactionHistory.push({
            type: 'credit',
            amount: refundAmount,
            description,
            date: new Date()
        });

        await wallet.save();

        return res.status(200).json({
            success: true,
            message: itemId ? 'Item successfully canceled' : 'Order successfully canceled',
            refundAmount,
            order
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
                 ,getWallet , returnOrder }