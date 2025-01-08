document.querySelector('.password-toggle').addEventListener('click', function() {
    const passwordInput = document.querySelector('#password');
    const icon = this;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
e.preventDefault(); 

const loginButton = document.getElementById('loginButton');
const password = document.getElementById('password').value.trim();
const email = document.getElementById('email').value.trim();

if (!email || !password) {
return showNotification('error', 'All fields are required');
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
return showNotification('error', 'Please enter a valid email address');
}

if (password.length < 6) {
return showNotification('error', 'Password must be at least 6 characters long');
}

try {
loginButton.disabled = true
const res = await fetch("/user-login", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email,
        password,
    }),
    credentials: 'include', 
});

const data = await res.json();

if (data.success) {
    showNotification('success', data.message);

    if (data.redirectUrl) {
        setTimeout(() => {
            window.location.href = data.redirectUrl;
        }, 2000); 
    }
} else {
    showNotification('error', data.message);
}
} catch (error) {
console.error('Login Error:', error); 
showNotification('error', 'Something went wrong!');
}
finally{
loginButton.disabled = false
}
});
