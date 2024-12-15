const Coupon = require("../../model/couponSchema")

const getCoupon = async(req,res)=>{
    try {
        const coupons = await Coupon.find({});

        res.render('admin/coupon' , {coupons});
    } catch (error) {
        console.log(error);
        res.render('user/error' , {message : 'Something went wrong!'})
    }
}

const createCoupon = async (req, res) => {
  try {
    // Destructure the required fields from the request body
    const { 
      code, 
      discountType, 
      discountValue, 
      minPurchaseAmount, 
      maxDiscountAmount, 
      usageLimit, 
      startDate, 
      expiryDate 
    } = req.body;

    // Log the received data (can be removed later)
    console.log(code, discountType, discountValue, minPurchaseAmount, maxDiscountAmount, usageLimit, startDate, expiryDate);

    // Validation: Ensure all required fields are provided
    if (!code || !discountType || !discountValue || !expiryDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Create the new coupon object based on the request data
    const newCoupon = new Coupon({
      code: code.toUpperCase(), // Ensure coupon code is in uppercase
      discountType,
      discountValue,
      minPurchaseAmount: discountType === 'fixed' ? minPurchaseAmount : undefined, // Only apply for fixed type
      maxDiscountAmount: discountType === 'percentage' ? maxDiscountAmount : undefined, // Only apply for percentage type
      usageLimit: usageLimit || null, // Default to null if not provided
      startDate: startDate || Date.now(), // Use current date if no start date is provided
      expiryDate,
    });

    // Save the coupon to the database
    const savedCoupon = await newCoupon.save();

    // Return success response
    res.status(201).json({ success: true, message: 'Coupon created successfully', coupon: savedCoupon });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Server Error!' });
  }
};

  
module.exports = {getCoupon , createCoupon };