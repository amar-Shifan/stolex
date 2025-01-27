// Cart Controllers
const User = require('../../model/userSchema');
const Product = require('../../model/productSchema');
const Cart = require('../../model/cartSchema')

//Render Cart Controller
const getCart = async(req,res)=>{
    try {
        const userId = req.session.userId
        const cart = await Cart.findOne({userId}).populate('items.productId');
        res.render('user/cart' ,{cart});
    } catch (error) {
        res.render('user/error',{message:"Something went wrong cant load"})
    }   
}

// Add to Cart Cotroller
const addToCart = async (req, res) => {
    try {
        const { size, productId, quantity } = req.body;
        const userId = req.session.userId;


        if (!productId) {
            return res.status(400).json({ success: false, message: "Product ID is required" });
        }
        if (!size) {
            return res.status(400).json({ success: false, message: "Size is required" });
        }
        if (!quantity || parseInt(quantity, 10) <= 0) {
            return res.status(400).json({ success: false, message: "Quantity must be a positive number" });
        }
        if (!userId) {
            return res.status(400).json({ success: false, message: "User is not logged in" });
        }


        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ success: false, message: "User does not exist" });
        }


        const product = await Product.findById(productId);
        if (!product) {
            return res.status(400).json({ success: false, message: "Product not found" });
        }


        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }


        const existingItem = cart.items.find(
            (item) => item.productId.toString() === productId && item.size === size
        );

        if (existingItem) {
            return res.status(400).json({
                success: false,
                message: "Product with this size already exists in the cart. You can update it from there.",
            });
        } else {
            cart.items.push({
                productId,
                size,
                quantity: parseInt(quantity, 10),
                price: product.price,
                total: parseInt(quantity, 10) * product.price,
            });
        }

        await cart.save();

        res.status(200).json({ success: true, message: "Successfully added to cart" });
    } catch (error) {
        console.error("Add to Cart Error:", error);
        res.status(500).json({ success: false, message: "Something went wrong!" });
    }
};

// Remove From Cart Controller
const remove = async (req, res) => {
    try {
        
      const itemId = req.params.id;
      const userId = req.session.userId;
  
      if (!userId) {
        return res.status(400).json({ success: false, message: "User is not logged in" });
      }
  
      const cart = await Cart.findOneAndUpdate(
        { userId },
        { $pull: { items: { _id: itemId } } },
        { new: true } 
      );
  
      if (!cart) {
        return res.status(400).json({ success: false, message: "Cart not found" });
      }
  
      cart.subtotal = cart.items.reduce((total, item) => total + item.total, 0);
      await cart.save(); 
  
      res.status(200).json({ success: true, message: "Removed the product", cart });
  
    } catch (error) {
      console.error("Error removing item from cart:", error.message);
      res.status(500).json({ success: false, message: "Something went wrong!" });
    }
  };
  
  //UPDATING QUANTITY
  const updateQuantity = async (req, res) => {
    try {
        const { id } = req.params; 
        const { quantity } = req.body; 
        const userId = req.session.userId;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User not logged in' });
        }

        if (!id) {
            return res.status(400).json({ success: false, message: 'Item ID not provided' });
        }
        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({ success: false, message: 'Invalid quantity' });
        }

        const MAX_QUANTITY = 10;
        if (quantity > MAX_QUANTITY) {
            return res.status(400).json({ 
                success: false, 
                message: `Quantity cannot exceed the maximum limit of ${MAX_QUANTITY}` 
            });
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const item = cart.items.find((item) => item._id.toString() === id);

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in the cart' });
        }

        const product = await Product.findById(item.productId);
        const stockForSize = product.stock.find(stock => stock.size === item.size);

        if (!stockForSize || quantity > stockForSize.quantity) {
            return res.status(400).json({ success: false, message: 'Requested quantity exceeds available stock' });
        }

        // Update item quantity and total
        item.quantity = quantity;
        item.total = item.quantity * (product.discountedPrice || item.price);

        // Save cart
        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Item quantity updated successfully',
            updatedItem: { id: item._id, quantity: item.quantity, total: item.total },
            subtotal: cart.subtotal,
        });
    } catch (error) {
        console.error('Update Quantity Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};



  
module.exports = {getCart , addToCart , remove ,updateQuantity}