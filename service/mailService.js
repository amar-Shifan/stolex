const nodemailer = require('nodemailer');
const env = require('../utils/env_var')
console.log('mail serivce');


const transporter = nodemailer.createTransport({
    secure : true ,
    host : "smtp.gmail.com",
    port : 465,
    auth: {
        user : env.EMAIL_ID,
        pass : env.PASS_KEY
    }
})
console.log("transporter");


module.exports = async (to, sub, msg)=>{
    try{
        
        await transporter.sendMail({
            from : env.EMAIL_ID,
            to : to,
            subject : sub,
            html : msg
        })
        return true
    }catch(error){
        console.log("Failed to send email :", error);
        return false;
    }
}