// Listen for the change event on the discount type select field
document.getElementById('discountType').addEventListener('change', function() {
    const discountType = this.value; // Get the selected discount type
    const minPurchaseContainer = document.getElementById('minPurchaseContainer');
    const maxDiscountContainer = document.getElementById('maxDiscountContainer');
    
    // Toggle visibility based on the selected discount type
    if (discountType === 'percentage') {
      minPurchaseContainer.style.display = 'none'; // Hide the minimum purchase field for percentage discount
      maxDiscountContainer.style.display = 'block'; // Show the maximum discount field for percentage discount
    } else if (discountType === 'fixed') {
      minPurchaseContainer.style.display = 'block'; // Show the minimum purchase field for fixed discount
      maxDiscountContainer.style.display = 'none'; // Hide the maximum discount field for fixed discount
    }
  });

  // Initialize visibility of fields when the page loads
  document.addEventListener('DOMContentLoaded', function() {
    const discountType = document.getElementById('discountType').value;
    const minPurchaseContainer = document.getElementById('minPurchaseContainer');
    const maxDiscountContainer = document.getElementById('maxDiscountContainer');
    
    if (discountType === 'percentage') {
      minPurchaseContainer.style.display = 'none';
      maxDiscountContainer.style.display = 'block';
    } else if (discountType === 'fixed') {
      minPurchaseContainer.style.display = 'block';
      maxDiscountContainer.style.display = 'none';
    }
  });



  document.getElementById('addCouponBtn').addEventListener('click', () => {
    document.getElementById('couponModalLabel').innerText = 'Add Coupon';
    document.getElementById('couponForm').reset();
    const modal = new bootstrap.Modal(document.getElementById('couponModal'));
    modal.show();
  });

  document.getElementById('couponForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const formObject = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/admin/coupons/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formObject),
      });

      if (response.ok) {
        showNotification('success','Coupon added successfully')
        setTimeout(()=>{
          location.reload()
        },1000)
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
      alert('Failed to save coupon. Please try again.');
    }
  });

  // Delete coupon
  document.querySelectorAll('.delete-coupon-btn').forEach((button) => {
      button.addEventListener('click', async (e) => {
          e.preventDefault();

          // Get the coupon ID from the button's data-id attribute
          const couponId = e.target.getAttribute('data-id');

          // Confirm before deleting
          const confirmDelete = confirm('Are you sure you want to delete this coupon?');
          if (!confirmDelete) return;

          try {
              // Send DELETE request to the server
              const response = await fetch(`/admin/coupons/${couponId}`, {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
              });

              const result = await response.json();

              if (result.success) {
                  showNotification('success','Coupon deleted successfully!');
                  // Optionally, remove the row from the table
                  e.target.closest('tr').remove();
              } else {
                showNotification('error', result.message || 'Failed to delete coupon');
              }
          } catch (error) {
              console.error('Error deleting coupon:', error);
              showNotification('error','Server error. Please try again later.');
          }
      });
  });
