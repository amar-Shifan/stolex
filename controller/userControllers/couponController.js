const Coupon = require('../../model/couponSchema')

const applyCoupon = async (req, res) => {
    try {
      const { couponCode, cartTotal } = req.body;
  
      // Check if cartTotal is provided and is a number
      if (!cartTotal || isNaN(cartTotal)) {
        return res.status(400).json({ success: false, message: 'Invalid cart total' });
      }
  
      console.log('Received coupon code:', couponCode);
      console.log('Received cart total:', cartTotal);
  
      // Convert coupon code to uppercase for database matching
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
  
      if (!coupon) {
        console.log('Coupon not found or inactive');
        return res.status(400).json({ success: false, message: 'Invalid coupon code!' });
      }
  
      // Log coupon details for debugging
      console.log('Coupon found:', coupon);
  
      // Validate coupon dates
      const currentDate = new Date();
      console.log('Current Date:', currentDate);
      console.log('Coupon Start Date:', coupon.startDate);
      console.log('Coupon Expiry Date:', coupon.expiryDate);
  
      if (currentDate < coupon.startDate || currentDate > coupon.expiryDate) {
        return res.status(400).json({ success: false, message: 'Coupon is expired!' });
      }
  
      // Check if minimum purchase amount is satisfied
      const { minPurchaseAmount, discountType, discountValue, maxDiscountAmount } = coupon;
      if (minPurchaseAmount && cartTotal < minPurchaseAmount) {
        return res
          .status(400)
          .json({ success: false, message: `Minimum purchase amount is ₹${minPurchaseAmount}` });
      }
  
      // Prepare discount response
      const discountResponse = {
        discountType,
        discountValue,
        maxDiscountAmount,
      };
  
      // Return success response with discount details
      res.status(200).json({ success: true, discount: discountResponse });
    } catch (error) {
      console.error('Error applying coupon:', error);
      return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
  };
  
  
  
  
  
  const removeCoupon = (req, res) => {
    // Just return a success message for now since removing the coupon is client-side
    res.status(200).json({ success: true });
  };
  

module.exports ={removeCoupon , applyCoupon}