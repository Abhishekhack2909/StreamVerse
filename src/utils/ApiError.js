class ApiError extends Error{
    constructor(
        statusCode, 
        message="Something went wrong",
        error=[], 
        statck=""

    ){
        //overrride
        super(message),
        this.statusCode=statusCode
        this.data=null // store extra error details
        this.message=message,
        this.success=false,// Useful for API response format
        this.errors= errors

        if( statck){ //stack trace is the only thing that tells you where your backend broke
             this.stack =statck
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}
export {ApiError}