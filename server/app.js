import cors from "cors"
import express from "express"
import directoryRouter from "./routes/directoryRoutes.js"
import fileRouter from "./routes/fileRoutes.js"
import userRouter from "./routes/userRoutes.js"
import cookieParser from "cookie-parser"
const app = express()

//global error handler middleware
app.use((err, req, res, next) => {
  res.status(500).json({ msg: "Something went wrong" })
})

//applying some middleware
app.use((req, res, next) => {
  let obj = {
    "method": req.method,
    "path": req.url
  }
  console.log(obj)
  next()
})
app.use(cookieParser())
app.use(express.json())
app.use(cors({ origin: "http://localhost:5173", credentials: true }))

app.use("/directory", directoryRouter)
app.use("/file", fileRouter)
app.use("/users", userRouter)

//starting the server
app.listen(5000, () => {
  console.log('server started successfully')
})
