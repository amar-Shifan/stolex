// Add event listener to all cancel buttons
document.querySelectorAll('.cancelButton').forEach((button) => {
    button.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent form submission

        // Find the closest form
        const form = e.target.closest('.cancelFormClass');
        if (!form) return;

        // Extract order and item IDs from the form
        const orderId = form.querySelector('input[name="orderId"]').value;
        const itemId = form.querySelector('input[name="itemId"]').value;

        console.log(orderId)
        console.log(itemId);
        

        // Set the order ID and item ID in the modal's hidden input fields
        document.getElementById('cancelOrderId').value = orderId;
        document.getElementById('cancelItemId').value = itemId;

        // Show the cancel reason modal
        const cancelModal = new bootstrap.Modal(document.getElementById('cancelReasonModal'));
        cancelModal.show();
    });
});

// Handle the cancellation reason form submission
document.getElementById('cancelReasonForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission

    // Collect form data (including the cancellation reason)
    const formData = new FormData(e.target);
    const formObject = Object.fromEntries(formData.entries());

    try {
        // Send cancellation data to the backend
        const res = await fetch('/orders/cancel', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formObject),
        });

        const data = await res.json();

        // Handle the response from the server
        if (data.success) {
            showNotification('success', data.message);
            setTimeout(() => {
                window.location.reload(); // Reload the page after 1.5 seconds
            }, 1500);
        } else {
            showNotification('error', data.message);
        }
    } catch (error) {
        console.error(error);
        showNotification('error', 'Something went wrong!');
    }
});



document.querySelectorAll('.returnButton').forEach((button) => {
    button.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent default form submission
        
        // Find the form and extract data
        const form = e.target.closest('.returnFormClass');
        if (!form) return;

        const orderId = form.querySelector('input[name="orderId"]').value;
        const itemId = form.querySelector('input[name="itemId"]').value;

        // Set the order ID in the modal's hidden input field
        document.getElementById('modalOrderId').value = orderId;
        document.getElementById('modalItemId').value = itemId;

        // Show the modal
        const returnModal = new bootstrap.Modal(document.getElementById('returnReasonModal'));
        returnModal.show();
    });
});


document.getElementById('returnReasonForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const formObject = Object.fromEntries(formData.entries());

    try {
        const res = await fetch('/orders/return', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formObject),
        });
        const data = await res.json();

        // Handle response
        if (data.success) {
            showNotification('success', data.message);
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showNotification('error', data.message);
        }
    } catch (error) {
        console.error(error);
        showNotification('error', 'Something went wrong!');
    }
});

// Repay Script
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.repay-button').forEach((button) => {
        button.addEventListener('click', async (e) => {
            const orderId = e.target.dataset.orderId;

            try {
                const response = await fetch('/repay/order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId }),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    const options = {
                        key: data.razorpayKey,
                        amount: data.totalAmount * 100, // Convert to paise
                        currency: 'INR',
                        name: 'Storex',
                        description: 'Order Repayment',
                        order_id: data.razorpayOrderId, // Razorpay order ID from backend
                        handler: async function (response) {
                            try {
                                const verifyResponse = await fetch('/payment/verify', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(response),
                                });

                                const verifyData = await verifyResponse.json();

                                if (verifyResponse.ok && verifyData.success) {
                                    showNotification('success','Payment successful! Order updated.')
                                    location.reload();
                                } else {
                                    showNotification('error','Payment verification failed. Please try again.')
                                }
                            } catch (error) {
                                console.error('Error verifying payment:', error);
                                showNotification('error','Something went wrong. Please contact support.')
                            }
                        },
                        theme: { color: '#3399cc' },
                    };

                    const razorpay = new Razorpay(options);
                    razorpay.open();
                } else {
                    showNotification('error',data.message || 'Failed to create repay order. Please try again.' )
                }
            } catch (error) {
                console.error('Error creating repay order:', error);
                showNotification('error','Something went wrong. Please contact support.')
            }
        });
    });
});


