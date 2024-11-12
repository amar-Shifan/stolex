const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const addressSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    landmark: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: Number, required: true },
    phoneNumber: { type: Number, required: true },
    placeDetails: { type: String }
});

const userSchema = new mongoose.Schema(
    {
        username: { type: String , required : true},
        email: { type: String, required: true, unique: true },
        password: { type: String },
        phoneNumber: { type: String ,required:false , sparse:true , default: null},
        profile: { type: String },
        block: { type: Boolean, required: true, default: false },
        address: [addressSchema],
        verified : {type : Boolean},
        googleId: {type : String , default:null}
    },
    {
        timestamps: true
    }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
      return next();
    }
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (err) {
      next(err);
    }
});

module.exports = mongoose.model('User',userSchema);
