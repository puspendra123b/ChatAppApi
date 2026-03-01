import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            index: true,
        },

        code: {
            type: String,
            required: true,
        },

        purpose: {
            type: String,
            enum: ["signup", "login"],
            default: "signup",
        },

        verified: {
            type: Boolean,
            default: false,
        },

        attempts: {
            type: Number,
            default: 0,
        },

        // Auto-expire after 10 minutes
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 10 * 60 * 1000),
            index: { expires: 0 }, // TTL index — MongoDB auto-deletes expired docs
        },
    },
    {
        timestamps: true,
    }
);

export const Otp = mongoose.model("Otp", otpSchema);
