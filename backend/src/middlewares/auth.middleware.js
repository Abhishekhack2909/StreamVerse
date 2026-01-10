import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createClient } from "@supabase/supabase-js";
import { User } from "../models/user.model.js";

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // Verify token with Supabase
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

    if (error || !supabaseUser) {
      throw new ApiError(401, "Invalid Access Token");
    }

    // Find or create user in MongoDB based on Supabase user
    let user = await User.findOne({ email: supabaseUser.email });

    if (!user) {
      // Create user in MongoDB if doesn't exist
      user = await User.create({
        email: supabaseUser.email,
        username: supabaseUser.user_metadata?.username || supabaseUser.email.split('@')[0],
        fullname: supabaseUser.user_metadata?.fullname || supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0],
        avatar: supabaseUser.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(supabaseUser.email)}&background=random`,
        password: "supabase-oauth-user", // placeholder for OAuth users
        supabaseId: supabaseUser.id,
      });
    }

    req.user = user;
    req.supabaseUser = supabaseUser;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access Token");
  }
});
