// Coupon Controllers
const Coupon = require('../../model/couponSchema')
const User = require('../../model/userSchema')

// Apply Coupon Controller
const applyCoupon = async (req, res) => {
    try {
      const { couponCode, cartTotal } = req.body;
  
      if (!cartTotal || isNaN(cartTotal)) {
        return res.status(400).json({ success: false, message: 'Invalid cart total' });
      }
  
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
  
      if (!coupon) {
        return res.status(400).json({ success: false, message: 'Invalid coupon code!' });
      }

      const userId = req.session.userId;
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

      const currentDate = new Date();
  
      if (currentDate < coupon.startDate || currentDate > coupon.expiryDate) {
        return res.status(400).json({ success: false, message: 'Coupon is expired!' });
      }
  
      const { minPurchaseAmount, discountType, discountValue, maxDiscountAmount } = coupon;
      if (minPurchaseAmount && cartTotal < minPurchaseAmount) {
        return res
          .status(400)
          .json({ success: false, message: `Minimum purchase amount is ₹${minPurchaseAmount}` });
      }
  
      const discountResponse = {
        discountType,
        discountValue,
        maxDiscountAmount,
      };
  
      res.status(200).json({ success: true, discount: discountResponse });
    } catch (error) {
      console.error('Error applying coupon:', error);
      return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
  };
  
  // Remove Coupon Controller
  const removeCoupon = (req, res) => {
    // Just return a success message for now since removing the coupon is client-side
    res.status(200).json({ success: true });
  };

const availableCoupon = async(req,res)=>{
  try {
    const userId = req.session.userId; // Assume user is authenticated
    const user = await User.findById(userId);

    // Fetch active coupons excluding used ones
    const usedCouponIds = user.usedCoupons.map(c => c.couponId.toString());
    const coupons = await Coupon.find({
        isActive: true,
        expiryDate: { $gte: new Date() },
        _id: { $nin: usedCouponIds },
    });

    res.status(200).json({ success: true, coupons });
  } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
  }

}
  

module.exports ={removeCoupon , applyCoupon ,availableCoupon};