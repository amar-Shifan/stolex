// public/js/categories.js

document.addEventListener('DOMContentLoaded', function() {
    // Initial load
    loadCategories();
    loadParentCategories();

    // Event Listeners
    document.getElementById('categoryType').addEventListener('change', toggleParentCategory);
    document.getElementById('saveCategory').addEventListener('click', saveCategory);
    document.getElementById('searchForm').addEventListener('submit', handleSearch);

    // Setup event delegation for edit and delete buttons
    document.getElementById('categoriesTableBody').addEventListener('click', handleTableActions);
});

// Load all categories
async function loadCategories() {
    try {
        const response = await fetch('/api/categories/main');
        const data = await response.json();
        
        if (data.success) {
            renderCategories(data.categories);
        }
    } catch (error) {
        showToast('Error loading categories', 'error');
    }
}

// Load parent categories for dropdown
async function loadParentCategories() {
    try {
        const response = await fetch('/api/categories/main');
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('parentCategory');
            select.innerHTML = data.categories
                .map(cat => `<option value="${cat._id}">${cat.name}</option>`)
                .join('');
        }
    } catch (error) {
        showToast('Error loading parent categories', 'error');
    }
}

// Render categories in table
function renderCategories(categories) {
    const tbody = document.getElementById('categoriesTableBody');
    tbody.innerHTML = categories.map(category => `
        <tr data-id="${category._id}">
            <td>${category.name}</td>
            <td>${category.level === 0 ? 'Main Category' : 'Subcategory'}</td>
            <td>${category.parentCategory ? category.parentCategory.name : '-'}</td>
            <td>
                <span class="badge bg-${category.status === 'Active' ? 'success' : 'secondary'}">
                    ${category.status}
                </span>
            </td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${category._id}">
                    Edit
                </button>
                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${category._id}">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// Toggle parent category dropdown based on type selection
function toggleParentCategory() {
    const type = document.getElementById('categoryType').value;
    const parentDiv = document.getElementById('parentCategoryDiv');
    const parentSelect = document.getElementById('parentCategory');
    
    parentDiv.style.display = type === 'subcategory' ? 'block' : 'none';
    parentSelect.required = type === 'subcategory';
}

// Save category (create or update)
async function saveCategory() {
    const form = document.getElementById('categoryForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const categoryId = document.getElementById('categoryId').value;
    const isEdit = !!categoryId;

    const categoryData = {
        name: document.getElementById('categoryName').value,
        description: document.getElementById('categoryDescription').value,
        type: document.getElementById('categoryType').value,
        status: document.getElementById('categoryStatus').value
    };

    if (categoryData.type === 'subcategory') {
        categoryData.parentCategory = document.getElementById('parentCategory').value;
    }

    try {
        const response = await fetch(`/api/categories${isEdit ? `/${categoryId}` : ''}`, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryData)
        });

        const data = await response.json();
        
        if (data.success) {
            showToast(`Category ${isEdit ? 'updated' : 'created'} successfully`, 'success');
            bootstrap.Modal.getInstance(document.getElementById('categoryModal')).hide();
            loadCategories();
            resetForm();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('Error saving category', 'error');
    }
}

// Handle edit/delete actions
async function handleTableActions(event) {
    const target = event.target;
    
    if (target.classList.contains('edit-btn')) {
        const categoryId = target.dataset.id;
        await loadCategoryForEdit(categoryId);
    } else if (target.classList.contains('delete-btn')) {
        const categoryId = target.dataset.id;
        if (confirm('Are you sure you want to delete this category?')) {
            await deleteCategory(categoryId);
        }
    }
}

// Load category data for editing
async function loadCategoryForEdit(categoryId) {
    try {
        const response = await fetch(`/api/categories/${categoryId}`);
        const data = await response.json();
        
        if (data.success) {
            const category = data.category;
            document.getElementById('categoryId').value = category._id;
            document.getElementById('categoryName').value = category.name;
            document.getElementById('categoryDescription').value = category.description;
            document.getElementById('categoryStatus').value = category.status;
            document.getElementById('categoryType').value = category.level === 0 ? 'main' : 'subcategory';
            
            toggleParentCategory();
            if (category.parentCategory) {
                document.getElementById('parentCategory').value = category.parentCategory._id;
            }
            
            document.getElementById('modalTitle').textContent = 'Edit Category';
            new bootstrap.Modal(document.getElementById('categoryModal')).show();
        }
    } catch (error) {
        showToast('Error loading category details', 'error');
    }
}

// Delete category
async function deleteCategory(categoryId) {
    try {
        const response = await fetch(`/api/categories/${categoryId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Category deleted successfully', 'success');
            loadCategories();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('Error deleting category', 'error');
    }
}

// Handle search and filter
function handleSearch(event) {
    event.preventDefault();
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    
    const rows = document.querySelectorAll('#categoriesTableBody tr');
    
    rows.forEach(row => {
        const name = row.querySelector('td:first-child').textContent.toLowerCase();
        const status = row.querySelector('.badge').textContent.trim();
        
        const matchesSearch = name.includes(searchTerm);
        const matchesStatus = !statusFilter || status === statusFilter;
        
        row.style.display = matchesSearch && matchesStatus ? '' : 'none';
    });
}

// Reset form
function resetForm() {
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('modalTitle').textContent = 'Create Category';
    toggleParentCategory();
}

// Show toast message
function showToast(message, type = 'info') {
    // Implement your preferred toast notification here
    alert(message); // Basic alternative
}