// src/modules/chat/chat.model.js

import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
      index: true,
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    name: {
      type: String, // only for group chats
      default: null,
    },

    avatar: {
      type: String, // group avatar
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

chatSchema.index({ members: 1 });
chatSchema.index({ createdAt: -1 });
chatSchema.index({ type: 1, members: 1 });

export const Chat = mongoose.model("Chat", chatSchema);