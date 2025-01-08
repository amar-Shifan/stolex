	
		// sizes and stocks 
        document.addEventListener('DOMContentLoaded', () => {
            const sizeOptions = document.querySelectorAll('.size-option');
            const totalStockElement = document.getElementById('total-stock');
            const selectedStockElement = document.getElementById('selected-stock');
            const quantityInput = document.getElementById('quantity');
            const minusButton = document.querySelector('.quantity-left-minus');
            const plusButton = document.querySelector('.quantity-right-plus');
        
            const sizeInput = document.getElementById('selected-size');
            const quantityInputHidden = document.getElementById('selected-quantity');
            const visibleQuantityInput = document.getElementById('quantity');
        
            // Default stock to show total stock
            let totalStock = parseInt(totalStockElement.textContent, 10);
            let selectedStock = null; // To track the selected stock
            let selectedSize = null;  // To track the selected size
        
            // Function to determine stock status
            function getStockStatus(quantity) {
                if (quantity === 0) {
                    return 'No Stock';
                } else if (quantity <= 5) {
                    return 'Low Stock';
                } else if (quantity <= 10) {
                    return 'Limited Stock';
                } else {
                    return 'In Stock';
                }
            }
        
            // Add event listeners to size options
            sizeOptions.forEach(option => {
                option.addEventListener('click', (event) => {
                    event.preventDefault(); // Prevent default link behavior
        
                    sizeInput.value = option.dataset.size;
                    // Highlight the selected size
                    sizeOptions.forEach(opt => opt.classList.remove('selected'));
                    option.classList.add('selected');
        
                    // Update stock display for the selected size
                    selectedStock = parseInt(option.dataset.quantity, 10); // Get stock from data attribute
                    selectedSize = option.dataset.size; // Track the selected size
        
                    // Display stock status instead of quantity
                    // Clear previous stock status classes
                    selectedStockElement.className = 'stock-status';
        
                    // Update stock status and apply corresponding class
                    if (selectedStock === 0) {
                        selectedStockElement.textContent = "No Stock";
                        selectedStockElement.classList.add('no-stock');
                    } else if (selectedStock <= 5) {
                        selectedStockElement.textContent = "Low Stock";
                        selectedStockElement.classList.add('low-stock');
                    } else if (selectedStock <= 10) {
                        selectedStockElement.textContent = "Limited Stock";
                        selectedStockElement.classList.add('limited-stock');
                    } else {
                        selectedStockElement.textContent = "In Stock";
                        selectedStockElement.classList.add('in-stock');
                    }
        
                    // Reset and update quantity input
                    quantityInput.value = 1; // Reset quantity to 1
                    quantityInput.max = selectedStock; // Update max value for the input field
                });
            });
        
            // Increment and decrement quantity
            if (minusButton && plusButton && quantityInput) {
        
                
                // Decrement the quantity when the minus button is clicked
                minusButton.addEventListener('click', function (event) {
                    event.preventDefault(); // Prevent any default behavior
                    let currentValue = parseInt(quantityInput.value);
                    if (currentValue > 1) {
                        quantityInput.value = currentValue - 1;
                        quantityInputHidden.value = visibleQuantityInput.value;
                    }
                });
        
                // Increment the quantity when the plus button is clicked
                plusButton.addEventListener('click', function (event) {
                    event.preventDefault(); // Prevent any default behavior
                    let currentValue = parseInt(quantityInput.value);
                    let maxValue = parseInt(quantityInput.getAttribute('max'));
        
                    if (selectedStock === null) {
                        // alert("Please select a size first!");
                        confirmationUtil.confirm({
                            message: 'Please select a size first!',
                            confirmText: 'Ok',
                            cancelText: 'Cancel',
                        })
                        return;
                    }
        
                    if (currentValue < maxValue) {
                        quantityInput.value = currentValue + 1;
                        quantityInputHidden.value = visibleQuantityInput.value;
                    }
                });
        
        
                // add to wishlist 
                const wishlistContainer = document.querySelector('.wishlist-container');
        
                wishlistContainer.addEventListener('click', () => {
                    // Toggle the "active" class to change the color
                    wishlistContainer.classList.toggle('active');
                });
        
        
            }
        
            // Reset selection when clicking outside the size options (optional)
            document.body.addEventListener('click', (event) => {
                if (!event.target.closest('.size-wrap') && !event.target.closest('.input-group')) {
                    sizeOptions.forEach(opt => opt.classList.remove('selected'));
                    selectedStock = null; // Reset selected stock
                    selectedSize = null; // Reset selected size
                    selectedStockElement.textContent = 'Select a size';
                    quantityInput.value = 1;
                    quantityInput.max = totalStock; // Reset max to total stock
                }
            });
        
            // add to cart 
            // Update hidden quantity input whenever the visible quantity changes
            visibleQuantityInput.addEventListener('input', () => {
                quantityInputHidden.value = visibleQuantityInput.value;
            });
        
        
            document.getElementById('addToCart').addEventListener('submit', async (e) => {
            e.preventDefault(); 
        
            console.log(location.pathname)
            const authenticated = await isAuth(null, 'Oops! Login first', location.pathname );
        
            if (authenticated) {
                const form = e.target; 
                const formData = new FormData(form);
        
                try {
        
                    const objectForm = Object.fromEntries(formData.entries());
                    console.log('Form Data:', objectForm); 
        
        
                    const response = await fetch('/cart/add', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(objectForm),
                    });
        
        
                    const data = await response.json().catch(() => ({
                        success: false,
                        message: 'Invalid server response',
                    }));
        
        
                    if (data.success) {
                        showNotification('success', data.message);
                    } else {
                        showNotification('error', data.message);
                    }
                    
                } catch (error) {
                    console.error('Error adding to cart:', error); 
                    showNotification('error', 'Something went wrong');
                }
            }
            });
        });
        const form = document.getElementById('wishlistForm');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const formObject = Object.fromEntries(formData.entries());
        
            try {
                const res = await fetch('/wishlist/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json', // Ensure Content-Type is correct
                    },
                    body: JSON.stringify(formObject), // Convert the object to a JSON string
                });
        
                const data = await res.json();
                if (data.success) {
                    showNotification('success', data.message);
                } else {
                    showNotification('error', data.message);
                }
            } catch (error) {
                showNotification('error', 'Something went wrong!');
                console.log('Error:', error);
            }
        });
        
        
        
        
        
        // zooming image 
        const zoomImages = document.querySelectorAll('.zoom-image');
        
        zoomImages.forEach((image) => {
            image.addEventListener('mousemove', (e) => {
                const imageRect = image.getBoundingClientRect();
                const x = e.clientX - imageRect.left;
                const y = e.clientY - imageRect.top;
                
                const xPercent = (x / imageRect.width) * 100;
                const yPercent = (y / imageRect.height) * 100;
                
                image.style.transformOrigin = `${xPercent}% ${yPercent}%`;
                image.style.transform = 'scale(1.5)';
            });
            
            image.addEventListener('mouseleave', () => {
                image.style.transform = 'scale(1)';
            });
        });
        
        
        