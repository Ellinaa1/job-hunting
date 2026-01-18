import { Company, Employer } from "../models/index.js";

class CompanyController {
  async listCompanies(req, res) {
    try {
      const companies = await Company.findAll({
        attributes: [
          "id",
          "name",
          "description",
          "industry",
          "location",
          "website",
          "logoUrl",
        ],
        order: [["name", "ASC"]],
      });

      res.json({ companies });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
  async getCompanyById(req, res) {
    try {
      const { companyId } = req.params;
      const company = await Company.findByPk(companyId, {
        attributes: [
          "id",
          "name",
          "description",
          "industry",
          "location",
          "website",
          "logoUrl",
        ],
      });

      if (!company) {
        return res.status(404).json({ error: "Company not found." });
      }
      res.json({ company });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
  async createCompany(req, res) {
    try {
      const { id: userId, roleId } = req.user;
      const { name, description, industry, location, website, logoUrl } =
        req.body;

      if (roleId !== 2 && roleId !== 1) {
        return res.status(403).json({
          error:
            "Access denied. Only employers or admins can create a company.",
        });
      }

      if (roleId === 2) {
        const existingEmployer = await Employer.findOne({ where: { userId } });
        if (existingEmployer && existingEmployer.companyId) {
          return res.status(400).json({ error: "You already have a company." });
        }
      }

      const newCompany = await Company.create({
        name,
        description,
        industry,
        location: location || null,
        website: website || null,
        logoUrl: logoUrl || null,
      });

      if (roleId === 2) {
        const employer = await Employer.findOne({ where: { userId } });
        if (employer) {
          employer.companyId = newCompany.id;
          await employer.save();
        }
      }

      res
        .status(201)
        .json({ message: "Company created successfully", company: newCompany });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
  async updateCompany(req, res) {
    try {
      const { companyId } = req.params;
      const { id: userId, roleId } = req.user;
      const { name, description, industry, location, website, logoUrl } =
        req.body;

      const company = await Company.findByPk(companyId);
      if (!company) {
        return res.status(404).json({ error: "Company not found." });
      }

      if (roleId === 2) {
        //employer
        const employer = await Employer.findOne({ where: { userId } });
        if (!employer || employer.companyId !== company.id) {
          return res
            .status(403)
            .json({ error: "You cannot update a company you do not own." });
        }
      } else if (roleId !== 1) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (name) company.name = name;
      if (industry) company.industry = industry;
      if (description) company.description = description;
      if (location) company.location = location;
      if (website) company.website = website;
      if (logoUrl) company.logoUrl = logoUrl;

      await company.save();

      res.json({ message: "Company updated successfully", company });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
  async deleteCompany(req, res) {
    try {
      const { companyId } = req.params;
      const { id: userId, roleId } = req.user;

      const company = await Company.findByPk(companyId);
      if (!company) {
        return res.status(404).json({ error: "Company not found." });
      }

      if (roleId !== 1) {
        return res
          .status(403)
          .json({ error: "Access denied. Only admins can delete a company." });
      }

      await company.destroy();

      res.json({ message: "Company deleted successfully." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
}

export default new CompanyController();
