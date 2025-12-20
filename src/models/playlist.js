import mongoose from 'mongoose'

const  playlistSchema = new mongoose.Schema(
    {
    video:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video"
        }, 
    name:{
        type:String,
        required:true
    }, 
    description:{
        type:String,
        required:true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"}
        
    }, {timestamps:true}
)
export const playlist = mongoose.model("Playlist", playlistSchema)
