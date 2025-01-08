const ctx = document.getElementById('salesChart').getContext('2d');
    let salesChart;
    const ctxCategories = document.getElementById('categoriesChart').getContext('2d');
    const ctxBrands = document.getElementById('brandsChart').getContext('2d');
    let categoriesChart;
    let brandsChart;

    async function updateChart() {
        const filter = document.getElementById('timeFilter').value;
        const response = await fetch(`/admin/chart-data?filter=${filter}`);
        const data = await response.json();

        // Update product sales chart
        if (salesChart) salesChart.destroy();
        salesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.products.map(product => product.name), // Product names
                datasets: [{
                    label: 'Sales Quantity',
                    data: data.products.map(product => product.quantitySold), // Sales quantities
                    backgroundColor: "rgba(75, 192, 192, 0.6)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Quantity Sold'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Products'
                        }
                    }
                }
            }
        });

        // Update categories chart
        if (categoriesChart) categoriesChart.destroy();
        categoriesChart = new Chart(ctxCategories, {
            type: 'bar',
            data: {
                labels: data.categories.map(category => category.name), // Category names
                datasets: [{
                    label: 'Category Sales',
                    data: data.categories.map(category => category.quantitySold), // Sales quantities
                    backgroundColor: "rgba(54, 162, 235, 0.6)",
                    borderColor: "rgba(54, 162, 235, 1)",
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Quantity Sold'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Categories'
                        }
                    }
                }
            }
        });

        // Update brands chart
        if (brandsChart) brandsChart.destroy();
        brandsChart = new Chart(ctxBrands, {
            type: 'bar',
            data: {
                labels: data.brands.map(brand => brand.name), // Brand names
                datasets: [{
                    label: 'Brand Sales',
                    data: data.brands.map(brand => brand.quantitySold), // Sales quantities
                    backgroundColor: "rgba(255, 99, 132, 0.6)",
                    borderColor: "rgba(255, 99, 132, 1)",
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Quantity Sold'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Brands'
                        }
                    }
                }
            }
        });

        // Update best-selling products list
        const bestSellingList = document.getElementById('bestSellingList');
        bestSellingList.innerHTML = '';
        data.products.slice(0, 5).forEach(product => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = `${product.name} - ${product.quantitySold} sold`;
            bestSellingList.appendChild(li);
        });

        // Update time frame description
        const timeFrameEl = document.getElementById('timeFrame');
        if (filter === 'yearly') {
            timeFrameEl.textContent = 'January 2024 - December 2024';
        } else if (filter === 'monthly') {
            timeFrameEl.textContent = 'December 2024';
        } else if (filter === 'weekly') {
            timeFrameEl.textContent = 'Week 1 - Week 4, December 2024';
        }
    }

    // Initial Load
    updateChart();