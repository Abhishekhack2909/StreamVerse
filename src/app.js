import express from 'express'
import cors from 'cors'
import cookieParser from "cookie-parser"

const app = express()
app.use(cors({// for  use for configuration and middlware.
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({ limit: "16kb" }))// limit the file to not to become heavy

app.use(express.urlencoded({ extended: true, limit: "16kb" })) // making the url encoded  and decoded


app.use(express.static("public"))// for making  the any asset(like images or fevicon) that is loaded into public file

app.use(cookieParser()) // for taking cookie info to server or many thing with secure manner

//routes import
import userRouter from './routes/user.routes.js'
//routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)


export { app }

//final model structure of app.js
// app.js
//│
//├─ Security (CORS, cookies)
//├─ Body parsing (JSON, forms)
//├─ Static assets
//├─ Route connection
//│
//└─ Export app
