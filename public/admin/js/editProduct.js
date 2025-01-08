
// Image handling functions
let imageCount = <%= product.images ? product.images.length : 0 %>;

function addImage() {
  imageCount++;
  const row = document.createElement('div');
  row.className = 'col-md-4 mb-3';
  row.innerHTML = `
    <div class="card h-100">
      <img src="/api/placeholder/300/200" class="card-img-top preview-img" alt="Image ${imageCount}">
      <div class="card-body d-flex flex-column justify-content-end">
        <input type="file" class="form-control file-input" name="images" accept="image/*">
      </div>
    </div>`;
  document.getElementById('image-container').appendChild(row);
  initializeFileInput(row.querySelector('.file-input'));
}

// Stock management functions
function addStockEntry() {
  const container = document.getElementById('stockContainer');
  const newEntry = document.createElement('div');
  newEntry.className = 'stock-entry mb-2';
  newEntry.innerHTML = `
    <div class="input-group">
      <input type="text" class="form-control" name="size[]" placeholder="Size" required>
      <input type="number" class="form-control" name="quantity[]" placeholder="Quantity" required>
      <button type="button" class="btn btn-danger" onclick="removeStockEntry(this)">Remove</button>
    </div>`;
  container.appendChild(newEntry);
}

function removeStockEntry(button) {
  button.closest('.stock-entry').remove();
}

// Validate form before submission
function validateForm() {
  const form = document.getElementById('updateForm');
  
  // Validate Product Name
  const name = document.getElementById('name').value.trim();
  if (!name) {
    showNotification('error', 'Product name is required.');
    return false;
  }

  // Validate Description
  const description = document.getElementById('description').value.trim();
  if (!description) {
    showNotification('error', 'Product description is required.');
    return false;
  }

  // Validate Price
  const price = document.getElementById('price').value.trim();
  if (!price || isNaN(price) || parseFloat(price) <= 0) {
    showNotification('error', 'Please enter a valid price.');
    return false;
  }

  // Validate Category
  const category = document.getElementById('parentCategoryFilter').value;
  if (!category) {
    showNotification('error', 'Product category is required.');
    return false;
  }

  // Validate Stock Entries
  const stockEntries = document.querySelectorAll('.stock-entry');
  if (stockEntries.length === 0) {
    showNotification('error', 'At least one stock entry (size and quantity) is required.');
    return false;
  }

  let stockValid = true;
  stockEntries.forEach(entry => {
    const size = entry.querySelector('input[name="size[]"]').value.trim();
    const quantity = entry.querySelector('input[name="quantity[]"]').value.trim();
    if (!size || !quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
      stockValid = false;
    }
  });

  if (!stockValid) {
    showNotification('error', 'Please provide valid stock entries with size and quantity.');
    return false;
  }

  // Validate Image Upload (existing or new)
  const images = document.querySelectorAll('input[name="images"]');
  const existingImages = document.querySelectorAll('input[name="existingImages[]"]:checked');
  if (images.length === 0 && existingImages.length === 0) {
    showNotification('error', 'Please upload or select at least one image.');
    return false;
  }

  for (let i = 0; i < images.length; i++) {
    const file = images[i].files[0];
    if (file) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

        // File type validation
        if (!allowedTypes.includes(file.type)) {
            showNotification('error', 'Only JPG, JPEG, PNG, and WEBP files are allowed.');
            return false;
        }

        // File size validation (5 MB = 5 * 1024 * 1024 bytes)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            showNotification('error', 'File size must be below 5 MB.');
            return false;
        }
      }
    }

  return true;
}

// Form submission
document.getElementById('updateForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  const formData = new FormData();
  
  // Add basic fields
  formData.append('name', document.getElementById('name').value);
  formData.append('description', document.getElementById('description').value);
  formData.append('price', document.getElementById('price').value);
  formData.append('brand', document.getElementById('brand').value);
  formData.append('category', document.getElementById('parentCategoryFilter').value);
  formData.append('status', document.getElementById('status').value);

  // Add stock data
  const sizes = document.getElementsByName('size[]');
  const quantities = document.getElementsByName('quantity[]');
  const stockData = [];
  for (let i = 0; i < sizes.length; i++) {
    stockData.push({
      size: sizes[i].value,
      quantity: quantities[i].value
    });
  }
  formData.append('stock', JSON.stringify(stockData));

  // Add existing and new images
  document.getElementsByName('existingImages[]').forEach(input => {
    if (!document.querySelector(`input[name="imagesToDelete[]"][value="${input.value}"]`).checked) {
      formData.append('existingImages', input.value);
    }
  });

  document.getElementsByName('images').forEach(input => {
    if (input.files[0]) {
      formData.append('images', input.files[0]);
    }
  });

  try {
    const response = await fetch(`/admin/updateProduct/<%= product._id %>`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const data = await response.json();

  if (data.success) {
    showNotification('success', 'Product updated successfully');
    setTimeout(() => {
      window.location.href = '/admin/products'; 
    }, 1000);
  } else {
    showNotification('error', data.message || 'Failed to update product');
  }
} catch (error) {
  console.error('Fetch error:', error);
  showNotification('error', 'An error occurred while updating the product.');
}
});

// Initialize cropping functionality
document.addEventListener('DOMContentLoaded', function() {
  const fileInputs = document.querySelectorAll('.file-input');
  fileInputs.forEach(input => initializeFileInput(input));
});

function initializeFileInput(input) {
  input.addEventListener('change', function(event) {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      const cropperImage = document.getElementById('cropperImage');
      const cropModal = new bootstrap.Modal(document.getElementById('cropModal'));
      let cropper;

      reader.onload = function(e) {
        cropperImage.src = e.target.result;
        cropModal.show();

        document.getElementById('cropModal').addEventListener('shown.bs.modal', function initCropper() {
          cropper = new Cropper(cropperImage, {
            aspectRatio: 1,
            viewMode: 2,
          });
          this.removeEventListener('shown.bs.modal', initCropper);
        });

        document.getElementById('cropButton').onclick = function() {
          const canvas = cropper.getCroppedCanvas();
          if (canvas) {
            canvas.toBlob(blob => {
              const previewImg = input.closest('.card').querySelector('.preview-img');
              const url = URL.createObjectURL(blob);
              previewImg.src = url;

              const croppedFile = new File([blob], `${Date.now()}_cropped.jpg`, { type: 'image/jpeg' });
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(croppedFile);
              input.files = dataTransfer.files;

              cropModal.hide();
              if (cropper) cropper.destroy();
            });
          }
        };
      };

      reader.readAsDataURL(file);
    }
  });
}