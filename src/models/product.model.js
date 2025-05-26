import mongoose, {Schema} from "mongoose";

const productSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        price: {
            type: Number,
            required: true,
            min: [0, "Price cannot be negative"]
        },
        category: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        stockQuantity: {
            type: Number,
            required: true,
            min: [0, "Stock quantity cannot be negative"],
            default: 0
        },
        images: [{
            type: String,
            required: true
        }],
        sizes: [{
            size: {
                type: String,
                required: true,
                trim: true
            },
            quantity: {
                type: Number,
                required: true,
                min: [0, "Size quantity cannot be negative"],
                default: 0
            }
        }],
        isAvailable: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

export const Product = mongoose.model("Product", productSchema);