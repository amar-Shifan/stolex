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