import { LoginData, SignupData } from "@/types/auth";
import axios from "axios";

export  async function Login(data : LoginData){

    try{
     const response = await axios.post("http://localhost:5000/api/v1/auth/login", data);
     return response.data;
    }catch(err){
        console.error("Error during login:", err);
        throw new Error("Login failed. Please try again later.");
    }

}

export async function Signup(data : SignupData){
    try{
     const response = await axios.post("http://localhost:5000/api/v1/auth/signup", data);
     return response.data;
    }catch(err){
        console.error("Error during signup:", err);
        throw new Error("Signup failed. Please try again later.");
    }

}