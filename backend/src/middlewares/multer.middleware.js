import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage(
  {
  destination: function (req, file, cb) 
  {  // Set the destination folder for uploads
    const uploadPath = path.join(process.cwd(), "public", "temp"); // ensure the temp directory exists


    fs.mkdirSync(uploadPath, { recursive: true }); // create the directory if it doesn't exist
    cb(null, uploadPath);
  },
  //now set the filename
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },

});

export const upload = multer({ storage });
