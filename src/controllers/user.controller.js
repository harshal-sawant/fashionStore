import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
// import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";




const registerUser = asyncHandler( async (req, res) => {
    console.log('Register user')


    const { username} = req.body
    //console.log("email: ", email);

    if (
        [username].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    
   

    const user = await User.create({
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id)

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

const getUsers = asyncHandler( async (req, res) => {
    console.log('getUsers');
    const userData = await User.find();
    res.json(userData);
});


export {
    registerUser,
    getUsers
}