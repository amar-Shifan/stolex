// Approve cancel request
const handleApproveCancel = (orderId, itemId = null) => {
    const url = itemId 
        ? `/admin/orders/${orderId}/items/${itemId}/approve-cancel` 
        : `/admin/orders/${orderId}/approve-cancel`;

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showNotification('success','Cancel request approved successfully.');
            setTimeout(()=>{
                location.reload();
            },2000)
        } else {
            showNotification('error','Failed to approve the cancel request.');
        }
    })
    .catch(err => showNotification('error','An error occurred. Please try again.'));
};

// Reject cancel request
const handleRejectCancel = (orderId, itemId = null) => {
    const url = itemId 
        ? `/admin/orders/${orderId}/items/${itemId}/reject-cancel` 
        : `/admin/orders/${orderId}/reject-cancel`;

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showNotification('success','Cancel request rejected successfully.');
            location.reload();
        } else {
            showNotification('error','Failed to reject the cancel request.');
        }
    })
    .catch(err => showNotification('error','An error occurred. Please try again.') );
};

// Approve cancel button click
document.querySelectorAll('.approve-item-cancel').forEach(button => {
    button.addEventListener('click', () => {
        const orderId = button.dataset.orderId;
        const itemId = button.dataset.itemId; // Optional for item-specific
        handleApproveCancel(orderId, itemId);
    });
});

// Reject cancel button click
document.querySelectorAll('.reject-item-cancel').forEach(button => {
    button.addEventListener('click', () => {
        const orderId = button.dataset.orderId;
        const itemId = button.dataset.itemId; // Optional for item-specific
        handleRejectCancel(orderId, itemId);
    });
});

// Approve return
const handleApprove = (orderId, itemId = null) => {
    const url = itemId 
        ? `/admin/orders/${orderId}/items/${itemId}/approve-return` 
        : `/admin/orders/${orderId}/approve-return`;

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showNotification('success','Return approved successfully.');
            location.reload();
        } else {
            showNotification('error','Failed to approve the return.');
        }
    })
    .catch(err => showNotification('error','An error occurred. Please try again.') );
};

// Reject return
const handleReject = (orderId, itemId = null) => {
    const url = itemId 
        ? `/admin/orders/${orderId}/items/${itemId}/reject-return` 
        : `/admin/orders/${orderId}/reject-return`;

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showNotification('error','Return rejected successfully.')
            location.reload();
        } else {
            showNotification('error','Failed to reject the return.')
        }
    })
    .catch(err => showNotification('error','An error occurred. Please try again.'));
};

// Approve button click
document.querySelectorAll('.approve-item-return').forEach(button => {
    button.addEventListener('click', () => {
        const orderId = button.dataset.orderId;
        const itemId = button.dataset.itemId; // Optional for item-specific
        handleApprove(orderId, itemId);
    });
});

// Reject button click
document.querySelectorAll('.reject-item-return').forEach(button => {
    button.addEventListener('click', () => {
        const orderId = button.dataset.orderId;
        const itemId = button.dataset.itemId; // Optional for item-specific
        handleReject(orderId, itemId);
    });
});


