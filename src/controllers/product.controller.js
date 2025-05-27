import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product } from "../models/product.model.js";

const createProduct = asyncHandler(async (req, res) => {
    const { name, description, price, category, stockQuantity, images, sizes } = req.body;

    // Validate required fields
    if (
        [name, description, category].some((field) => field?.trim() === "") ||
        !price ||
        !Array.isArray(images) ||
        images.length === 0 ||
        !Array.isArray(sizes) ||
        sizes.length === 0
    ) {
        throw new ApiError(400, "All required fields must be provided");
    }

    // Validate price and stock
    if (price < 0) {
        throw new ApiError(400, "Price cannot be negative");
    }

    if (stockQuantity < 0) {
        throw new ApiError(400, "Stock quantity cannot be negative");
    }

    // Validate sizes
    for (const sizeObj of sizes) {
        if (!sizeObj.size || sizeObj.quantity < 0) {
            throw new ApiError(400, "Invalid size information");
        }
    }

    const product = await Product.create({
        name,
        description,
        price,
        category,
        stockQuantity,
        images,
        sizes,
        isAvailable: true
    });

    return res.status(201).json(
        new ApiResponse(201, product, "Product created successfully")
    );
});

const getAllProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({ isAvailable: true });
    return res.status(200).json(
        new ApiResponse(200, products, "Products fetched successfully")
    );
});

const getProductById = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return res.status(200).json(
        new ApiResponse(200, product, "Product fetched successfully")
    );
});

const updateProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const updates = req.body;

    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    // Validate updates
    if (updates.price < 0) {
        throw new ApiError(400, "Price cannot be negative");
    }

    if (updates.stockQuantity < 0) {
        throw new ApiError(400, "Stock quantity cannot be negative");
    }

    if (updates.sizes) {
        for (const sizeObj of updates.sizes) {
            if (!sizeObj.size || sizeObj.quantity < 0) {
                throw new ApiError(400, "Invalid size information");
            }
        }
    }

    Object.assign(product, updates);
    await product.save();

    return res.status(200).json(
        new ApiResponse(200, product, "Product updated successfully")
    );
});

const deleteProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    // Soft delete by setting isAvailable to false
    product.isAvailable = false;
    await product.save();

    return res.status(200).json(
        new ApiResponse(200, {}, "Product deleted successfully")
    );
});

const getProductsByCategory = asyncHandler(async (req, res) => {
    const { category } = req.params;

    const products = await Product.find({
        category,
        isAvailable: true
    });

    return res.status(200).json(
        new ApiResponse(200, products, "Products fetched successfully")
    );
});

export {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getProductsByCategory
};