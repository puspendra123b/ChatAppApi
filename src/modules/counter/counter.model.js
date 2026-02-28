import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  year: { type: Number, required: true },
  seq: { type: Number, default: 0 },
});

counterSchema.index({ name: 1, year: 1 }, { unique: true });

export const Counter = mongoose.model("Counter", counterSchema);
