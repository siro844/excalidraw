import express from "express";
import rootRouter from "./routes/index.js";

const app = express();
const PORT = 5000

app.use(express.json())
app.use('/api/v1',rootRouter)
app.listen(PORT,()=>{
    console.log("SERVER IS RUNNING ON PORT" + PORT)
})