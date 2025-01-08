//OfferCleanup (Cron job)
const cron = require('node-cron');
const Offer = require('../model/offerSchema'); 
const Product = require('../model/productSchema'); 
const Category = require('../model/categorySchema'); 

const offerCleanupJob = () => {
  cron.schedule('0 * * * *', async () => { 
    const now = new Date();

    try {

      const expiredOffers = await Offer.find({ expiryDate: { $lte: now } });

      if (expiredOffers.length === 0) {
        return;
      }

      const expiredOfferIds = expiredOffers.map(offer => offer._id);

      const productResult = await Product.updateMany(
        { offer: { $in: expiredOfferIds } }, 
        { 
          $unset: { offer: "", discountedPrice: "" }, 
        }
      );

      const categoryResult = await Category.updateMany(
        { offerId: { $in: expiredOfferIds } }, 
        { 
          $unset: { offerId: "" } 
        }
      );

      const offerResult = await Offer.deleteMany({ _id: { $in: expiredOfferIds } });

    } catch (error) {
      console.error('Error during cron job execution:', error.message);
    }
  });
};


module.exports = offerCleanupJob;
