import { ApiError } from "../utils/ApiError"
import { asyncHandler } from "../utils/asyncHandler"
import jwt from "jsonwetoken"
export const verifyJWT = asyncHandler(async(req , _ , //here the res is  not used than we simply leave is with _
    next)=>{
     try {
        const token =req.cookies?.accessToken||req.header("Authorization")?.replace
       ("Bearer", "")
       // here we are using accesToken for websites and  Authorization for mobile devices and replace is used to remove bearer from token
       if(!token){
           throw new ApiError( 401, "Unauthorized request")
       }
   
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
   
        await User.findById(decodedToken?._id).select("-password -refreshToken")
   
        if(!user){
           throw new ApiError(401, "Invalid Access Token")
        }
   
        req.user=req;
        next()
   
     } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access Token")
    
        
     }

})