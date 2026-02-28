import { User } from "./user.model.js";
import mongoose from "mongoose";

class UserRepository {
  async createUser(payload) {
    const user = new User(payload);
    return await user.save();
  }

  async findUserByFilter(filter, select = "") {
    return await User.findOne(filter).select(select).lean();
  }

  async findUserById(id, select = "") {
    return await User.findById(id).select(select).lean();
  }

  async findUserByEmail(email, select = "") {
    return await User.findOne({
      email: email,
    })
      .select(select)
      .lean();
  }

  async findUserByEmailOrUserId(identifier, select = "") {
    return await User.findOne({
      $or: [{ email: identifier }, { userId: identifier }],
    })
      .select(select)
      .lean();
  }

  /**
   * Search users by email or userId, excluding the current user.
   */
  async searchUsers(query, excludeUserId) {
    return await User.find({
      _id: { $ne: new mongoose.Types.ObjectId(excludeUserId) },
      isDeleted: { $ne: true },
      $or: [
        { email: { $regex: query, $options: "i" } },
        { userId: { $regex: query, $options: "i" } },
      ],
    })
      .select("email userId avatar bio isOnline lastSeen")
      .limit(20)
      .lean();
  }
}

export default new UserRepository();
