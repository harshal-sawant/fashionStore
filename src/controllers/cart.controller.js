import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";

const getCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id, status: "active" })
        .populate("items.product", "name price images stockQuantity");

    if (!cart) {
        return res.status(200).json(
            new ApiResponse(200, { items: [], totalAmount: 0 }, "Cart is empty")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, cart, "Cart retrieved successfully")
    );
});

const addToCart = asyncHandler(async (req, res) => {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
        throw new ApiError(400, "Product ID is required");
    }

    // Validate product
    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (!product.isAvailable) {
        throw new ApiError(400, "Product is not available");
    }

    if (product.stockQuantity < quantity) {
        throw new ApiError(400, "Insufficient stock");
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user._id, status: "active" });

    if (!cart) {
        cart = await Cart.create({
            user: req.user._id,
            items: [{
                product: productId,
                quantity,
                price: product.price
            }]
        });
    } else {
        // Check if product already exists in cart
        const existingItem = cart.items.find(
            item => item.product.toString() === productId
        );

        if (existingItem) {
            // Update quantity if total doesn't exceed stock
            if (existingItem.quantity + quantity > product.stockQuantity) {
                throw new ApiError(400, "Cannot add more items than available in stock");
            }
            existingItem.quantity += quantity;
        } else {
            // Add new item
            cart.items.push({
                product: productId,
                quantity,
                price: product.price
            });
        }

        await cart.save();
    }

    // Populate product details before sending response
    cart = await cart.populate("items.product", "name price images stockQuantity");

    return res.status(200).json(
        new ApiResponse(200, cart, "Product added to cart successfully")
    );
});

const updateCartItem = asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
        throw new ApiError(400, "Product ID and quantity are required");
    }

    if (quantity < 0) {
        throw new ApiError(400, "Quantity cannot be negative");
    }

    const cart = await Cart.findOne({ user: req.user._id, status: "active" });
    if (!cart) {
        throw new ApiError(404, "Cart not found");
    }

    const cartItem = cart.items.find(
        item => item.product.toString() === productId
    );

    if (!cartItem) {
        throw new ApiError(404, "Product not found in cart");
    }

    // Validate stock quantity
    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (quantity > product.stockQuantity) {
        throw new ApiError(400, "Cannot add more items than available in stock");
    }

    if (quantity === 0) {
        // Remove item if quantity is 0
        cart.items = cart.items.filter(
            item => item.product.toString() !== productId
        );
    } else {
        cartItem.quantity = quantity;
        cartItem.price = product.price; // Update price in case it changed
    }

    await cart.save();

    const updatedCart = await cart.populate("items.product", "name price images stockQuantity");

    return res.status(200).json(
        new ApiResponse(200, updatedCart, "Cart updated successfully")
    );
});

const removeFromCart = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    if (!productId) {
        throw new ApiError(400, "Product ID is required");
    }

    const cart = await Cart.findOne({ user: req.user._id, status: "active" });
    if (!cart) {
        throw new ApiError(404, "Cart not found");
    }

    cart.items = cart.items.filter(
        item => item.product.toString() !== productId
    );

    await cart.save();

    const updatedCart = await cart.populate("items.product", "name price images stockQuantity");

    return res.status(200).json(
        new ApiResponse(200, updatedCart, "Product removed from cart successfully")
    );
});

const clearCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id, status: "active" });
    
    if (!cart) {
        return res.status(200).json(
            new ApiResponse(200, null, "Cart is already empty")
        );
    }

    cart.items = [];
    await cart.save();

    return res.status(200).json(
        new ApiResponse(200, { items: [], totalAmount: 0 }, "Cart cleared successfully")
    );
});

const abandonCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id, status: "active" });
    
    if (!cart) {
        throw new ApiError(404, "No active cart found");
    }

    cart.status = "abandoned";
    await cart.save();

    return res.status(200).json(
        new ApiResponse(200, null, "Cart marked as abandoned")
    );
});

export {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    abandonCart
};