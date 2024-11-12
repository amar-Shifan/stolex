// generate OTP
const generateOtp = () => {
    return Math.floor(1000 + Math.random() * 9000); // 4-digit OTP
};

module.exports = generateOtp