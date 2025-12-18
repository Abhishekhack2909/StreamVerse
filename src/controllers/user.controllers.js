import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


 const generateAccessAndRefreshTokens= async (userId)=>{
  try {
    const user= await User.findById(userId);
    const accessToken=user.generateAccessToken();
    const refreshToken= user.generateRefreshToken();

    // to make the add these token in user( or make the data in object)
         user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false});// as this trigger the validation by password ( user in model.js) so we have to turn this off, we dont need validation here
        
        return {accessToken, refreshToken};
        // now we need simplt call this when need in login
    
    
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating the refresh and access Token")
    
  }
 }

export const registeruser = asyncHandler(async (req, res) => {
  //here we send the status ans routes receives the request
  //return res.status(200).json({
  //    message: "hello abhishek, i am from backend ",
  //})

  //register  to a user
  // get user details from frontend
  //validation-not empty
  //check if user alreeady  exist or not- username, email
  //check for images, cheack fro avatar
  //upload them on cloudinary , avatar
  //create userobject -create entry in db
  //remove password and refersh token field
  //cheak for user creation or not
  // return response, id not then error

  //1. get data from frontend
  const { username, email, password, fullname } = req.body;
  console.log("email", email);

  //2. validation=>
  // 1st method :we can write these one by one and throw the error when user do some mistek
  //if(fullname ===""){
  //    throw new ApiError(400, "fullname is required")
  //}
  //if(email ===""){
  //    throw new ApiError(400, "email is required")
  //}
  //if(username ===""){
  //    throw new ApiError(400, "username  is required")
  //}
  //if(password ===""){
  //    throw new ApiError(400, "password is required")
  //}

  // 2nd  method for writing the error call for all fild at same time with (some) method
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // for validation of email that i has @ or not;

  if (!email.includes("@")) {
    throw new ApiError(400, "Invalid email format. Email must  have '@' ");
  }

  //3. to cheack the user is already exist or not, by going to user.model , their it connect direclty with db ,
  const existedUser = await User.findOne({
    $or: [{ username }, { email }], // $or parameter=> to check or do anyting in any number of parameter
  });
  if (existedUser) {
    throw new ApiError(409, "user with email or username already exists");
  }
  console.log(req.files)

  //4. cheack for coverimage or cheak for avatarimage
  console.log("req.files:", req.files);
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage?.[0]?.path; 
  // classic way of cheaking this , if got error in this
   let coverImageLocalPath ;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
    coverImageLocalPath = req.files.coverImage[0].path
   } 


  console.log("avatarLocalPath:", avatarLocalPath);
  console.log("coverImageLocalPath:", coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is mandatory");
  }
  //4.cheak for upload on clodinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  //5.create user entry in Db
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createduser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createduser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
 // now we return the response
  return res
    .status(201)
    .json(new ApiResponse(200, createduser, "User created succesfully"));
});

export const loginuser=asyncHandler(async(req, res)=>{ 
  //req body->data
  //username or email
  //find the user
  //password cheack
  //access and refresh token 
  //send cookies

  //by this we get the data from the body 
  const {email, password, username}= req.body;
  if(!username && !email){
    throw new ApiError(400, "username or email is required")
  }
// than take the username  and email;
   const user= await User.findOne({
    $or:[{username},{email}]
   })
  // if not found the user the user in database than throw error 
   if(!user){
    throw new ApiError(404, "user doesnot exist");
   }
  // cheak for password ( correct or not)
   const isPasswordValid=await user.isPasswordCorrect(password);
    // if password is wrong than throw error
   if(!isPasswordValid){
    throw new ApiError(401, "invalid User credentials")
   }

   // for generate the access and refresh token
        const{accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);
   
    const loggedInUser=await User.findById(user._id).select("-password -refreshToken");

  // send cookies

    const options={ // options design for sending cookies 
      httpOnly:true,
      secure:true  //when it is said to be true than only it can modifies by server, not on frontend; when not true , than it can be modified on frontend
    }

    //now return the response
    return res
    .status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
          200, 
          {
            user:loggedInUser,accessToken,refreshToken
          },
          "User logged in Successfully"
        )
    )
});

export const logoutuser = asyncHandler(async(req, res)=>{
  // here we use middleware auth as get access of user ,so we can 
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken:undefined
      }

    },
    {
      new :true
    }


  )
    const options={  
      httpOnly:true,
      secure:true 
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json( new ApiResponse(200,{}, "User logged Out"))

})

export const refreshAccessToken= asyncHandler(async(res, req)=>{
    const incomingRefreshToken=req.cookies.refreshToken ||req.body.refreshToken

    if(!incomingRefreshToken){
      throw new ApiError(401,"unauthorised request")
    }

try {
  const decodedToken= jwt.verify( // for verify of token that is in the  database;
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
  
    // after this we find the user by findById
    const user= await 
    User.findById(decodedToken?._id)
  
    if(!user){
      throw new ApiError(401, "Invalid Refresh token")
    }
    // cheak for token match
    if(incomingRefreshToken !==user?.refreshToken){
      throw new ApiError(401, " Refresh Token is Expired or  used")
    }
  // now generate new access and refresh token
   
    const options={
      httpOnly:true,
      secure:true
    }
   
   const {accessToken, newrefreshToken}=await generateAccessAndRefreshTokens(user._id)
      
  
  //now we return the res
   return res
   .status(200)
   .cookie("accessToken ",accessToken, options) 
   .cookie("refreshToekn",newrefreshToken,options)
   .json(
    new ApiResponse(200, {
          accessToken, refreshToken:newrefreshToken}
          ,"Access Token refreshed Successfully"
  )
   )
} catch (error) {
  throw new ApiError(401, error?.message || "Invalid Refresh Token")
  
}


  






})
