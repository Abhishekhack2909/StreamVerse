import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { removefromCloudinary } from "../utils/removeImage.js";

// Notes about imports:
// - asyncHandler: wraps async Express handlers so thrown errors go to Express error middleware.
// - ApiError: a consistent error shape (statusCode + message) used across the API.
// - ApiResponse: a consistent success response shape used across the API.
// - User: Mongoose model for user collection (DB read/write happens through this).
// - uploadOnCloudinary: uploads local file path -> returns hosted URL.
// - jwt: used to verify refresh tokens during token rotation.

/**
 * User controllers
 *
 * Purpose:
 * - Controllers contain the request/response logic for a route.
 * - They validate inputs, call DB/models, and return a consistent API response.
 *
 * Why this file exists:
 * - Keeps route files small (routes map URL -> controller).
 * - Keeps business logic out of app bootstrap code.
 * - Easier to test/maintain user-related features in one place.
 */

// Generates a fresh access token + refresh token pair and persists refresh token on the user.
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    // Access token is short-lived (used for authorization).
    // Refresh token is long-lived (used only to get a new access token).
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // to make the add these token in user( or make the data in object)
    user.refreshToken = refreshToken;

    // Why validateBeforeSave:false?
    // We are only storing refreshToken; we are not changing required fields like password.
    // This avoids failing validations that are unrelated to this update.
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
    // now we need simplt call this when need in login
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating the refresh and access Token"
    );
  }
};

export const registeruser = asyncHandler(async (req, res) => {
  // Registers a new user:
  // - Validates required fields
  // - Ensures username/email are unique
  // - Uploads avatar (required) and optional cover image to Cloudinary
  // - Creates user in DB and returns user data without password/refreshToken
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

  // 1) Get user input sent by frontend (usually JSON body)
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

  // 2) Validate: check all required fields are present and not empty
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Basic email format check (simple guard; for production consider stronger validation)

  if (!email.includes("@")) {
    throw new ApiError(400, "Invalid email format. Email must  have '@' ");
  }

  // 3) Uniqueness check: do not allow duplicate email or username
  const existedUser = await User.findOne({
    $or: [{ username }, { email }], // $or parameter=> to check or do anyting in any number of parameter
  });
  if (existedUser) {
    throw new ApiError(409, "user with email or username already exists");
  }
  console.log(req.files);

  // 4) Files come from multer middleware (see routes). Avatar is required.
  console.log("req.files:", req.files);
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  // classic way of cheaking this , if got error in this
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  console.log("avatarLocalPath:", avatarLocalPath);
  console.log("coverImageLocalPath:", coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is mandatory");
  }
  // 5) Upload files to Cloudinary. After upload we store ONLY the URL in DB.
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  // Cover image is optional, so upload only if a local file exists.
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  // 6) Create user entry in DB. Password will be hashed by the model pre-save hook.
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    // Normalize username to avoid duplicates like Abhi vs abhi
    username: username.toLowerCase(),
  });

  // Safety: never return password/refreshToken back to client.
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

export const loginuser = asyncHandler(async (req, res) => {
  // Logs a user in:
  // - Accepts username or email + password
  // - Verifies credentials
  // - Issues access + refresh tokens
  // - Sets httpOnly cookies for auth
  //req body->data
  //username or email
  //find the user
  //password cheack
  //access and refresh token
  //send cookies

  //by this we get the data from the body
  // 1) Read credentials from body
  const { email, password, username } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }
  // 2) Find user by either username or email
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  // if not found the user the user in database than throw error
  if (!user) {
    throw new ApiError(404, "user doesnot exist");
  }
  // 3) Verify password using model helper (bcrypt compare)
  const isPasswordValid = await user.isPasswordCorrect(password);
  // if password is wrong than throw error
  if (!isPasswordValid) {
    throw new ApiError(401, "invalid User credentials");
  }

  // 4) Issue new tokens (also saves refreshToken in DB)
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // 5) Send tokens as httpOnly cookies.
  // httpOnly prevents JS access (reduces XSS token theft).
  // secure should be true only on HTTPS.

  const options = {
    // options design for sending cookies
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // secure cookies require HTTPS in browsers
  };

  //now return the response
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in Successfully"
      )
    );
});

export const logoutuser = asyncHandler(async (req, res) => {
  // Logs out the current user:
  // - Clears refreshToken from DB
  // - Clears auth cookies
  // here we use middleware auth as get access of user ,so we can
  // 1) Invalidate refresh token in DB (token rotation / logout)
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
  // 2) Clear cookies on client
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  // Refreshes tokens using a valid refresh token:
  // - Validates refresh token from cookies/body
  // - Verifies JWT signature
  // - Ensures it matches the one stored in DB
  // - Issues new access + refresh tokens and sets cookies again
  // Refresh token can come from cookies (browser) or body (mobile clients).
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorised request");
  }

  try {
    // Verify refresh token signature and expiry.
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // Find user referenced inside the refresh token.
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh token");
    }
    // IMPORTANT: token must match what we stored in DB.
    // If the user logged out or token was rotated, stored token changes.
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, " Refresh Token is Expired or  used");
    }
    // now generate new access and refresh token

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    // Rotate refresh token: generate a new pair and replace the stored refreshToken.
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    //now we return the res
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access Token refreshed Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

export const changePassword = asyncHandler(async (req, res) => {
  // Changes current user's password:
  // - Requires valid oldPassword
  // - Saves newPassword (pre-save hook hashes it)

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "oldPassword and newPassword are required");
  }

  // we know that user is alredy login , so we have access to user by middleware (Auth)
  // Fetch user from DB (we trust req.user exists because verifyJWT ran before this route)
  const user = await User.findById(req.user?._id);

  const isOldpasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isOldpasswordCorrect) {
    throw new ApiError(400, "Invalid old Password");
  }

  // Assign new password; model pre-save hook will hash it.
  user.password = newPassword;
  // validateBeforeSave:false is OK here because we're only changing password,
  // but you can remove it if you want full schema validation.
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed SuccessFully"));
});

export const getcurrentuser = asyncHandler(async (req, res) => {
  // Returns the currently authenticated user (set by verifyJWT middleware).
  // This is useful for "profile" screens to show logged-in user's info.
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});

export const updateAccountDetails = asyncHandler(async (req, res) => {
  // Updates basic account info (not password): fullname + email.
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }
  // Update user in DB and return the updated document.
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    { new: true }
  ).select("-password -refreshToken"); // don't expose secrets

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updates Successfully"));
  //
});

export const updateUserAvatar = asyncHandler(async (req, res) => {
  // Updates avatar image for current user.
  // Multer puts single-file upload into req.file (not req.files)
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  // to delete the previous

  // Upload to Cloudinary then store URL in DB.
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    // if url is not there than throw error
    throw new ApiError(400, "Error while uploading avatar image");
  }
  // Remove previous avatar from Cloudinary
  const currentUser = await User.findById(req.user?._id);
  if(!currentUser){
    throw new ApiError(404, "User not found");

  }
   if (user.avatarPublicId) {
    await removeFromCloudinary(user.avatarPublicId);
  }

  // Persist new avatar URL
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        // to set the new value
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User avatar updated successfully"));
});

export const updateUserCover = asyncHandler(async (req, res) => {
  // Updates cover image for current user.
  // Multer puts single-file upload into req.file (not req.files)
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  // Upload to Cloudinary then store URL in DB.
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    // if url is not there than throw error
    throw new ApiError(400, "Error while uploading cover image");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        // to set the new value
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  // now return the res
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User cover image updated successfully"));
});
