//  here we  can add code to delete image from cloudinary if needed
import { v2 as cloudinary} from 'cloudinary'

import fs from'fs'

    // Configuration
cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
const removefromCloudinary = async (publicId) => {
    try { // delete the file from cloudinary
        if(!publicId) return null;
        console.log("Removing file from cloudinary:", publicId);
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: "auto"
        });
        return response;

        
    } catch (error) {
        console.log("Cloundinary removal error:", error);
        return null;

        
    }

}
export {removefromCloudinary}

// we import this function in user.controller.js to delete previous avatar
