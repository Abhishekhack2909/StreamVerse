import { v2 as cloudinary } from 'cloudinary'
import fs from'fs'

    // Configuration
cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        
        console.log("Uploading file to cloudinary:", localFilePath);
        // upload the file on cloudinary 
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto" // this will automatically detect the file type (image, video, etc.)
        });
        // file has been uploaded successfully
        //console.log("File is uploaded on cloudinary", response.url);
        
        // Clean up local file after successful upload
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        console.log("Cloudinary upload error:", error);
        // remove the locally saved temporary file as the upload operation got failed 
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
}

export {uploadOnCloudinary}

