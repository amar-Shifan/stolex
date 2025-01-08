document.getElementById("forgotPasswordForm").addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    try {
        const formObject = Object.fromEntries(formData.entries());
        const response = await fetch('/verifyEmail', {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formObject)
        });

        const data = await response.json();

        if (data.success) {
            showNotification('success', data.message);
        } else {
            showNotification('error', data.message);
        }

    } catch (error) {
        console.error(error);
        showNotification('error', 'Something went wrong!');
    }
});