// Its responsibilities are only 3 things:
//Load environment variables
//Connect to the database
//Start the HTTP server
//It does NOT handle routes, logic, auth, videos, etc.
import dotenv from 'dotenv'
dotenv.config({ path: './.env' })

import mongoose from 'mongoose'
import {DB_NAME} from "./constants.js"
import connectDB from './db/DB.js'
import {app} from './app.js'


connectDB()
.then(()=>{
     app.on("error", (error)=>{
        console.log("ERR :", error);
        throw error
     })
    app.listen( process.env.PORT || 8000, ()=>{
        console.log(`Server is running on PORT :${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("MONGO db connection failed !!!", err);

})



// first appraoch for connecting the DB
//import  express from "express"
// const app =express()
//  (async ()=>{
//    try {
//        await mongoose.connect(`$//{process.env.MONGODB_URI}/$//{DB_NAME}`)
//    app.on("error",(error)=>{
//        console.log("ERR :", errror);
//        throw error
//    })
//    app.listen (process.env.PORT, ()=>{
//      console.log(`App is listening on //Port ${process.env.PORT} `)
//    })
//        
//    } catch (error) {
//        console.error("Error", error)
//        throw err
//        
//    }
//
//  })()
//
