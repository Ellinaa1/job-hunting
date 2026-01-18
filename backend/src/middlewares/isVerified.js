// export function isVerified(req, res, next) {
//   if (!req.user.isVerified) {
//     return res.status(403).json({
//       error: "Please verify your email to perform this action."
//     });
//   }
//   next();
// }



// import User from "../models/User.js";

// export async function isVerified(req, res, next) {
//   try {
//     const user = await User.findByPk(req.user.id);

//     if (!user || !user.isVerified) {
//       return res.status(403).json({
//         error: "Please verify your email to perform this action."
//       });
//     }

//     // attach the fresh user to req.user
//     req.user = user;

//     next();
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Something went wrong" });
//   }
// }


import { User } from "../models/User.js"; 

export async function isVerified(req, res, next) {
  try {

    // fetch the latest user from DB
    const user = await User.findByPk(req.user.id);

    if (!user || !user.isVerified) {
      return res.status(403).json({
        error: "Please verify your email to perform this action."
      });
    }

    // attach the fresh user to req.user for downstream controllers
    req.user = user;

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
}
