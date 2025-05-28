import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";

const createOrder = asyncHandler(async (req, res) => {
    const {
        products,
        shippingAddress,
        paymentMethod,
        paymentId,
        orderNotes
    } = req.body;

    if (!products?.length) {
        throw new ApiError(400, "Products are required");
    }

    if (!shippingAddress || !paymentMethod) {
        throw new ApiError(400, "Shipping address and payment method are required");
    }

    // Calculate total amount and validate products
    let totalAmount = 0;
    const orderProducts = [];

    for (const item of products) {
        const product = await Product.findById(item.product);
        if (!product) {
            throw new ApiError(404, `Product not found with id: ${item.product}`);
        }

        if (product.stockQuantity < item.quantity) {
            throw new ApiError(400, `Insufficient stock for product: ${product.name}`);
        }

        // Update stock quantity
        product.stockQuantity -= item.quantity;
        await product.save();

        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        orderProducts.push({
            product: item.product,
            quantity: item.quantity,
            price: product.price
        });
    }

    // Add tax and shipping charges (can be configured based on business logic)
    const tax = totalAmount * 0.1; // 10% tax
    const shippingCharges = totalAmount > 1000 ? 0 : 100; // Free shipping over 1000

    const order = await Order.create({
        user: req.user._id,
        products: orderProducts,
        shippingAddress,
        paymentMethod,
        paymentId,
        totalAmount,
        tax,
        shippingCharges,
        orderNotes
    });

    return res.status(201).json(
        new ApiResponse(201, order, "Order created successfully")
    );
});

const getOrderById = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
        .populate("user", "username email")
        .populate("products.product", "name price images");

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    // Check if the order belongs to the requesting user (unless admin)
    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        throw new ApiError(403, "You don't have permission to view this order");
    }

    return res.status(200).json(
        new ApiResponse(200, order, "Order retrieved successfully")
    );
});

const getUserOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id })
        .populate("products.product", "name price images")
        .sort("-createdAt");

    return res.status(200).json(
        new ApiResponse(200, orders, "Orders retrieved successfully")
    );
});

const updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    if (!orderStatus) {
        throw new ApiError(400, "Order status is required");
    }

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    // Only admin can update order status
    if (!req.user.isAdmin) {
        throw new ApiError(403, "You don't have permission to update order status");
    }

    order.orderStatus = orderStatus;
    
    // If order is cancelled, restore product stock
    if (orderStatus === "CANCELLED" && order.orderStatus !== "CANCELLED") {
        for (const item of order.products) {
            const product = await Product.findById(item.product);
            if (product) {
                product.stockQuantity += item.quantity;
                await product.save();
            }
        }
    }

    await order.save();

    return res.status(200).json(
        new ApiResponse(200, order, "Order status updated successfully")
    );
});

const updatePaymentStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { paymentStatus, paymentId } = req.body;

    if (!paymentStatus) {
        throw new ApiError(400, "Payment status is required");
    }

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    // Only admin can update payment status
    if (!req.user.isAdmin) {
        throw new ApiError(403, "You don't have permission to update payment status");
    }

    order.paymentStatus = paymentStatus;
    if (paymentId) {
        order.paymentId = paymentId;
    }

    await order.save();

    return res.status(200).json(
        new ApiResponse(200, order, "Payment status updated successfully")
    );
});

const getAllOrders = asyncHandler(async (req, res) => {
    // Only admin can view all orders
    if (!req.user.isAdmin) {
        throw new ApiError(403, "You don't have permission to view all orders");
    }

    const orders = await Order.find({})
        .populate("user", "username email")
        .populate("products.product", "name price images")
        .sort("-createdAt");

    return res.status(200).json(
        new ApiResponse(200, orders, "All orders retrieved successfully")
    );
});

export {
    createOrder,
    getOrderById,
    getUserOrders,
    updateOrderStatus,
    updatePaymentStatus,
    getAllOrders
};