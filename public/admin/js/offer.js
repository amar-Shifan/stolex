
///
document.getElementById('addCategoryOfferBtn').addEventListener('click', () => {
    showOfferModal('categories');
});

document.getElementById('addProductOfferBtn').addEventListener('click', () => {
    showOfferModal('products');
});
function showOfferModal(type) {
    document.getElementById('applyToType').value = type; // Dynamically set the type
    console.log('applyToType value:', document.getElementById('applyToType').value); // Debugging

    // Update modal title
    document.getElementById('offerModalLabel').innerText = `Add ${type === 'categories' ? 'Category' : 'Product'} Offer`;

    const dynamicFields = document.getElementById('dynamicFields');
    dynamicFields.innerHTML = '';

    // Fetch categories or products dynamically
    fetch(`/admin/offers/${type}`)
        .then(response => response.json())
        .then(items => {
            const selectElement = document.createElement('select');
            selectElement.classList.add('form-control');
            selectElement.id = type === 'categories' ? 'categoryList' : 'productList';
            selectElement.name = type === 'categories' ? 'categoryId' : 'productId';

            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = `Select ${type === 'categories' ? 'Category' : 'Product'}`;
            placeholderOption.disabled = true;
            placeholderOption.selected = true;
            selectElement.appendChild(placeholderOption);

            items.forEach(item => {
            const option = document.createElement('option');
            option.value = item._id;  // Ensure that _id is correct
            option.textContent = item.name;
            selectElement.appendChild(option);
        });

            const label = document.createElement('label');
            label.textContent = `Select ${type === 'categories' ? 'Category' : 'Product'}`;
            label.classList.add('form-label'); // Add styling class if needed
            label.setAttribute('for', selectElement.id);

            dynamicFields.appendChild(label);
            dynamicFields.appendChild(selectElement);
        })
        .catch(error => {
            console.error('Error fetching items:', error);
            dynamicFields.innerHTML = `<p class="text-danger">Unable to load ${type}</p>`;
        });

    const modal = new bootstrap.Modal(document.getElementById('offerModal'));
    modal.show();
}


document.getElementById('offerForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const formObject = Object.fromEntries(formData.entries());

    console.log(formObject);  

    try {
        const response = await fetch('/admin/offers/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formObject)  // Send as JSON
        });
        
        // Check if the response is okay
        if (response.ok) {
            const data = await response.json();
            showNotification('success', data.message);
            setTimeout(()=>{
              location.reload();
            },1000) // Reload the page to show the updated data
        } else {
            const errorData = await response.json();
            showNotification('error', errorData.message || 'Error in creating offer.');
        }

        // Close and reset modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('offerModal'));
        modal.hide();
        event.target.reset();

    } catch (error) {
        console.error('Error saving offer:', error);
        showNotification('error','Failed to save offer. Please try again.');
    }
});




  // Function to refresh offers list (to be implemented)
  function refreshOffersList() {
    // Fetch and update offers in the respective tabs
    // This is a placeholder and should be implemented based on your specific requirements
    console.log('Refreshing offers list');
  }



// deleting the offer
let debounceTimeout;
document.querySelectorAll('.deleteProductBtn').forEach(button => {
    button.addEventListener('click', async (event) => {
        const offerId = event.target.getAttribute('data-offer-id'); 

        clearTimeout(debounceTimeout);

        debounceTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`/admin/offers/product/${offerId}/delete`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const data = await response.json(); // Parse the response as JSON

                if (response.ok) {
                    showNotification('success', data.message); // Display success message
                    setTimeout(() => {
                        location.reload(); // Reload the page after 2 seconds
                    }, 2000);
                } else {
                    showNotification('error', data.message || 'Error deleting the offer');
                }
            } catch (error) {
                console.error('Error deleting the offer:', error);
                showNotification('error','Failed to delete offer. Please try again.');
            }
        }, 500); // Delay the actual request by 500ms (debounce time)
    });
});

document.querySelectorAll('.deleteCategoryBtn').forEach(button => {
    button.addEventListener('click', async (event) => {
        const offerId = event.target.getAttribute('data-offer-id'); 

        // Clear the previous debounce timeout (if any) to ensure only one request is processed
        clearTimeout(debounceTimeout);

        // Set a debounce timeout of 500ms (adjustable as needed)
        debounceTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`/admin/offers/category/${offerId}/delete`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const data = await response.json(); // Parse the response as JSON

                if (response.ok) {
                    showNotification('success', data.message); // Display success message
                    setTimeout(() => {
                        location.reload(); // Reload the page after 2 seconds
                    }, 2000);
                } else {
                    showNotification('error', data.message || 'Error deleting the offer');
                }
            } catch (error) {
                console.error('Error deleting the offer:', error);
                showNotification('error','Failed to delete offer. Please try again.');
            }
        }, 500); // Delay the actual request by 500ms (debounce time)
    });
});