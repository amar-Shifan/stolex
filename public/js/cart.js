
document.addEventListener('DOMContentLoaded', () => {
    const removeButtons = document.querySelectorAll('.removeItem');

    removeButtons.forEach((button) => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();

            const itemId = button.dataset.id;

            
            confirmationUtil.confirm({
                message: 'Are you sure to remove this item?',
                confirmText: 'Yes',
                cancelText: 'No',
                callback: async (confirmed) => {
                    if (!confirmed) return; 

                    try {
                        const response = await fetch(`/cart/remove/${itemId}`, {
                            method: 'DELETE',
                            credentials: 'include',
                        });

                        const data = await response.json();

                        if (data.success) {
                            showNotification('success', data.message);
                            window.location.reload(); 
                        } else {
                            showNotification('error', data.message);
                        }
                    } catch (error) {
                        console.error(error);
                        showNotification('error', 'Something went wrong');
                    }
                },
            });
        });
    });

    // increment and decrement quantity
    const quantityControls = document.querySelectorAll('.quantity-control');

quantityControls.forEach((control) => {
    const decrementBtn = control.querySelector('.decrement-btn');
    const incrementBtn = control.querySelector('.increment-btn');
    const quantityInput = control.querySelector('.quantity-input');
    const itemId = decrementBtn.dataset.id;

    // Function to update subtotal and total dynamically
    const updateTotals = () => {
        let subtotal = 0;

        // Loop through each cart item and calculate the subtotal
        document.querySelectorAll('.product-cart').forEach(cartItem => {
            const quantity = parseInt(cartItem.querySelector('.quantity-input').value);
            const price = parseFloat(cartItem.querySelector('.price').textContent.replace('₹', '').trim());
            subtotal += price * quantity;  // Multiply price by quantity to get item total
        });

        // Update the displayed subtotal and total
        const subtotalElement = document.getElementById('subtotal');
        const grandTotalElement = document.getElementById('grand-total');

        if (subtotalElement && grandTotalElement) {
            subtotalElement.textContent = `₹${subtotal}`;
            grandTotalElement.textContent = `₹${subtotal}`;
        }
    };

    const updateCartUI = (data) => {
        const updatedItem = data.updatedItem;

        // Update item quantity and total in the table
        const itemElement = document.querySelector(`[data-id="${updatedItem.id}"]`).closest('.product-cart');
        const quantityInput = itemElement.querySelector('.quantity-input');
        const totalElement = itemElement.querySelector('.total');
        
        if (quantityInput && totalElement) {
            quantityInput.value = updatedItem.quantity;
            totalElement.textContent = `₹${updatedItem.total}`;
        }

        // Recalculate and update totals
        updateTotals();
    };

    const sendAjaxRequest = async (newQuantity) => {
        try {
            const response = await fetch(`/cart/update-quantity/${itemId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ quantity: newQuantity }),
            });

            const data = await response.json();
            if (data.success) {
                updateCartUI(data);
            } else {
                showNotification('error' , data.message);
            }
        } catch (error) {
            console.error(error);
            showNotification('error','Something went wrong. Please try again.');
        }
    };

    decrementBtn.addEventListener('click', () => {
        const currentQuantity = parseInt(quantityInput.value);
        if (currentQuantity > 1) {
            sendAjaxRequest(currentQuantity - 1);
        } else {
            showNotification('error','Minimum quantity is 1');
        }
    });

    incrementBtn.addEventListener('click', () => {
        const currentQuantity = parseInt(quantityInput.value);
        if (currentQuantity < 10) {
            sendAjaxRequest(currentQuantity + 1);
        } else {
            showNotification('error','Maximum quantity is 10');
        }
    });

    quantityInput.addEventListener('change', () => {
        const newQuantity = parseInt(quantityInput.value);
        if (!isNaN(newQuantity) && newQuantity >= 1 && newQuantity <= 10) {
            sendAjaxRequest(newQuantity);
        } else {
            showNotification('error', 'Invalid quantity');
            quantityInput.value = decrementBtn.dataset.quantity;
        }
    });

    // Initial call to update totals when the page loads
    updateTotals();
});

});




	