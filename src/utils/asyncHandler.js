//AsyncHandler catches async errors and sends them to Express automatically.
// for making the util we have two method , by simply  async await  or promisies

// promisies method >>>
const asyncHandler=(requestHandler)=>{
    return (req, res,next)=>{
        Promise.resolve(requestHandler
            (req, res,next)).catch ((err)=>next(err))
    }
}

export {asyncHandler}




// async await method>>>
//const  asyncHandler =()=>{}
//const asyncHandler=(func)=>()=>{}
//const asyncHandler =(func)=>async()=>{}

//const asyncHandler=(fn)=>async(req, res, next)
//{
//    try{
//        await fn(req, res, next)   
//    } catch (error){
//        res.status(error.code || 500).json({
//            success:false,
//            message :err.message
//
//        })
//    }
//}