document.getElementById('searchInput').addEventListener('input', async (e) => {
    const searchQuery = e.target.value; 
    const page = 1; 
    await fetchProducts(searchQuery, page); 
  });


  async function fetchProducts(searchQuery = '', page = 1, category = '', sort = '') {
    try {
        // Create URL parameters
        const params = new URLSearchParams();
        params.append('search', searchQuery);
        params.append('page', page.toString());
        if (category) {
            params.append('category', category); // category ID from select
        }
        if (sort) {
            params.append('sort', sort);
        }
        
        const response = await fetch(`/admin/products?${params.toString()}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update the UI
        renderProducts(data.products);
        renderPagination(data.currentPage, data.totalPages, searchQuery, category, sort);
        
        // Maintain filter selections
        const categorySelect = document.getElementById('parentCategoryFilter');
        const sortSelect = document.getElementById('sortFilter');
        
        if (categorySelect) categorySelect.value = category;
        if (sortSelect) sortSelect.value = sort;
        
    } catch (error) {
        console.error('Error fetching products:', error);
    }
  }
  
  function renderProducts(products) {
    const desktopContainer = document.getElementById('desktopContainer');
    const mobileContainer = document.getElementById('mobileContainer');

    // Render desktop table view
    desktopContainer.innerHTML = `
      <table class="table table-bordered table-hover">
        <thead class="thead-light">
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Description</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Brand</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${products
            .map(
              (product) => `
            <tr>
              <td class="text-center">
                <img src="${product.images[0]}" alt="${product.name}" class="img-thumbnail" style="width: 80px; height: 80px;">
              </td>
              <td>${product.name}</td>
              <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${product.description}
              </td>
              <td>$${product.price}</td>
              <td>
                <ul class="list-unstyled">
                  ${Array.isArray(product.stock)
                    ? product.stock
                        .map((stock) => `<li>Size: ${stock.size}, Quantity: ${stock.quantity}</li>`)
                        .join('')
                    : product.stock}
                </ul>
              </td>
              <td>${product.brand}</td>
              <td>
                <form action="/admin/toggle-status/${product._id}" method="POST">
                  <button type="submit" class="btn btn-sm ${
                    product.status ? 'btn-success' : 'btn-danger'
                  }">
                    ${product.status === 'Active' ? 'Active' : 'Inactive'}
                  </button>
                </form>
              </td>
              <td>
                <a href="/admin/update-product/${product._id}">
                  <button class="btn btn-warning edit-btn">
                    <i class="fas fa-edit"></i> Edit
                  </button>
                </a>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;

    // Render mobile card view
    mobileContainer.innerHTML = products
      .map(
        (product) => `
        <div class="card mb-3">
          <div class="card-body">
            <div class="d-flex align-items-center mb-3">
              <img src="${product.images[0]}" alt="${product.name}" class="img-thumbnail me-3" style="width: 80px; height: 80px;">
              <h5 class="mb-0">${product.name}</h5>
            </div>
            <p class="text-muted mb-2"><strong>Description:</strong> ${product.description}</p>
            <p class="mb-2"><strong>Price:</strong> $${product.price}</p>
            <p class="mb-2"><strong>Stock:</strong></p>
            <ul class="list-unstyled">
              ${Array.isArray(product.stock)
                ? product.stock
                    .map((stock) => `<li>Size: ${stock.size}, Quantity: ${stock.quantity}</li>`)
                    .join('')
                : product.stock}
            </ul>
            <p class="mb-2"><strong>Brand:</strong> ${product.brand}</p>
            <p>
              <strong>Status:</strong>
              <form action="/admin/toggle-status/${product._id}" method="POST" class="d-inline-block">
                <button type="submit" class="btn btn-sm ${
                  product.status ? 'btn-success' : 'btn-danger'
                }">
                  ${product.status ? 'Active' : 'Inactive'}
                </button>
              </form>
            </p>
            <div>
              <a href="/admin/update-product/${product._id}" class="btn btn-warning edit-btn">
                <i class="fas fa-edit"></i> Edit
              </a>
            </div>
          </div>
        </div>
      `
      )
      .join('');
  }


  function handleCategoryChange(selectElement) {
      const category = selectElement.value;
      const currentSort = document.getElementById('sortFilter')?.value || '';
      fetchProducts('', 1, category, currentSort);
  }

  // 4. Fix the sort change handler
  function handleSortChange(selectElement) {
      const sort = selectElement.value;
      const currentCategory = document.getElementById('parentCategoryFilter')?.value || '';
      fetchProducts('', 1, currentCategory, sort);
  }


  //render pagination
  function renderPagination(currentPage, totalPages, searchQuery, category, sort) {
  const paginationContainer = document.getElementById('pagination');
  let paginationHTML = '';

  if (currentPage > 1) {
      paginationHTML += `<li class="page-item">
        <a class="page-link" href="#" onclick="fetchProducts('${searchQuery}', ${currentPage - 1}, '${category}', '${sort}')">&laquo;</a>
      </li>`;
  }

  for (let i = 1; i <= totalPages; i++) {
      paginationHTML += `<li class="page-item ${currentPage === i ? 'active' : ''}">
        <a class="page-link" href="#" onclick="fetchProducts('${searchQuery}', ${i}, '${category}', '${sort}')">${i}</a>
      </li>`;
  }

  if (currentPage < totalPages) {
      paginationHTML += `<li class="page-item">
        <a class="page-link" href="#" onclick="fetchProducts('${searchQuery}', ${currentPage + 1}, '${category}', '${sort}')">&raquo;</a>
      </li>`;
  }

  paginationContainer.innerHTML = paginationHTML;
  
  }

  fetchProducts();