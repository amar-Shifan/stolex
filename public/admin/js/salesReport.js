// Show/hide custom date inputs based on selection
document.getElementById('timeRange').addEventListener('change', function () {
    const customDateFields = document.querySelectorAll('.custom-date');
    if (this.value === 'custom') {
      customDateFields.forEach(field => field.style.display = 'block');
    } else {
      customDateFields.forEach(field => field.style.display = 'none');
    }
  });


  document.getElementById('downloadPdf').addEventListener('click', function () {
    showNotification('error','PDF download functionality is under construction.')
  });

  document.getElementById('downloadExcel').addEventListener('click', function () {
    showNotification('error','Excel download functionality is under construction.')
  });