import mongoose,{Schema} from 'mongoose'
import  mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2' // pagination plugin
const videoSchema = new Schema(
    {
        videoFile :{
            type:String ,// clouinary URL
            required:true
        },
        thumbnail:{
            type:String ,// clouinary URL
            required:true
        },
        title:{
            type:String ,
            required:true
        }, 
        description :{
            type:String ,
            required:true
        }, 
        duration:{
            type:String ,// cloudinary URL
            required:true
        }, 
        view:{
            type:Number,
            default:0
        },
        isPublished:{
            type:Boolean,
            default:true
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }


}, {timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate) // adding pagination plugin to video schema


export const video = mongoose.model("Video", videoSchema)