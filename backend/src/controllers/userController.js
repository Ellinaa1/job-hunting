import { User, Candidate, Employer } from "../models/index.js";
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
    const { id } = req.params;
    const user = User.findByPk(id);
    if (!user)
      return res.status(404).json({ error: "User with such id doesn't exist" });
    const roleId = user.roleId
    
  }
}

export default new UserController();
