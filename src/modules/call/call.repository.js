import mongoose from "mongoose";
import callModel from "./call.model.js";


class CallRepository {
  async createCall(data) {
    const output = new callModel(data);
    return await output.save();
  }

  async updateCallStatus(callId, status, extraData = {}) {
    return await callModel.findOneAndUpdate(
      { callId },
      { $set: { status, ...extraData } },
      { new: true }
    );
  }
}

export default new CallRepository();
