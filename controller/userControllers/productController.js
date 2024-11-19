const Product = require('../../model/productSchema')

const getProductDetail = async(req,res)=>{

    const productId = req.params.id;
    const product = await Product.findById(productId);
    if(!product){
        req.status(404).send("product not found");
    }
    console.log(product.name);
    
    res.render('user/product-details',{product});
}


module.exports = {getProductDetail}