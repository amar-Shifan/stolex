const Order = require('../../model/ordersSchema');
const Wallet = require('../../model/walletSchema');

const getOrders = async(req,res)=>{
    try {
        const orders = await Order.find({}).populate('items.productId').populate('userId')
        res.render('admin/orders' , {orders});
    } catch (error) {
        console.log(error);
        res.status(500).json({success:false , message:'Something went wrong!'})
    }
}

const getOrderDetails = async(req,res)=>{
    try {
        const id = req.params.id;
        if(!id) return res.status(400).json({success:false , message:'Order id not found'});

        const order = await Order.findOne({ _id: id })
                            .populate('items.productId')
                            .populate('shippingAddress');

        if(!order) return res.status(400).json({success:false , message:'Order not found'});

        res.render('admin/order-view' ,{order});

    } catch (error) {
        console.log(error);
        res.status(500).json({success:true , message : 'Something went wrong!'})
    }
}

const changeStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { orderStatus } = req.body;
    
        if (!orderStatus) {
            return res.status(400).json({ success: false, message: "Order status is required" });
        }
    
        if (!id) {
            return res.status(400).json({ success: false, message: "Order ID is required" });
        }
    
        const order = await Order.findById(id);
    
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
    
        order.orderStatus = orderStatus;
    
        if (orderStatus === 'delivered') {
            order.paymentStatus = 'success';
        }
    
        await order.save();
    
        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Something went wrong!" });
    }
};

const approveReturn = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;

        // Find the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        let refundAmount = 0;
        let description = '';

        if (itemId) {
            // Refund for a single item
            const itemIndex = order.items.findIndex((item) => item._id.toString() === itemId);
            if (itemIndex === -1) {
                return res.status(404).json({ success: false, message: 'Item not found in the order' });
            }

            const item = order.items[itemIndex];
            if (item.status === 'Cancelled' || item.status === 'Returned') {
                return res.status(400).json({ success: false, message: 'Item is already canceled or returned' });
            }

            refundAmount = item.refundAmount; // Calculate refund dynamically
            description = `Refund for item in Order #${orderId}`;

            // Update item status and refund amount
            order.items[itemIndex].status = 'Returned';
            order.items[itemIndex].refundAmount = refundAmount;
            // Check if all items are returned
            
            const allReturned = order.items.every((item) => item.status === 'Returned');
            if (allReturned) {
                order.orderStatus = 'returned';
            }

        } else {
            // Refund for the entire order
            order.items.forEach((item) => {
                if (item.status !== 'Cancelled' && item.status !== 'Returned') {
                    refundAmount += item.refundAmount; 
                    item.status = 'Returned';
                }
            });

            description = `Refund for Order #${orderId}`;
            order.orderStatus = 'returned';
        }

        // Save the updated order
        await order.save();

        // Handle wallet creation or update
        let wallet = await Wallet.findOne({ userId: order.userId });
        if (!wallet) {
            // Create a new wallet if it doesn't exist
            wallet = new Wallet({
                userId: order.userId,
                amount: 0,
                transactionHistory: [],
            });
        }

        // Update wallet balance and transaction history
        wallet.amount += refundAmount; // Add the refund to the wallet balance
        wallet.transactionHistory.push({
            type: 'credit',
            amount: refundAmount,
            description,
            date: new Date(),
        });

        // Save the wallet
        await wallet.save();

        res.json({
            success: true,
            message: `Refund of ${refundAmount} processed successfully.`,
            refundAmount,
        });
    } catch (error) {
        console.error('Error processing return:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


const rejectReturn = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;

        if (itemId) {
            await Order.updateOne(
                { _id: orderId, "items._id": itemId },
                {
                    $set: {
                        "items.$.status": "delivered",
                        "items.$.returnReason": "", 
                    },
                }
            );
        } else {
            
            await Order.updateOne(
                { _id: orderId },
                {
                    $set: {
                        orderStatus: "delivered",
                        "items.$[].status": "delivered", 
                        "items.$[].returnReason": "", 
                    },
                }
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports ={getOrders ,getOrderDetails ,changeStatus ,approveReturn ,rejectReturn}