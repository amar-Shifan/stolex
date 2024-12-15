const confirmationUtil = {
    // Initialize the modal if it doesn't exist
    init: function () {
        if (!document.getElementById('confirmationModal')) {
            const modalHTML = `
                <div class="modal fade" id="confirmationModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="confirmationTitle">Confirm Action</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <p id="confirmationMessage"></p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="cancelButton">Cancel</button>
                                <button type="button" class="btn btn-primary" id="confirmButton">Confirm</button>
                            </div>
                        </div>
                    </div>
                </div>`;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    },

    // Main confirmation function
    confirm: function ({
        title = 'Confirm Action',
        message = 'Are you sure you want to proceed?',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        confirmButtonClass = 'btn-primary',
        icon = null,
        callback = null
    } = {}) {
        this.init();

        const modalElement = document.getElementById('confirmationModal');
        const confirmationModal = new bootstrap.Modal(modalElement); // Initialize modal instance

        // Set modal content
        document.getElementById('confirmationTitle').textContent = title;
        document.getElementById('confirmationMessage').innerHTML = icon
            ? `<i class="bi ${icon}"></i> ${message}`
            : message;

        const confirmButton = document.getElementById('confirmButton');
        const cancelButton = document.getElementById('cancelButton');

        // Set button text
        confirmButton.textContent = confirmText;
        cancelButton.textContent = cancelText;

        // Update confirm button class
        confirmButton.className = `btn ${confirmButtonClass}`;

        // Remove existing event listeners using cloneNode
        const newConfirmButton = confirmButton.cloneNode(true);
        confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);

        const newCancelButton = cancelButton.cloneNode(true);
        cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);

        // Add confirm button handler
        newConfirmButton.addEventListener('click', () => {
            confirmationModal.hide(); // Properly hide modal
            if (callback && typeof callback === 'function') {
                callback(true);
            }
        });

        // Add cancel button handler (invokes callback with false)
        newCancelButton.addEventListener('click', () => {
            confirmationModal.hide(); // Properly hide modal
            if (callback && typeof callback === 'function') {
                callback(false);
            }
        });

        // Ensure close button in header works properly
        const closeButton = modalElement.querySelector('.btn-close');
        closeButton.addEventListener('click', () => {
            confirmationModal.hide(); // Properly hide modal
            if (callback && typeof callback === 'function') {
                callback(false);
            }
        });

        // Show the modal
        confirmationModal.show();
    }
};

// Optional: Add it to window object for global access
window.confirmationUtil = confirmationUtil;
