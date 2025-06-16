import express from "express";
import cors from "cors";
import rootRouter from "./routes/index.js";
const app = express();
const PORT = 5000

app.use(express.json())
app.use(cors())
app.use('/api/v1',rootRouter)
app.listen(PORT,()=>{
    console.log("SERVER IS RUNNING ON PORT" + PORT)
})