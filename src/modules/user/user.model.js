
import mongoose from "mongoose";
import { Counter } from "../counter/counter.model.js";

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      minlength: 3,
      maxlength: 30,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    status: {
      type: Boolean,
      default: true
    },

    // Profile
    avatar: {
      type: String, // URL
      default: null,
    },

    bio: {
      type: String,
      maxlength: 250,
      default: "",
    },

    // Presence
    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },

    lastSeen: {
      type: Date,
      default: null,
    },

    // Soft delete support
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ isOnline: 1 });

userSchema.pre("save", async function () {
  if (!this.isNew) return;

  const currentYear = new Date().getFullYear();

  const counter = await Counter.findOneAndUpdate(
    { name: "userId", year: currentYear },
    { $inc: { seq: 1 } },
    {
      upsert: true,
      returnDocument: "after"
    }
  );

  const sequence = counter.seq.toString().padStart(4, "0");

  this.userId = Number(`${currentYear}${sequence}`);
});

export const User = mongoose.model("User", userSchema);