import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

  return res
    .status(201)
    .json(new ApiResponse(200, createduser, "User created succesfully"));
});
