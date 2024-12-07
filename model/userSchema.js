const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        username: { type: String , required : true},
        email: { type: String, required: true, unique: true },
        password: { type: String },
        phoneNumber: { type: String ,required:false , sparse:true , default: null},
        profile: { type: String },
        dob:{type: Date },
        block: { type: Boolean, required: true, default: false },
        address:[{type : mongoose.Schema.Types.ObjectId , ref:'Address'}],  
        verified : {type : Boolean},
        googleId: {type : String , default:null}
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('User',userSchema);
