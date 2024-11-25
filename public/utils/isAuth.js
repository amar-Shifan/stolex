
async function isAuth(route , message , currentRoute){
    try {
        const res = await fetch('/isAuth')
        const  data  = await res.json();
        if(data.success) return location.href = route;
        
        showNotification("error",message);
        setTimeout(() => {
            window.location.href = `/user-login?redirect=${currentRoute}`
        }, 3000);
        
    } catch (error) {
        console.log(error)
        showNotification('error' , 'Something went wrong!')
    }
}

