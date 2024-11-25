function showNotification(type, message, options = {}) {
    const {
        duration = 5000, // Time the toast will remain visible
        animate = true // Whether to animate the toast
    } = options;

    // Check if the toast container already exists, and create it if not
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = 1070; // Ensure it is above other elements
        document.body.appendChild(toastContainer); // Add it to the DOM
    }

    // Create the toast
    const toast = document.createElement('div');
    toast.className = `toast show ${animate ? 'animate__animated animate__fadeInRight' : ''}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    // Customize the toast appearance and content based on the type (success or error)
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

    // Append the toast to the container
    toastContainer.appendChild(toast);

    // Automatically remove the toast after the specified duration
    setTimeout(() => {
        if (animate) {
            toast.classList.remove('animate__fadeInRight');
            toast.classList.add('animate__fadeOutRight');
            setTimeout(() => {
                toast.remove();
            }, 1000); // Allow the animation to finish before removing
        } else {
            toast.remove();
        }
    }, duration);

    // Handle manual closing of the toast
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
}
