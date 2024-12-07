// OTP Schema 
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email : {type:String , required : true},
    otp : {type :String , required : true},
    expiresAt : {type : Date , required : true}
});

// Create a TTL index
otpSchema.index({expiresAt: 1 },{expireAfterSeconds: 60});

module.exports = mongoose.model('Otp', otpSchema);