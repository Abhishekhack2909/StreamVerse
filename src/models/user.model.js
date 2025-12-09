import mongoose, {Schema} from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
const userSchema = new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true, 
        index:true // for searchable in database
    ,
    },
    email:{
         type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,   
    }, 
    fullname:{
         type:String,
        required:true,
        trim:true,
        index:true,
       
    }, 
    avatar:{
        type:String,// cloudinary URL
        required:true,
        
    }, 
    coverImage:{
         type:String,// cloudinary URL  
    },
    watchHistory:[{
        type:Schema.Types.ObjectId,
        ref:"Video"

    }
],
password:{
    type:String,
    required :[true, 'Password is required']
},
refreshToken :{
    type:String
}


 }, {timestamps:true}
)
userSchema.pre("save",async function(next){// for making the password ecrypted
    if(!this.ismodified("password"))return next()// if other thing are updated than not to update the password everytime

    this.password =bcrypt.hash(this.password, 10)
    next()
})
//now some method, for password is right or wrong from user and that in database 
 userSchema.methods.isPasswordCorrect = async function
 (password){
   return await bcrypt.compare(password, this.password)

 }
 // method for generate the accesstoken and refresh token 
 userSchema.methods.generateAccessToken=function(){
    jwt.sign(
        {
         _id:this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        }, 
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
 }

  userSchema.methods.generateAccessToken=function(){
    jwt.sign(
        {
         _id:this._id,
        }, 
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
 }



export const User= mongoose.model("User", userSchema) 