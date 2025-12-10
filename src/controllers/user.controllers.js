import { asyncHandler } from "../utils/asyncHandler.js";

const registeruser =asyncHandler(async(req, res)=>{
    //here we send the status ans routes receives the request 
    res.status(200).json({
        message:"ok",
    })


})

export {registeruser}