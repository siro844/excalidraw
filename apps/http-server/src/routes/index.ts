import { Router } from "express";
import authRouter from "./auth";
import roomRouter from "./room";

const rootRouter = Router();

rootRouter.use('/auth',authRouter)
rootRouter.use('/rooms',roomRouter)

export default rootRouter