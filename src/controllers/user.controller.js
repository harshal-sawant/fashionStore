import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
// import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}


const registerUser = asyncHandler( async (req, res) => {
    console.log('Register user')


    const { username, name, email, password, contactNumber, address } = req.body

    // Validate all required fields
    if (
        [username, name, email, password, contactNumber].some((field) => field?.trim() === "") ||
        !address || [address.street, address.city, address.state, address.country, address.pincode].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format")
    }

    // Validate password length
    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters long")
    }

    // Validate contact number format
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/
    if (!phoneRegex.test(contactNumber)) {
        throw new ApiError(400, "Invalid contact number format")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const user = await User.create({
        username: username.toLowerCase(),
        name,
        email: email.toLowerCase(),
        password,
        contactNumber,
        address
    })

    const createdUser = await User.findById(user._id)

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

const getUsers =  async (req, res) => {
    try {
        
        console.log('getUsers');
        const userData = await User.find();
        res.json(userData);
    } catch (error) {
        console.error('Error fetching users:', error);
    }
};

const loginUser = asyncHandler(async (req, res) => {
    console.log('login', req);
    const { email, username, password } = req.body;

    // Check if either email or username is provided
    if (!(email || username)) {
        throw new ApiError(400, "Email or username is required");
    }

    if (!password) {
        throw new ApiError(400, "Password is required");
    }

    // Find user by email or username
    const user = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (!user) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Generate access and refresh tokens
    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)


    // Update user's refresh token in database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Remove sensitive information from user object
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // Set cookies options
    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged in successfully"
            )
        );
});

export {
    registerUser,
    getUsers,
    loginUser
}