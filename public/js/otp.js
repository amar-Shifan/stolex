
document.addEventListener('DOMContentLoaded', () => {
    const countdownElement = document.getElementById('countdown');
    const resendButton = document.getElementById('resendBtn');
    const otpVerificationForm = document.getElementById('otpVerification');
    
    let timeLeft = <%= remainingTime %>; 
    
    function updateTimer() {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            countdownElement.textContent = "0";
            resendButton.disabled = false;
        } else {
            countdownElement.textContent = timeLeft;
            timeLeft--;
        }
    }

    let timerInterval = setInterval(updateTimer, 1000);
    updateTimer(); 

    resendButton.addEventListener('click', async () => {
    try {
        resendButton.disabled = true;

        const response = await fetch('/resend-otp', { method: 'POST' });
        const data = await response.json();

        if (data.success) {
            showNotification('success',data.message)
            const now = Date.now();
            const newExpiresAt = data.expiresAt;
            timeLeft = Math.max(0, Math.floor((newExpiresAt - now) / 1000)); 

            clearInterval(timerInterval);
            timerInterval = setInterval(updateTimer, 1000);
            updateTimer(); 
        } else {
            showNotification('error', data.message);
        }
    } catch (error) {
        showNotification('error', 'Failed to resend OTP');
    } finally {
        resendButton.disabled = false;
    }
    });



    otpVerificationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        try {
            const formObject = Object.fromEntries(formData.entries());
            const response = await fetch("/otp-verification", {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formObject)
            });

            const data = await response.json();

            if (data.success) {
                showNotification('success', data.message);
                setTimeout(() => {
                    window.location.href = '/'
                }, 2000);
            } else {
                showNotification('error', data.message);
            }
        } catch (error) {
            console.log(error);
            showNotification('error', 'Something went wrong!');
        }
    });
});

