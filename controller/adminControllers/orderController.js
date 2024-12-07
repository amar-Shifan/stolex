const Order = require('../../model/ordersSchema');

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

module.exports ={getOrders ,getOrderDetails ,changeStatus}