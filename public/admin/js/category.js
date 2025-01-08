
const name = document.getElementById('categoryName');
const description = document.getElementById('categoryDescription');
const type = document.getElementById('categoryType');
const status = document.getElementById('categoryStatus');
const parentCategory = document.getElementById('parentCategoryFilter');

document.getElementById('categoryForm').addEventListener('submit', (event) => {
    
    event.preventDefault();
    fetch('/admin/createCategory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: name.value,
            description: description.value,
            parentCategory: parentCategory.value || null,
            status: status.value,
            type: type.value
        })
    })
    .then((res) => res.json())
    .then((data) => {
        if (data.success) {
            showNotification('success', data.message);
            setTimeout(() => {
                location.href = '/admin/categories';
            }, 2000);
        } else {
            showNotification('error', data.message);
        }
    })
    .catch((error) => {
        showNotification('error', 'An unexpected error occurred. Please try again later.');
    });

});



document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('categoryType').addEventListener('change', toggleParentCategory);

});

function toggleParentCategory() {
    const type = document.getElementById('categoryType').value;
    const parentDiv = document.getElementById('parentCategoryDiv');
    const parentSelect = document.getElementById('parentCategory');
    
    parentDiv.style.display = type === 'subcategory' ? 'block' : 'none';
    parentSelect.required = type === 'subcategory';
}

function resetForm() {
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('modalTitle').textContent = 'Create Category';
    toggleParentCategory();
}     

function showToast(message, type = 'info') {
    showNotification('error',message);  
}

// modal for edit
function openEditModal(category) {

    document.getElementById('editCategoryId').value = category._id;
    document.getElementById('editCategoryName').value = category.name;
    document.getElementById('editCategoryDescription').value = category.description;
    document.getElementById('editCategoryStatus').value = category.status;
    
    const form = document.getElementById('editCategoryForm');
    form.action = `/admin/updateCategory`; 
    const modal = new bootstrap.Modal(document.getElementById('editCategoryModal'));
    modal.show();
}



  document.getElementById('editCategoryForm').addEventListener('submit', (event) => {
  event.preventDefault();

  const categoryId = document.getElementById('editCategoryId').value;
  const name = document.getElementById('editCategoryName').value;
  const description = document.getElementById('editCategoryDescription').value;
  const status = document.getElementById('editCategoryStatus').value;

  fetch('/admin/updateCategory', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryId, name, description, status }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        showNotification('success', data.message);
        setTimeout(() => {
          location.reload();
        }, 2000);
      } else {
        showNotification('error', data.message);
      }
    })
    .catch((error) => {
      showNotification('error', 'An unexpected error occurred. Please try again.');
    });
});

// update category
    document.addEventListener('DOMContentLoaded', function() {
        const toggles = document.querySelectorAll('.isListedToggle');

        toggles.forEach(toggle => {
            toggle.addEventListener('change', function() {
                const categoryId = this.dataset.id;
                const isListed = this.checked;

                fetch(`/admin/${categoryId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ isListed })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showNotification('success', data.message);
                    } else {
                        showNotification('error', data.message);
                    }
                })
                .catch(error => {
                    showNotification('error', 'An error occurred while updating the category.');
                });
            });
        });
    });

    // Create brand 
    document.getElementById('brandForm').addEventListener('submit', (event) => {
    event.preventDefault();

    const name = document.getElementById('brandName').value;
    const description = document.getElementById('brandDescription').value;
    const category = document.getElementById('brandCategory').value;

    if(!name || !description || !category) return showNotification('error','All fields are required');

    fetch('/admin/addBrand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, category })
    })
    .then((res) => res.json())
    .then((data) => {
        if (data.success) {
            showNotification('success', data.message);
            setTimeout(() => {
                location.reload();
            }, 2000);
        } else {
            showNotification('error', data.message);
        }
    })
    .catch((error) => {
        showNotification('error', 'An unexpected error occurred. Please try again.');
    });
});
    