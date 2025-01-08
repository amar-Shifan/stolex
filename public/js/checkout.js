//checkout process
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);
        const formObject = Object.fromEntries(formData.entries());

    try {
    const response = await fetch('/checkout/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formObject),
    });

    const data = await response.json();

    if (response.ok && data.success) {
        const orderId = data.orderId; 

        if (formObject.paymentMethod === 'razorpay') {
            const options = {
                key: data.razorpayKey,
                amount: data.totalAmount * 100, // Convert to paise
                currency: 'INR',
                name: 'Storex',
                description: 'Order Payment',
                order_id: data.razorpayOrderId, // Razorpay order ID from backend
                handler: async function (response) {
                    console.log('Razorpay Response:', response); // Log the Razorpay response

                    try {
                        const verifyResponse = await fetch('/payment/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(response),
                        });

                        const verifyData = await verifyResponse.json();

                        if (verifyResponse.ok && verifyData.success) {
                            showNotification('success', 'Order placed successfully!');
                            setTimeout(() => {
                                location.replace(`/order/success?orderId=${orderId}`);
                            }, 2000);
                        } else {
                            showNotification('error', 'Payment verification failed. Please try again.');
                            handlePaymentFailure();
                        }
                    } catch (error) {
                        console.error('Error verifying payment:', error);
                        showNotification('error', 'Something went wrong. Please contact support.');
                        handlePaymentFailure();
                    }
                },
                theme: { color: '#3399cc' },
            };

            const razorpay = new Razorpay(options);

            razorpay.on('payment.failed', async function (response) {
                console.error('Payment failed:', response);
                showNotification('error', 'Payment failed. Updating order status...');
                await handlePaymentFailure();
            });

            razorpay.open();

            async function handlePaymentFailure() {
                try {
                    const failureResponse = await fetch('/payment/failure', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ razorpay_order_id: data.razorpayOrderId }),
                    });

                    if (failureResponse.ok) {
                        showNotification('error', 'Payment failed. Please try again.');
                        addOrdersLink();
                    } else {
                        showNotification('error', 'Failed to update payment status. Please contact support.');
                    }
                } catch (error) {
                    console.error('Error updating payment status:', error);
                    showNotification('error', 'Something went wrong. Please contact support.');
                }
            }

            function addOrdersLink() {
                const message = 'Oops! Your payment didn’t go through. Don’t worry, you can check your order status on the Orders page and try again if needed.'; // User-friendly message

                // Create a background overlay for blur effect
                const overlay = document.createElement('div');
                overlay.id = 'popup-overlay';
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                overlay.style.backdropFilter = 'blur(5px)';
                overlay.style.zIndex = '999'; // Below popup but above other elements

                // Append the overlay to the body
                document.body.appendChild(overlay);

                // Create the popup
                const popup = document.createElement('div');
                popup.id = 'custom-popup';
                popup.style.position = 'fixed';
                popup.style.top = '50%';
                popup.style.left = '50%';
                popup.style.transform = 'translate(-50%, -50%)';
                popup.style.backgroundColor = '#f8f9fa';
                popup.style.borderRadius = '10px';
                popup.style.padding = '20px';
                popup.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
                popup.style.zIndex = '1000'; // Above overlay

                popup.innerHTML = `
                    <h2 style="color: #ff4757; margin-bottom: 10px; font-size: 24px;">Oops!</h2>
                    <p style="color: #343a40; font-size: 16px; margin-bottom: 20px;">${message}</p>
                    <button id="redirect-button" style="margin-top: 10px; padding: 10px 20px; background-color: #28a745; color: #fff; border: none; border-radius: 5px; font-size: 14px; cursor: pointer;">
                        Go to Orders
                    </button>
                `;

                document.body.appendChild(popup);

                document.getElementById('redirect-button').onclick = function () {
                    location.href = '/orders';
                };
            }

        }


        else if (formObject.paymentMethod === 'cod') {
            showNotification('success', 'Order placed successfully!');
            setTimeout(() => {
                window.location.href = `/order/success?orderId=${orderId}`
            }, 2000);
        } else if (formObject.paymentMethod === 'wallet'){
            showNotification('success','Order placed successfully!')
            setTimeout(() => {
                window.location.replace(`/order/success?orderId=${orderId}`); 
            }, 2000);
        }else {
            showNotification('error', 'Invalid payment method selected.');
                }
            } else {
                showNotification('error', data.message || 'Failed to process checkout.');
            }
        } catch (error) {
            console.error('Error processing checkout:', error);
            showNotification('error', 'Something went wrong. Please try again later.');
        }
    });
});

// Showing availble Coupons
document.getElementById('showCouponsBtn').addEventListener('click', async () => {
    const couponContainer = document.getElementById('availableCoupons');
    couponContainer.innerHTML = ''; // Clear existing coupons
    couponContainer.style.display = 'none';

    try {
        const response = await fetch('/available-coupons'); // Adjust the route as per your setup
        const data = await response.json();

        if (data.success && data.coupons.length > 0) {
            data.coupons.forEach(coupon => {
                const couponDiv = document.createElement('div');
                couponDiv.classList.add('coupon-card', 'd-flex', 'align-items-center', 'justify-content-between', 'p-2', 'border', 'mb-2', 'rounded');

                couponDiv.innerHTML = `
                    <div>
                        <h6 class="mb-0">${coupon.code}</h6>
                        <small>${coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`} off</small>
                    </div>
                `;

                const copyButton = document.createElement('button');
                copyButton.classList.add('btn', 'btn-outline-secondary', 'btn-sm', 'copy-btn');
                copyButton.innerHTML = '<i class="bi bi-clipboard"></i> Copy';

                // Add click event listener to the button
                copyButton.addEventListener('click', (e) => {
                    e.preventDefault(); // Prevent default behavior
                    copyCoupon(coupon.code); // Call the copy function
                });

                // Append the button to the couponDiv
                couponDiv.appendChild(copyButton);

                couponContainer.appendChild(couponDiv);
            });
            couponContainer.style.display = 'block';
        } else {
            couponContainer.innerHTML = '<p>No available coupons.</p>';
            couponContainer.style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching coupons:', error);
    }
});

function copyCoupon(code) {
    navigator.clipboard.writeText(code).then(() => {
        document.getElementById('couponMessage').textContent = `Copied "${code}" to clipboard!`;
        document.getElementById('couponMessage').style.display = 'block';
        setTimeout(() => {
            document.getElementById('couponMessage').style.display = 'none';
        }, 3000);
    }).catch(err => {
        console.error('Error copying coupon:', err);
        document.getElementById('errorMessage').textContent = 'Failed to copy the coupon.';
        document.getElementById('errorMessage').style.display = 'block';
        setTimeout(() => {
            document.getElementById('errorMessage').style.display = 'none';
        }, 3000);
    });
}


// adding the user Address
document.getElementById('addAddress').addEventListener('submit' , async(e)=>{
e.preventDefault();

const form = e.target 
const formData = new FormData(form);

try {
    
    const formObject = Object.fromEntries(formData.entries());

    const response = await fetch('/addAddress' , {
        method : 'post',
        headers : {'Content-Type' : 'application/json'},
        body : JSON.stringify(formObject)
    })

    const data = await response.json();

    if(data.success){
        showNotification('success' , data.message)
        setTimeout(()=>{
            location.reload()
        },2000)
    }else{
        showNotification('error',data.message)
    }


} catch (error) {
    console.log(error, 'error in adding the user Address')
    showNotification('error',"Something went wrong!")
}
})


// Function to apply the coupon
$('#applyCouponBtn').on('click', function () {
    var couponCode = $('#couponCode').val();
  
    if (couponCode) {
      $.ajax({
        url: '/apply-coupon', // Your API endpoint to validate/apply the coupon
        method: 'POST',
        data: {
          couponCode: couponCode,
          cartTotal: parseFloat($('#subtotalAmount').text()), // Pass subtotal to backend
        },
        success: function (response) {
          if (response.success) {
            var subtotal = parseFloat($('#subtotalAmount').text());
            var shipping = 50; // Fixed shipping cost
  
            // Extract discount details
            var discount = response.discount;
            var discountAmount = 0;
  
            // Apply discount based on type
            if (discount.discountType === 'percentage') {
              discountAmount = (discount.discountValue / 100) * subtotal;
              // Apply max discount cap if applicable
              if (discount.maxDiscountAmount) {
                discountAmount = Math.min(discountAmount, discount.maxDiscountAmount);
              }
            } else if (discount.discountType === 'fixed') {
              discountAmount = discount.discountValue;
            }
  
            // Calculate total
            var total = subtotal - discountAmount + shipping;
  
            // Update UI
            $('#discountAmount').text(discountAmount.toFixed(2)); // Show calculated discount
            $('#totalAmount').text(total.toFixed(2)); // Update total with shipping
            $('#couponMessage')
              .text('Coupon applied successfully!')
              .show();
            $('#errorMessage').hide();
            $('#removeCouponBtn').show();
            $('#applyCouponBtn').hide();
          } else {
            // Show error if coupon is invalid
            $('#errorMessage').text(response.message || 'Invalid coupon code!').show();
            $('#couponMessage').hide();
          }
        },
        error: function (jqXHR, textStatus, errorThrown) {
          // Handle AJAX error
          if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
            // Display the message from the backend (if present)
            $('#errorMessage').text(jqXHR.responseJSON.message).show();
          } else {
            // Generic error handling
            $('#errorMessage').text('Error applying coupon. Please try again later.').show();
          }
          $('#couponMessage').hide();
        },
      });
    } else {
      alert('Please enter a coupon code.');
    }
  });
  
  
  // Function to remove the coupon
  $('#removeCouponBtn').on('click', function () {
    var subtotal = parseFloat($('#subtotalAmount').text());
    var total = subtotal + 50; // Add shipping back without discount
  
    // Reset UI values
    $('#discountAmount').text('0.00'); // Reset discount
    $('#totalAmount').text(total.toFixed(2)); // Update total
    $('#couponCode').val(''); // Clear coupon input
    $('#couponMessage').hide();
    $('#errorMessage').hide();
    $('#removeCouponBtn').hide();
    $('#applyCouponBtn').show();
  });
  