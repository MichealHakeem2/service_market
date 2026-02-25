const jwt = require("jsonwebtoken");
const Token = require("../models/Token");
const User = require("../models/Users");

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing"
      });
    }
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing"
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const dbToken = await Token.findOne({
      where: {
        token,
        user_id: decoded.id,
        status: "active"
      }
    });

    if (!dbToken) {
      return res.status(401).json({
        success: false,
        message: "Token revoked or not found"
      });
    }
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists"
      });
    }
    req.user = decoded;
    req.token = token;      
    req.dbToken = dbToken;  
    req.userData = user;    
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired"
      });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }

    console.error("verifyToken error:", err);

    return res.status(500).json({
      success: false,
      message: "Authentication failure"
    });
  }
};

module.exports = verifyToken;
// const jwt = require("jsonwebtoken");

// const authorize = (...allowedRoles) => {
//   return (req, res, next) => {
//     try {
//       const authHeader = req.headers.authorization;

//       if (!authHeader) {
//         return res.status(401).json({ message: "Unauthorized" });
//       }

//       const token = authHeader.startsWith("Bearer ")
//         ? authHeader.split(" ")[1]
//         : authHeader;

//       const decoded = jwt.verify(token, process.env.JWT_SECRET);

//       req.user = decoded;

//       // ✅ Role check
//       if (!allowedRoles.includes(decoded.role)) {
//         return res.status(403).json({
//           message: "Forbidden — insufficient permissions"
//         });
//       }

//       next();

//     } catch (err) {
//       return res.status(401).json({ message: "Invalid or expired token" });
//     }
//   };
// };

// module.exports = authorize;
