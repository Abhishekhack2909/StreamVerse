import mongoose from 'mongoose'
import {DB_NAME} from "./constants.js"
import connectDB from './db/DB.js'
import dotenv from 'dotenv'
dotenv.config({ path: './.env' })


connectDB()



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
