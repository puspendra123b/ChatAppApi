import userRepository from "../modules/user/user.repository.js";
import { verifyToken } from "../utils/common.js";
import { sendError } from "../utils/response.handler.js";

export const authHandler = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = verifyToken(token);

      if (!decoded) {
        throw new Error("Invalid Access Token!");
      }

      const userData = await userRepository.findUserByEmail(
        decoded.email,
        "email userId",
      );

      req.user = {
        id: userData._id,
        email: userData.email,
        userId: userData.userId,
      };
      next();
    } catch (error) {
      console.log(error);
      return res.status(401).json({
        success: false,
        message: error.message || "Not authorized, token validation failed",
      });
    }
  } else {
    return sendError(
      res,
      {
        success: false,
        message: "Not authorized, no token provided",
      },
      401,
    );
  }
};
