const dropdown = document.querySelector('.drop-menu')
    const profile = document.getElementById('profile')
    var val = true
    profile.addEventListener('click',()=>{
        console.log("working ")
        if(val){
            console.log("working2")
            val = false
            dropdown.style.display = 'flex'
        }else{
            console.log("woriking 3")
            val = true
            dropdown.style.display = 'none'
        }

    })