document.getElementById("resetPasswordForm").addEventListener('submit' , async(e)=>{
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    try {

        const formObject = Object.fromEntries(formData.entries());
        const response = await fetch('/resetPassword' , {
            method:'post' ,
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify(formObject)
        })
        
        const data = await response.json();

        if(data.success){
            showNotification('success' , data.message)
            setTimeout(()=>{
                location.href = '/user_profile'
            },2000)
        } 
        else showNotification('error' , data.message)
        
    } catch (error) {
        console.log(error);
        showNotification('error','Something went wrong!')
    }
})