import { sequelize } from "../config/database.js";
import { User, Employer, Candidate } from "../models/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../utils/sendVerificationEmail.js";

class AuthController {
  async candidateSignup(req, res) {
    const {
      name,
      surname,
      email,
      password,
      profession,
      linkedin,
      phone,
      city,
      cvUrl,
    } = req.body;

    const t = await sequelize.transaction();

    try {
      const exists = await User.findOne({ where: { email } });
      if (exists) {
        return res
          .status(400)
          .json({ error: "Account with such email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create(
        {
          name,
          surname,
          email,
          password: hashedPassword,
          roleId: 3,
          isVerified: false,
        },
        { transaction: t }
      );

      const newCandidate = await Candidate.create(
        {
          userId: newUser.id,
          profession,
          linkedin,
          phone,
          city,
          cvUrl,
        },
        { transaction: t }
      );

      // 🌟 SEND EMAIL + GET TOKEN HERE
      const verificationToken = await sendVerificationEmail(
        newUser.name,
        newUser.email
      );

      // 🌟 SAVE TOKEN
      newUser.verificationToken = verificationToken;
      await newUser.save({ transaction: t });

      await t.commit();

      res.json({
        message: "Candidate signup successful. Please verify your email.",
        user: {
          name: newUser.name,
          surname: newUser.surname,
          email: newUser.email,
          roleId: newUser.roleId,
        },
        candidate: newCandidate,
      });
    } catch (err) {
      await t.rollback();
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }

  async employerSignup(req, res) {
    const { name, surname, email, password, position, phone, industry } =
      req.body;

    const t = await sequelize.transaction();

    try {
      const exists = await User.findOne({ where: { email } });
      if (exists) {
        return res
          .status(400)
          .json({ error: "User with such email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create(
        {
          name,
          surname,
          email,
          password: hashedPassword,
          roleId: 2,
          isVerified: false,
        },
        { transaction: t }
      );

      const newEmployer = await Employer.create(
        {
          userId: newUser.id,
          position,
          phone,
          industry,
        },
        { transaction: t }
      );

      // 🌟 SEND EMAIL + GET TOKEN
      const verificationToken = await sendVerificationEmail(
        newUser.name,
        newUser.email
      );

      // 🌟 SAVE TOKEN
      newUser.verificationToken = verificationToken;
      await newUser.save({ transaction: t });

      await t.commit();

      res.json({
        message: "Employer signup successful. Please verify your email.",
        user: {
          name: newUser.name,
          surname: newUser.surname,
          email: newUser.email,
          roleId: newUser.roleId,
        },
        employer: newEmployer,
      });
    } catch (err) {
      await t.rollback();
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }

  async verifyEmail(req, res) {
    const { token } = req.params;
    const user = await User.findOne({ where: { verificationToken: token } });
    if (!user) {
      return res.status(400).json({ error: "Invalid token" });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.json({ message: "Email verified successfully" });
  }

  async login(req, res) {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(400).json({ error: "Invalid email or password" });
      }

      if (user.isBlocked) {
        const now = Math.floor(Date.now() / 1000); // seconds
        const waitTime = 120; // seconds
        if (now - user.blockedTime < waitTime) {
          // chi ancel
          const remaining = waitTime - (now - user.blockedTime);
          return res.status(400).json({
            message: `Please, wait ${remaining} seconds to try again`,
          });
        } else {
          // ancel a
          user.attempts = 0;
          user.isBlocked = 0;
          user.blockedTime = -1;
          await user.save();
        }
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        user.attempts += 1;
        if (user.attempts > 3) {
          user.isBlocked = 1;
          user.blockedTime = Math.floor(Date.now() / 1000);
          await user.save();
          return res.status(400).json({
            message: "3 failed tries. Please, wait 2 minutes to try again",
          });
        }
        await user.save();
        return res.status(400).json({ message: "Wrong user credentials" });
      }

      const token = jwt.sign(
        {
          id: user.id,
          roleId: user.roleId,
          email: user.email,
          isVerified: user.isVerified,
        },
        process.env.JWT_SECRET,
        { expiresIn: "100d" } //
      );

      return res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          surname: user.surname,
          email: user.email,
          roleId: user.roleId,
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  async logout(req, res) {
    // not done
    try {
      // On the backend side there is nothing to delete.
      // Logout simply tells the client to remove the JWT.

      return res.json({ message: "Logout successful" });
    } catch (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  }
  async refreshToken(req, res) {} // not done
}

export default new AuthController();
