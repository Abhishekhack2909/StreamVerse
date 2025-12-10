import { v2 as cloudinary } from 'cloudinary'
import fs from'fs'

    // Configuration
    cloudinary.config({ 
        cloud_name: 'process.env.CLOUDINAR_NAME', 
        api_key: 'process.env.CLOUDINARY_API_KEY', 
        api_secret: 'process.env.CLOUDINARY_API_SECRET' // Click 'View API Keys' above to copy your API secret
    }) ;

const uploadOnCloudinary  = async(localFilePath)=>{
     try {
        if(!localFilePath) return null;
        // upload the file on cloudinary 
        const response=await cloudinary.uploader.upload
        (localFilePath, {resource_type:"auto"})
        
     } catch (error) {
     fs.unlinkSync(localFilePath)
     // remove the  locally saved temporary file as the upload operatin got failed 
     return null
     }
}

export {uploadOnCloudinary}

