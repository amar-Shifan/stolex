//Coupon Controllers
const Coupon = require("../../model/couponSchema")

//Render Coupon Page Controller
const getCoupon = async(req,res)=>{
    try {
        const coupons = await Coupon.find({});

        res.render('admin/coupon' , {coupons});
    } catch (error) {
        console.log(error);
        res.render('user/error' , {message : 'Something went wrong!'})
    }
}

//Create Coupon Controller
const createCoupon = async (req, res) => {
  try {
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

    console.log(code, discountType, discountValue, minPurchaseAmount, maxDiscountAmount, usageLimit, startDate, expiryDate);

    if (!code || !discountType || !discountValue || !expiryDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const newCoupon = new Coupon({
      code: code.toUpperCase(), 
      discountType,
      discountValue,
      minPurchaseAmount: discountType === 'fixed' ? minPurchaseAmount : undefined, 
      maxDiscountAmount: discountType === 'percentage' ? maxDiscountAmount : undefined, 
      usageLimit: usageLimit || null, 
      startDate: startDate || Date.now(), 
      expiryDate,
    });

    const savedCoupon = await newCoupon.save();

    res.status(201).json({ success: true, message: 'Coupon created successfully', coupon: savedCoupon });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Server Error!' });
  }
};

//Delete Coupon Controller 
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    await Coupon.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
  
module.exports = {getCoupon , createCoupon , deleteCoupon};