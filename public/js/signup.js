
document.getElementById('password').addEventListener('focus', function() {
    document.getElementById('password-criteria').style.display = 'block';
});

document.getElementById('password').addEventListener('input', function(e) {
    const password = e.target.value;
    let strength = 0;
    const criteria = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*]/.test(password)
    };

    updateCriteriaIcon('length-criteria', criteria.length);
    updateCriteriaIcon('uppercase-criteria', criteria.uppercase);
    updateCriteriaIcon('lowercase-criteria', criteria.lowercase);
    updateCriteriaIcon('number-criteria', criteria.number);
    updateCriteriaIcon('special-criteria', criteria.special);

    strength += criteria.length ? 20 : 0;
    strength += criteria.uppercase ? 20 : 0;
    strength += criteria.lowercase ? 20 : 0;
    strength += criteria.number ? 20 : 0;
    strength += criteria.special ? 20 : 0;

    const strengthMeter = document.getElementById('strength-meter');
    const strengthText = document.getElementById('strength-text');
    
    strengthMeter.style.width = strength + '%';
    
    if (strength <= 40) {
        strengthMeter.style.backgroundColor = '#dc3545';
        strengthText.textContent = 'Password Strength: Weak';
    } else if (strength <= 80) {
        strengthMeter.style.backgroundColor = '#ffc107';
        strengthText.textContent = 'Password Strength: Medium';
    } else {
        strengthMeter.style.backgroundColor = '#68c3a3';
        strengthText.textContent = 'Password Strength: Strong';
    }
});

function updateCriteriaIcon(criteriaId, isValid) {
    const criteriaElement = document.getElementById(criteriaId);
    const iconElement = criteriaElement.querySelector('.criteria-icon');
    
    if (isValid) {
        iconElement.className = 'criteria-icon valid';
        iconElement.textContent = '✓';
    } else {
        iconElement.className = 'criteria-icon invalid';
        iconElement.textContent = '✕';
    }
}

document.getElementById('form').addEventListener('submit', (e) => {

    e.preventDefault();
    const form = e.target;
    
    
    if (!form.checkValidity()) {
        showNotification('error','Please fill out all the required fields.')
        return;
    }
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const email = document.getElementById('email').value.trim();
    const number = document.getElementById('number').value.trim();
    const confirmPassword = document.getElementById('confirm').value.trim();
    const dob = document.getElementById('dob').value.trim();
    
    // Your existing validation code
    if (!/^[A-Za-z ]+$/.test(username)) {
        showNotification('error','Name should contain only letters and spaces.');
        return;
    }
    
    if (!/^([a-zA-Z0-9_]+)@([a-zA-Z0-9]+)\.([a-zA-Z]+)(\.[a-zA-Z]+)?$/.test(email)) {
        showNotification('error','Please enter a valid email address.');
        return;
    }
    
    if (number.length !== 10 || !/^\d+$/.test(number)) {
        showNotification('error','Number should be 10 digits long and contain only numbers.')
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('error','Passwords do not match. Please re-enter your password.')
        return;
    }

    const validPassword = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) &&/[@$!%*?&#]/.test(password)
    if(!validPassword) return showNotification('error' , 'Password does not meet all criteria.');

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            email: email,
            password: password,
            dob: dob,
            phoneNumber: number,
        })
    })
    .then((response) => {
        console.log("Server response:", response);
        return response.json();
    })
    .then((data) => {
        if(data.success){
            showNotification('success',data.message);
            setTimeout(() => {
                location.href = "/verify";
            }, 2000);
        }else{
            showNotification('error',data.message);
        }
        
        
    })
    .catch((error) => {
        showNotification('error',"An error occurred. Please try again later.");
    })
});