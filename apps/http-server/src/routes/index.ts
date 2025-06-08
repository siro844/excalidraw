import { Router } from "express";
import authRouter from "./auth.js";
import roomRouter from "./room.js";

const rootRouter = Router();

rootRouter.use('/auth',authRouter)
rootRouter.use('/rooms',roomRouter)

export default rootRouter