
document.addEventListener('DOMContentLoaded',()=>{
	const removeButtons = document.querySelectorAll('.removeItem');

	removeButtons.forEach((button)=>{
		button.addEventListener('click', async(e)=>{
			e.preventDefault();
			const productId = button.dataset.id;
			confirmationUtil.confirm({
                message: 'Are you sure to remove this item?',
                confirmText: 'Yes',
                cancelText: 'No',
                callback: async (confirmed) => {
                    if (!confirmed) return; 

                    try {
                        const response = await fetch(`/wishlist/remove/${productId}`, {
                            method: 'DELETE',
                            credentials: 'include',
                        });

                        const data = await response.json();

                        if (data.success) {
                            showNotification('success', data.message);
                            setTimeout(()=>{
                                window.location.reload(); 
                            },1000)
                        } else {
                            showNotification('error', data.message);
                        }
                    } catch (error) {
                        console.error(error);
                        showNotification('error', 'Something went wrong');
                    }
                },
            });
		})
	})
})
document.getElementById('addToCartForm').addEventListener('submit',async(e)=>{
    e.preventDefault()
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
                setTimeout(()=>{
                    location.reload()
                },2000)
            } else {
                showNotification('error', data.message);
            }
			
        } catch (error) {
            console.error('Error adding to cart:', error); 
            showNotification('error', 'Something went wrong');
        }
})