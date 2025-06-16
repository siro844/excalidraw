import { Router,Request,Response } from "express";
import jwt from "jsonwebtoken";
const authRouter = Router();
import z from "zod";
import { UserAuth,User ,UserLoginType, UserLogin} from "../types/auth.js";
import { prisma } from "@repo/database";
import dotenv from "dotenv";
import bcrypt from "bcrypt"
dotenv.config();



const JWT_SECRET = process.env.JWT_SECRET!
authRouter.post('/signup',async(req : Request,res : Response)=>{
    const {success , error} = UserAuth.safeParse(req.body);
    if(!success){
        res.status(400).json({
            error :"Invalid values",
            details:error
        })
        return;
    }
    const userData:User = req.body;
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    userData.password = hashedPassword;
    const user = await prisma.user.create({ data: userData });
    const userId = user.id;
    const token = jwt.sign({ userId },JWT_SECRET)
    res.status(201).json({
        message :" User Created Successfully",
        token:token
    });
})


authRouter.post('/login',async (req,res)=>{
    const {success , error} = UserLogin.safeParse(req.body);
    if(!success){
        res.status(400).json({
            error :"Invalid values",
            details:error
        })
        return;
    }
    const userData : UserLoginType = req.body;
   
    const user = await prisma.user.findUnique({
        where:{
            email:userData.email,
        }
    })
    if(!user){
        res.status(404).json({
            message : " Email Not Found "
        })
        return
    }

    const isPasswordCorrect = await bcrypt.compare(userData.password , user!.password)
    if(!isPasswordCorrect){
        res.status(400).json({
            message:"Invalid Password",
        })
    }
    const token = jwt.sign({userId : user.id},JWT_SECRET)
    res.status(200).json({
        message :"Logged In Successfully",
        token : token
    })

})

export default authRouter