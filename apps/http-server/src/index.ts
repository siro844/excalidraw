import express from "express";
import rootRouter from "./routes";

const app = express();
const PORT = 5000


app.use('/api/v1',rootRouter)
app.listen(PORT,()=>{
    console.log("SERVER IS RUNNING ON PORT" + PORT)
})