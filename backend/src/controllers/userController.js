import {
  User,
  Candidate,
  Employer,
  Application,
  Job,
} from "../models/index.js";
import bcrypt from "bcrypt";

class UserController {
  async profile(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findByPk(userId);

      if (!user) return res.status(404).json({ error: "User not found" });

      const role = user.roleId;

      let response = {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: role === 1 ? "admin" : role === 2 ? "employer" : "candidate",
      };

      if (role === 3) {
        //candidate
        const candidate = await Candidate.findOne({ where: { userId } });
        response = {
          ...response,
          profession: candidate.profession,
          phone: candidate.phone,
          city: candidate.city,
          linkedin: candidate.linkedin,
          cvUrl: candidate.cvUrl,
        };
      }

      if (role === 2) {
        // emp
        const employer = await Employer.findOne({ where: { userId } });
        response = {
          ...response,
          position: employer.position,
          phone: employer.phone,
          industry: employer.industry,
          companyId: employer.companyId,
        };
      }
      return res.json(response);
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Server error" });
    }
  }
  async getUser(req, res) {
    try {
      const { id } = req.params; // the user we wanna find
      const user = await User.findByPk(id);

      if (!user)
        return res
          .status(404)
          .json({ error: "User with such id doesn't exist" });

      const requesterRole = req.user.roleId;
      const targetRole = user.roleId;

      if (targetRole === 1) {
        // Nobody can see admins except themselves
        if (req.user.id !== user.id) {
          return res
            .status(403)
            .json({ error: "Forbidden: cannot view admin profile" });
        }
      }

      if (requesterRole === 2 && targetRole !== 3) {
        // requester-employer target-not-candidate
        return res
          .status(403)
          .json({ error: "Forbidden: employers can only view candidates" });
      }

      if (requesterRole === 3 && targetRole !== 2) {
        // requester-candidate target-not-employer
        return res
          .status(403)
          .json({ error: "Forbidden: candidates can only view employers" });
      }

      let response = {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role:
          targetRole === 1
            ? "admin"
            : targetRole === 2
              ? "employer"
              : "candidate",
      };

      // Add role-specific info if allowed
      if (targetRole === 3) {
        //candidate
        const candidate = await Candidate.findOne({ where: { userId: id } });
        response = {
          ...response,
          profession: candidate.profession,
          phone: candidate.phone,
          city: candidate.city,
          linkedin: candidate.linkedin,
          cvUrl: candidate.cvUrl,
        };
      }

      if (targetRole === 2) {
        // employer
        const employer = await Employer.findOne({ where: { userId: id } });
        response = {
          ...response,
          position: employer.position,
          phone: employer.phone,
          industry: employer.industry,
          companyId: employer.companyId,
        };
      }

      return res.json(response);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const {
        name,
        surname,
        email,
        profession,
        phone,
        city,
        linkedin,
        cvUrl,
        position,
        industry,
      } = req.body;

      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      if (email && email !== user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          return res.status(400).json({ error: "Email already in use" });
        }
      }

      if (name) user.name = name;
      if (surname) user.surname = surname;
      if (email) user.email = email;

      await user.save();

      if (user.roleId === 3) {
        // Candidate
        const candidate = await Candidate.findOne({ where: { userId } });
        if (candidate) {
          if (profession) candidate.profession = profession;
          if (phone) candidate.phone = phone;
          if (city) candidate.city = city;
          if (linkedin) candidate.linkedin = linkedin;
          if (cvUrl) candidate.cvUrl = cvUrl;
          await candidate.save();
        }
      } else if (user.roleId === 2) {
        // Employer
        const employer = await Employer.findOne({ where: { userId } });
        if (employer) {
          if (position) employer.position = position;
          if (phone) employer.phone = phone;
          if (industry) employer.industry = industry;
          await employer.save();
        }
      }

      return res.json({
        message: "Profile updated successfully",
        user: {
          id: user.id,
          name: user.name,
          surname: user.surname,
          email: user.email,
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }
  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: "Both passwords are required" });
      }

      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      // Verifying old password
      const validPassword = await bcrypt.compare(oldPassword, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: "Old password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      return res.json({ message: "Password changed successfully" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }
  async deleteAccount(req, res) {
    try {
      const userId = req.user.id;

      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      // Candidadte or employer will also be deleted
      await user.destroy();

      return res.json({ message: "Account deleted successfully" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }
  async getMyApplications(req, res) {
    try {
      const userId = req.user.id;
      const { roleId } = req.user;

      // Candidate: get their own applications
      if (roleId === 3) {
        const candidate = await Candidate.findOne({ where: { userId } });
        if (!candidate) {
          return res.status(404).json({
            error: "Candidate profile not found.",
          });
        }

        const applications = await Application.findAll({
          where: { candidateId: candidate.id },
          include: [
            {
              model: Job,
              as: "job",
              attributes: ["id", "title", "description", "location", "salaryMin", "salaryMax", "category", "city", "type", "level", "status"],
            },
          ],
          order: [["createdAt", "DESC"]],
        });

        return res.json({ applications });
      }

      // Employer: get all applications for their jobs
      if (roleId === 2) {
        const employer = await Employer.findOne({ where: { userId } });
        if (!employer) {
          return res.status(404).json({
            error: "Employer profile not found.",
          });
        }

        const jobs = await Job.findAll({
          where: { employerId: employer.id },
          attributes: ["id"],
        });

        const jobIds = jobs.map((job) => job.id);

        if (jobIds.length === 0) {
          return res.json({ applications: [] });
        }

        const applications = await Application.findAll({
          where: { jobId: jobIds },
          include: [
            {
              model: Job,
              as: "job",
              attributes: ["id", "title", "description"],
            },
            {
              model: Candidate,
              as: "candidate",
              attributes: ["id", "profession", "city", "phone", "linkedin", "cvUrl"],
              include: [
                {
                  model: User,
                  as: "user",
                  attributes: ["id", "name", "surname", "email"],
                },
              ],
            },
          ],
          order: [["createdAt", "DESC"]],
        });

        return res.json({ applications });
      }

      // Admin: get all applications
      if (roleId === 1) {
        const applications = await Application.findAll({
          include: [
            {
              model: Job,
              as: "job",
              attributes: ["id", "title", "description"],
            },
            {
              model: Candidate,
              as: "candidate",
              attributes: ["id", "profession", "city", "phone", "linkedin", "cvUrl"],
              include: [
                {
                  model: User,
                  as: "user",
                  attributes: ["id", "name", "surname", "email"],
                },
              ],
            },
          ],
          order: [["createdAt", "DESC"]],
        });

        return res.json({ applications });
      }

      return res.status(403).json({
        error: "Invalid role.",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }
}

export default new UserController();
