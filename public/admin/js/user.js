
document.getElementById('Search').addEventListener('input', debounce(async function(e) {
    const searchQuery = e.target.value.trim();
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = urlParams.get('page') || 1;
        
        const response = await fetch(`/admin/search?q=${encodeURIComponent(searchQuery)}&page=${currentPage}`);
        const data = await response.json();
        
        if (response.ok) {
            updateUsersTable(data.users);
            updatePagination(data.totalPages, data.currentPage);
        } else {
            showNotification('error', 'Error searching users');
        }
    } catch (error) {
        console.error('Search error:', error);
        showNotification('error', 'An error occurred while searching');
    }
}, 300));

// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Function to update the users table
function updateUsersTable(users) {
    const tbody = document.querySelector('table tbody');
    if (!users || users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">No users found.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>
                <div class="avatar avatar-md rounded-circle" style="width: 50px; height: 50px; overflow: hidden;">
                    <img src="${user.profileImage || '/images/avatar-2.png'}" alt="Profile" style="height: 100%; width: 100%; object-fit: contain;">
                </div>
            </td>
            <td><b>${user.username}</b></td>
            <td>${user.email}</td>
            <td>
                <div class="form-check form-switch">
                    <input
                        class="form-check-input"
                        type="checkbox"
                        id="user${user._id}"
                        ${user.block ? 'checked' : ''}
                        onchange="toggleUserStatus('${user._id}', this.checked)"
                    >
                    <label class="form-check-label" for="user${user._id}">
                        ${user.block ? 'Blocked' : 'Active'}
                    </label>
                </div>
            </td>
        </tr>
    `).join('');
}

// Function to update pagination
function updatePagination(totalPages, currentPage) {
    const paginationArea = document.querySelector('.pagination');
    if (!paginationArea) return;

    let paginationHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="?page=${i}">${i}</a>
            </li>
        `;
    }
    paginationArea.innerHTML = paginationHTML;
}

async function toggleUserStatus(userId, block) {
    try {
        const response = await fetch(`http://localhost:3000/admin/users/toggleStatus/${userId}`, { 
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ block }),
        });

        const data = await response.json();
        if (response.ok) {
            
            setTimeout(() => {
                let label = document.querySelector(`label[for="user${userId}"]`);
                label.textContent = block ? "Blocked" : "Active";
                showNotification('success',data.message)
            }, 100); 
        } else {
            showNotification('error',data.message);
        }

    } catch (error) {
        console.error('Error toggling user status:', error);
        showNotification('error','An error occurred. Please try again.')
    }
}

document.getElementById('addUserForm').addEventListener('submit', async function(e) {

        e.preventDefault();
        const form = e.target;
        
        if (!form.checkValidity()) {
            showNotification('error', 'Please fill out all the required fields.');
            return;
        }
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const email = document.getElementById('email').value.trim();
        const number = document.getElementById('phone').value.trim();
        const block = document.getElementById("status").value
        const confirmPassword = document.getElementById('confirm').value.trim();
        
            // Username validation
            if (!/^[A-Za-z ]+$/.test(username)) {
                showNotification('error', 'Name should contain only letters and spaces.');
                return;
            }
            
            // Email validation
            if (!/^([a-zA-Z0-9_]+)@([a-zA-Z0-9]+)\.([a-zA-Z]+)(\.[a-zA-Z]+)?$/.test(email)) {
                showNotification('error', 'Please enter a valid email address.');
                return;
            }
            
            // Phone number validation
            if (number.length !== 10 || !/^\d+$/.test(number)) {
                showNotification('error', 'Number should be 10 digits long and contain only numbers.');
                return;
            }
            
            // Password match validation
            if (password !== confirmPassword) {
                showNotification('error', 'Passwords do not match. Please re-enter your password.');
                return;
            }
            
            try {
                const response = await fetch('/admin/addUser', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username,
                        email: email,
                        password: password,
                        block: block,
                        phoneNumber: number,
                    })
                });

                console.log("Server response:", response);
                const data = await response.json();
                
                if (data.success) { 
                    showNotification('success', data.message);
                    console.log('data success');
                    // Reset form
                    this.reset();
                    
                    // Redirect after delay
                    setTimeout(() => {
                        location.href = "/admin/users";
                    }, 2000);
                } else {
                    showNotification('error', data.message);
                }
                
            } catch (error) {
                console.log("Error in fetch:", error);
                showNotification('error', 'An unexpected error occurred. Please try again later.');
            }
        });

        function showNotification(type, message, options = {}) {
            const {
                duration = 5000,
                position = 'top-right',
                animate = true
            } = options;

            // Remove existing toasts
            const existingToasts = document.querySelectorAll('.toast');
            existingToasts.forEach(toast => toast.remove());
            
            // Create new toast
            const toast = document.createElement('div');
            toast.className = `toast show ${animate ? 'animate__animated animate__fadeInRight' : ''}`;
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'assertive');
            toast.setAttribute('aria-atomic', 'true');
            
            const bgColor = type === 'success' ? 'bg-success' : 'bg-danger';
            const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
            const title = type === 'success' ? 'Success!' : 'Error!';
            
            toast.innerHTML = `
                <div class="toast-header ${bgColor} text-white">
                    <i class="fas ${icon} me-2"></i>
                    <strong class="me-auto">${title}</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            `;
            
            // Add to container
            document.querySelector('.toast-container').appendChild(toast);
            
            // Auto remove after duration
            setTimeout(() => {
                if (animate) {
                    toast.classList.remove('animate__fadeInRight');
                    toast.classList.add('animate__fadeOutRight');
                    setTimeout(() => {
                        toast.remove();
                    }, 1000);
                } else {
                    toast.remove();
                }
            }, duration);
            
            // Add click handler to close button
            const closeBtn = toast.querySelector('.btn-close');
            closeBtn.addEventListener('click', () => {
                if (animate) {
                    toast.classList.remove('animate__fadeInRight');
                    toast.classList.add('animate__fadeOutRight');
                    setTimeout(() => {
                        toast.remove();
                    }, 1000);
                } else {
                    toast.remove();
                }
            });

            // Return toast element in case needed for further manipulation
            return toast;
        }