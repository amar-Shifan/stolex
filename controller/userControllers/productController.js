// Product Controllers
const Product = require('../../model/productSchema')
const Category = require('../../model/categorySchema')
const Brand = require('../../model/brandSchema');

// Render Product Details Page
const getProductDetail = async (req, res) => {
    try {
      const productId = req.params.id;
  
      const product = await Product.findById(productId).populate('category');
      if (!product) {
        return res.status(404).send("Product not found");
      }
      
      const relatedProducts = await Product.find({
        category: product.category._id, 
        _id: { $ne: productId }, 
        status: 'Active', 
      })
        .limit(5); 
      
      res.render('user/product-details', { product, relatedProducts });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server error");
    }
  };

  // Render Shopping Page Controller
  const getShop = async (req, res) => {
    try {
        const { brand, size, category, search, sort, page = 1, limit = 8 } = req.query;

        const skip = (page - 1) * limit;

        const filter = {};

        if (brand) {
            filter.brand = { $in: Array.isArray(brand) ? brand : [brand] };
        }

        if (size) {
            filter["stock.size"] = { $in: Array.isArray(size) ? size : [size] };
        }

        if (category) {
            const categoryDocs = Array.isArray(category)
                ? await Category.find({ name: { $in: category } })
                : await Category.findOne({ name: category });

            if (categoryDocs) {
                filter.category = Array.isArray(categoryDocs)
                    ? { $in: categoryDocs.map(doc => doc._id) }
                    : categoryDocs._id;
            }
        }

        if (search) {
            const matchingCategories = await Category.find({ name: { $regex: search, $options: "i" } });
            const matchingCategoryIds = matchingCategories.map(category => category._id);

            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { category: { $in: matchingCategoryIds } },
            ];
        }

        const sortOption = {
            price_asc: { price: 1 },
            price_desc: { price: -1 },
            rating_desc: { rating: -1 },
            new_arrivals: { createdAt: -1 },
            name_asc: { name: 1 },
            name_desc: { name: -1 },
        }[sort] || {};

        const totalProducts = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit));

        const styles = await Category.find({ status: "Active", level: 1 });
        const brands = await Brand.find({});
        const sizes = await Product.distinct("stock.size");

        const selectedName = category || "All Products";

        res.render("user/footwear", {
            products,
            brands,
            sizes,
            styles,
            selectedName,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalProducts / limit),
            limit: parseInt(limit),
            searchQuery: search || "",
            sort: sort || "",
        });
    } catch (error) {
        console.error("Error in getShop controller:", error);
        res.render("error", { message: "Something went wrong!" });
    }
};


module.exports = {getProductDetail ,getShop}