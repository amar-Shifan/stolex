const env = require('./env_var')
const mongoose = require('mongoose')

const connectDB = async()=>{
    try {
        const conn = await mongoose.connect(env.MONGO_URL);
        console.log(`MONGO connected : ${conn.connection.host}`)
    } catch (error) {
        console.log(`Error in connnection : ${error.message}`);
        process.exit(1); 
    }
}

module.exports = connectDB;