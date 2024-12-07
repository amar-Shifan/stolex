// isAuthenticated function
async function isAuth(route, message, currentRoute) {
    try {
        const res = await fetch('/isAuth');
        const data = await res.json();

        if (data.success) {
            
            if (route) {
                location.href = route;
                return false; 
            }
            return true; 
        }

        
        showNotification('error', message);
        setTimeout(() => {
            window.location.href = `/user-login?redirect=${encodeURIComponent(currentRoute)}`;
        }, 3000);

        return false; 
        
    } catch (error) {
        console.error('Error in isAuth:', error); 
        showNotification('error', 'Something went wrong!');
        return false;
    }
}


