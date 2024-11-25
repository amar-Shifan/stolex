const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination:(req,file,cb) => {
        cb(null , path.join(__dirname , '../public/uploads/profiles'))
    },
    filename:(req,file,cb)=>{
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null , uniqueName);
    }
})

const fileFilter = (req , file , cb )=>{
    const allowedMimeTypes = ['image/jpeg' , 'image/png' , 'image/gif'];
    if(allowedMimeTypes.includes(file.mimetype)){
        cb(null , true)
    }else{
        cb(new Error('only images are allowed'))
    }
}

const upload = multer({
    storage , 
    limits : {fileSize : 1024 * 1024 * 5},
    fileFilter
})

module.exports = upload