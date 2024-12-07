const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    productId : {type : mongoose.Schema.Types.ObjectId , ref : 'Product' , required:true},
    size : {type :String , required:true},
    quantity : {type:Number , required:true , min:1 , default : 1},
    price : {type:Number , required:true},
    total : {type:Number , required:true}
})

const cartSchema = new mongoose.Schema({
    userId : {type :mongoose.Schema.Types.ObjectId , ref : "User" , required:true},
    items : [itemSchema],
    subtotal : {type:Number , required:true , default : 0},
    updatedAt : {type:Date , default : Date.now}
},{timestamps:true})


cartSchema.pre('save' , function (next) {
    this.subtotal = this.items.reduce((sum , item)=> sum + item.total , 0);
    this.updatedAt = Date.now();
    next()
})

module.exports = mongoose.model('Cart' , cartSchema);