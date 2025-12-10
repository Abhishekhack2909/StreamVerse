import express from 'express'
import cors from 'cors'
import cookieParser from "cookie-parser"

const app =express()
app.use(cors({// for  use for configuratio and middlware.
    origin:process.env.CORS_ORIGIN, 
    credentials:true
}))
app.use(express.json({limit :"16kb"}))// for lilit the file to not to become heavy

app.use(express.urlencoded({extented:true,limit:"16kb"})) // making the url encoded  and decoded


app.use (express.static("public"))// for making  the any asset(like images or fevicon) that is loaded into public file

app.use(cookieParser()) // for taking cookie to server or many thing with secure manner

//routes import
import userRouter from './routes/user.routes.js'
//routes declaration
app.use("/api/v1/users",userRouter)

export {app}