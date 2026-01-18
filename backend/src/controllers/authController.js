import { sequelize } from "../config/database.js";
import { User, Employer, Candidate } from "../models/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../utils/sendVerificationEmail.js";
import { sendPasswordResetEmail } from "../utils/sendPasswordResetEmail.js";

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

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
          roleId: 3, // candidate
          isVerified: false,
        },
        { transaction: t },
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
        { transaction: t },
      );

      // send email get token
      const verificationToken = await sendVerificationEmail(
        newUser.name,
        newUser.email,
      );

      // save token
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

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
        { transaction: t },
      );

      const newEmployer = await Employer.create(
        {
          userId: newUser.id,
          position,
          phone,
          industry,
        },
        { transaction: t },
      );

      // send email, get token
      const verificationToken = await sendVerificationEmail(
        newUser.name,
        newUser.email,
      );

      // save token
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
        { expiresIn: "100d" },
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
  async renderResetPasswordPage(req, res) {
    try {
      const { token } = req.params;

      const user = await User.findOne({
        where: { resetToken: token },
      });

      if (!user || new Date() > user.resetTokenExpiry) {
        return res.status(400).send("Reset link is invalid or expired");
      }

      res.send(`
        <html>
          <body>
            <h2>Reset password</h2>
            <form method="POST" action="/auth/reset-password/${token}">
              <input 
                type="password" 
                name="newPassword" 
                placeholder="New password" 
                required 
              />
              <br/><br/>
              <button type="submit">Reset</button>
            </form>
          </body>
        </html>
      `);
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  }
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        // Don't reveal if email exists or not (security)
        return res.json({
          message: "If an account exists, a password reset link has been sent",
        });
      }

      // Generate reset token (valid for 1 hour)
      const resetToken = await sendPasswordResetEmail(user.name, user.email);

      // Save token and expiry to user
      user.resetToken = resetToken;
      user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      return res.json({
        message: "If an account exists, a password reset link has been sent",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }
  async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({ error: "New password is required" });
      }

      const user = await User.findOne({
        where: { resetToken: token },
      });

      if (!user) {
        return res.status(400).json({ error: "Invalid or expired reset link" });
      }

      // Check if token is expired
      if (new Date() > user.resetTokenExpiry) {
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await user.save();
        return res.status(400).json({ error: "Reset link has expired" });
      }

      // Hash and update password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save();

      return res.json({ message: "Password reset successfully" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }
}

export default new AuthController();
