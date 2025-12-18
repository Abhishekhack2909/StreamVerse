import mongoose , {Schema, schema}from "mongoose";
 const subscriptionSchema = new Schema({
     subscribers:{
        type:Schema.Types.ObjectId,// one who is subscribing
        ref:"User"

     }, 
     channel:{
         type:Schema.Types.ObjectId,// one whom "Subscriber " is subscribing
        ref:"User"


     }
 });
 
 export const subscription =mongoose.model("subscription", subscriptionSchema)
