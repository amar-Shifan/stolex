function openAddStockModal(productId, size) {
    document.getElementById('addStockProductId').value = productId;
    document.getElementById('addStockSize').value = size;
    new bootstrap.Modal(document.getElementById('addStockModal')).show();
  }

  document.getElementById('addStockForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    try {

        const formData = new FormData(event.target);
        const formObject = Object.fromEntries(formData.entries());

        const response = await fetch('/admin/add-stock', {
        method: 'POST',
        headers : {'Content-Type':'application/json'},
        body: JSON.stringify(formObject),
        });

        const data = await response.json();

        if(data.success){
            showNotification('success' , data.message)

            setTimeout(()=>{
                location.reload();
            },1500);

        }else {
            showNotification('error',data.message)
        }

    } catch (error) {
        console.log(error);
        showNotification('error',"Something went wrong!")
    }
  });