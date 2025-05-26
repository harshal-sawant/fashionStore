import mongoose, { Schema } from "mongoose";

const cartItemSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, "Quantity cannot be less than 1"],
        default: 1
    },
    price: {
        type: Number,
        required: true
    }
});

const cartSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        items: [cartItemSchema],
        totalAmount: {
            type: Number,
            required: true,
            default: 0
        },
        status: {
            type: String,
            enum: ["active", "completed", "abandoned"],
            default: "active"
        }
    },
    {
        timestamps: true
    }
);

// Method to calculate total cart amount
cartSchema.methods.calculateTotalAmount = function() {
    this.totalAmount = this.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
    return this.totalAmount;
};

// Pre-save middleware to calculate total amount
cartSchema.pre("save", function(next) {
    this.calculateTotalAmount();
    next();
});

export const Cart = mongoose.model("Cart", cartSchema);