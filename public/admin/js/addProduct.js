let imageCount = 3;

  function addImage() {
    imageCount++;
    const row = document.createElement('div');
    row.className = 'col-md-4 mb-3';
    row.innerHTML = 
      `<div class="card h-100">
        <img src="/api/placeholder/300/200" class="card-img-top preview-img" alt="Image ${imageCount}">
        <div class="card-body d-flex flex-column justify-content-end">
          <input type="file" class="form-control file-input" name="images[]" accept="image/*" required>
        </div>
      </div>`
    ;
    document.getElementById('image-container').appendChild(row);
  }

  document.addEventListener('change', function(e) {
    if (e.target && e.target.classList.contains('file-input')) {
      const file = e.target.files[0];
      const preview = e.target.closest('.card').querySelector('.preview-img');
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          preview.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    }
  });


  
  document.getElementById('submitFormBtn').addEventListener('click', async () => {
    const form = document.getElementById('productForm');
    const formData = new FormData(form);
    
    // Client-side validation
    if (!validateForm(formData)) return;

    try {
      const response = await fetch('/admin/add-products', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        showNotification('error', data.message || 'Something went wrong');
      } else {
        showNotification('success', data.message || 'Product added successfully');
        form.reset(); 
        document.getElementById('dynamic-fields').innerHTML = ''; 
        document.getElementById('dynamic-brand').innerHTML = ''; 
        setTimeout(()=>{
          location.href = '/admin/products'
        },1000)
      }
    } catch (error) {
      showNotification('error', 'Network error, please try again later');
    }
  });

  function validateForm(formData) {

  const requiredFields = ['name', 'description', 'price', 'category', 'status'];

  for (let field of requiredFields) {
    const value = formData.get(field)?.trim();
    if (!value) {
      showNotification('error', `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`);
      return false;
    }

    if (field === 'name' && value.length < 3) {
      showNotification('error', 'Product name must be at least 3 characters long.');
      return false;
    }

    if (field === 'description' && value.length < 10) {
      showNotification('error', 'Product description must be at least 10 characters long.');
      return false;
    }

    if (field === 'price') {
      const price = parseFloat(value);
      if (isNaN(price) || price <= 0) {
        showNotification('error', 'Please enter a valid price greater than 0.');
        return false;
      }
    }
  }

  // Validate images
  const imageFiles = formData.getAll('images').filter(file => file.size > 0);

  // Ensure exactly 3 images are uploaded
  if (imageFiles.length < 3) {
    showNotification('error', 'Exactly 3 images are required.');
    return false;
  } else if (imageFiles.length > 4) {
    showNotification('error', 'Only 4 images are allowed.');
    return false;
  }

  // Additional validation for each image (type and size)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5 MB

  for (let file of imageFiles) {
    // File type validation
    if (!allowedTypes.includes(file.type)) {
      showNotification('error', 'Only JPG, JPEG, PNG, and WEBP files are allowed.');
      return false;
    }

    // File size validation
    if (file.size > maxSize) {
      showNotification('error', 'File size must be below 5 MB.');
      return false;
    }
  }

  const stockEntries = formData.getAll('stock');

  let stockValid = true;
  stockEntries.forEach(entry => {
    const size = entry.size?.trim();
    const quantity = parseInt(entry.quantity);
    console.log(quantity , entry.stock)
    if (!size || isNaN(quantity) || quantity <= 0) {
      stockValid = false;
    }
  });

  if (!stockValid) {
    showNotification('error', 'Please provide valid stock entries with size and quantity.');
    return false;
  }

  return true;
}


  //sizes handler and brand 
  async function handleCategoryChange(selectElement) {
  const selectedOption = selectElement.options[selectElement.selectedIndex];
  const parentCategory = selectedOption.getAttribute('data-parent');

  const sizeStockContainer = document.getElementById('dynamic-fields');
  const brandContainer = document.getElementById('dynamic-brand');

  sizeStockContainer.innerHTML = ''; // Clear previous size fields
  brandContainer.innerHTML = '';     // Clear previous brand fields

  let sizes = [];
  let brands = [];

  try {
    // Fetch brands dynamically from the backend
    const res = await fetch('/admin/getBrands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentCategory }),
    });

    const data = await res.json();
    if (data.success) {
      brands = data.brands; // Set fetched brands
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error fetching brands:', error);
  }

  // Set sizes based on parentCategory
  if (parentCategory === 'topwear') {
    sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  } else if (parentCategory === 'footwear') {
    sizes = ['6', '7', '8', '9', '10'];
  }

  // Dynamically generate size and quantity fields
  if (sizes.length > 0) {
    sizes.forEach((size, index) => {
      const fieldHTML = `
        <div class="col-md-6 mb-3">
          <label for="size" class="form-label">Size</label>
          <input type="text" class="form-control" name="stock[${index}][size]" value="${size}" readonly>
        </div>
        <div class="col-md-6 mb-3">
          <label for="quantity" class="form-label">Quantity</label>
          <input type="number" class="form-control" name="stock[${index}][quantity]" placeholder="Stock for size ${size}" min="0" oninput="this.value = this.value < 0 ? 0 : this.value" required>
        </div>
      `;
      sizeStockContainer.innerHTML += fieldHTML;
    });
  }

  // Dynamically generate brand select dropdown
  if (brands.length > 0) {
    let brandHTML = `
      <label for="brand" class="form-label">Brand</label>
      <select class="form-select" id="brand" name="brand" required>
        <option value="">Select a Brand</option>
    `;
    brands.forEach(brand => {
      brandHTML += `<option value="${brand}">${brand}</option>`;
    });
    brandHTML += `</select>`;
    brandContainer.innerHTML = brandHTML;
  } else {
    brandContainer.innerHTML = `<p>No brands available for this category.</p>`;
  }
}




  // cropping images
  document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.file-input').forEach((input) => {
    input.addEventListener('change', function (event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        const cropperImage = document.getElementById('cropperImage');
        const cropModal = new bootstrap.Modal(document.getElementById('cropModal'));
        let cropper; // Unique cropper instance for each modal session

        reader.onload = function (e) {
          cropperImage.src = e.target.result; // Set image source for cropping
          cropModal.show();

          // Initialize CropperJS only after the modal is fully shown
          document.getElementById('cropModal').addEventListener(
            'shown.bs.modal',
            function initCropper() {
              if (cropper) cropper.destroy(); // Destroy existing instance (if any)
              cropper = new Cropper(cropperImage, {
                aspectRatio: 1,
                viewMode: 2,
              });

              // Unbind to prevent stacking this listener
              this.removeEventListener('shown.bs.modal', initCropper);
            }
          );

          // Bind "Crop & Save" functionality
          document.getElementById('cropButton').onclick = function () {
            if (cropper) {
              const canvas = cropper.getCroppedCanvas();

              if (canvas) {
                canvas.toBlob((blob) => {
                  const previewImage = input.closest('.card').querySelector('.preview-img');
                  const url = URL.createObjectURL(blob);
                  previewImage.src = url; // Display cropped image

                  // Replace original file input with cropped image blob
                  const croppedFile = new File([blob], `${Date.now()}_cropped.jpg`, { type: 'image/jpeg' });
                  const dataTransfer = new DataTransfer();
                  dataTransfer.items.add(croppedFile);
                  input.files = dataTransfer.files;

                  // Clean up and hide modal
                  cropModal.hide();
                  cropper.destroy(); // Properly destroy cropper instance
                });
              }
            }
          };

          // Ensure Cropper instance cleanup after modal hides
          document.getElementById('cropModal').addEventListener(
            'hidden.bs.modal',
            function cleanupCropper() {
              if (cropper) {
                cropper.destroy(); // Destroy the cropper instance
                cropper = null; // Avoid memory leaks
              }
              this.removeEventListener('hidden.bs.modal', cleanupCropper); // Avoid stacking
            }
          );
        };

        reader.readAsDataURL(file); // Load file as Data URL
      }
    });
  });
});



