
// Open the Cancel Request Modal
document.querySelectorAll('.cancelButton').forEach((button) => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const form = e.target.closest('.cancelFormClass');
        const orderId = form.querySelector('input[name="orderId"]').value;

        // Set the order ID in the modal's hidden input field
        document.getElementById('cancelOrderId').value = orderId;

        // Show the modal
        const cancelModal = new bootstrap.Modal(document.getElementById('cancelReasonModal'));
        cancelModal.show();
    });
});

// Handle the Cancel Request Form Submission
document.getElementById('cancelReasonForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const formObject = Object.fromEntries(formData.entries());

    try {
        const res = await fetch('/orders/cancel', {
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


document.querySelectorAll('.returnButton').forEach((button) => {
    button.addEventListener('click', (e) => {
        const form = e.target.closest('.returnFormClass');
        const orderId = form.querySelector('input[name="orderId"]').value;

        // Set the order ID in the modal's hidden input field
        document.getElementById('modalOrderId').value = orderId;

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
