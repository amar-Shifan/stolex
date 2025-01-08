document.getElementById("pincode").addEventListener("input", async function () {
    const pincode = this.value.trim();
    const stateField = document.getElementById("state");
    const cityField = document.getElementById("city");
    const resultDiv = document.getElementById("validationResult");

    if (pincode.length === 6) {

        stateField.value = "";
        cityField.value = "";

        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            const data = await response.json();

            if (data[0].Status === "Success") {
                const postOffices = data[0].PostOffice;

                // Populate State and City fields
                stateField.value = postOffices[0].State || "";
                cityField.value = postOffices[0].District || "";

                // Populate Place dropdown
                postOffices.forEach((office) => {
                    const option = document.createElement("option");
                    option.value = office.Name;
                    option.textContent = office.Name;
                });

                resultDiv.innerHTML = `<p class="text-success">Details fetched successfully!</p>`;
            } else {
                resultDiv.innerHTML = `<p class="text-danger">Invalid Pincode or No Data Found.</p>`;
            }
        } catch (error) {
            console.error("Error fetching pincode data:", error);
            resultDiv.innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
        }
    }
});

document.getElementById('userProfile').addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const form = e.target;
    const formData = new FormData(form); 

    try {
        const response = await fetch('/addProfile', {
            method: 'POST',
            body: formData, 
        });

        const data = await response.json();

        if (data.success) {
            showNotification('success', data.message);
        } else {
            showNotification('error', data.message);
        }
    } catch (error) {
        console.log('Something went wrong', error);
        showNotification('error', 'Something went wrong!');
    }
});

document.querySelector('.hover-overlay').addEventListener('click', () => {
    document.querySelector('input[type="file"]').click();
});

document.querySelector('input[type="file"]').addEventListener('change',(e)=>{
    const file = e.target.files[0];
    if(file){
        const reader = new FileReader();
        reader.onload = (e) => {
            const profileImage = document.querySelector('.profile-image');
            profileImage.src = e.target.result;
            profileImage.classList.add('updated');
            setTimeout(() => profileImage.classList.remove('updated'), 500);
        };
        reader.readAsDataURL(file);
    }
})


// udpating the user details 

document.getElementById("userDetailsForm").addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form); 

    
    try {
        const formObject = Object.fromEntries(formData.entries());

        const response = await fetch("/updateDetails", { 
            method: 'PATCH', 
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(formObject)
        });

        const data = await response.json();

        if (data.success) {
            showNotification('success', data.message);
        } else {
            showNotification('error', data.message);
        }

    } catch (error) {
        console.log(error, "error in updating the details");
        showNotification('error', 'Something went wrong!');
    }
});


// adding the user Address

document.getElementById('address-form').addEventListener('submit' , async(e)=>{
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
                location.href = '/user_profile'
            },2000)
        }else{
            showNotification('error',data.message)
        }


    } catch (error) {
        console.log(error, 'error in adding the user Address')
        showNotification('error',"Something went wrong!")
    }
})


document.getElementById('passwordResetForm').addEventListener('submit' , async(e)=>{
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    try {
        const formObject = Object.fromEntries(formData.entries());

        const response = await fetch('/changePassword' , {
            method : 'PATCH',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify(formObject)
        })
        const data = await response.json();

        if(data.success){
            showNotification('success',data.message)
        }else{
            showNotification('error', data.message)
        }

    } catch (error) {
        console.log(error);
        showNotification('error' , 'Something went Wrong!')
    }
} )

document.getElementById('forgotPasswordForm').addEventListener('submit' , async(e)=>{
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    try {

        const formObject = Object.fromEntries(formData.entries());
        const response = await fetch('/verifyEmail' , {
            method:'post' ,
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify(formObject)
        })
        
        const data = await response.json();

        if(data.success) showNotification('success' , data.message)
        else showNotification('error' , data.message)


    } catch (error) {
        console.log(error);
        showNotification('error','Something went wrong!')
    }
})

// autofill the editAddressModal
document.getElementById('editAddressModal').addEventListener('show.bs.modal', (e) => {
    const button = e.relatedTarget; // The button that triggered the modal
    const modal = e.target;

    // Extract data from the button's attributes
    const fullName = button.getAttribute('data-fullname');
    const address = button.getAttribute('data-address');
    const city = button.getAttribute('data-city');
    const state = button.getAttribute('data-state');
    const pincode = button.getAttribute('data-pincode');
    const phoneNumber = button.getAttribute('data-phonenumber');
    const addressId = button.getAttribute('data-id');

    // Prefill modal fields
    modal.querySelector('#name').value = fullName;
    modal.querySelector('#address').value = address;
    modal.querySelector('#city').value = city;
    modal.querySelector('#state').value = state;
    modal.querySelector('#pincode').value = pincode;
    modal.querySelector('#phoneNumber').value = phoneNumber;
    modal.querySelector('#addressId').value = addressId;
});


document.getElementById('editAddresssForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    try {
        const formObject = Object.fromEntries(formData.entries());

        if (!formObject.fullName || !formObject.address || !formObject.city || !formObject.state || !formObject.pincode || !formObject.phoneNumber) {
            showNotification('error', 'All fields are required!');
            return;
        }

        const res = await fetch('/address/edit', {
            method: 'PATCH', 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formObject),
        });

        const data = await res.json();

        if (res.ok && data.success) {
            showNotification('success', data.message);

            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showNotification('error', data.message || 'Failed to update address.');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('error', 'Something went wrong!');
    }
});


document.addEventListener('click',async(e)=>{

    if(e.target.id === 'delete-address'){

        const id = e.target.getAttribute('data-id');

        if (!id) {
            showNotification('error', 'Address ID not found!');
            return;
        }
        try {
            const res = await fetch(`/address/delete/${id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
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
    }
    
})