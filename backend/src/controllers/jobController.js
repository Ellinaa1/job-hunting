import { Employer, Job } from "../models/index.js";
import { Op } from "sequelize";
import { literal } from "sequelize";

class JobController {
  async getAllJobs(req, res) {
    try {
      const {
        keyword,
        category,
        city,
        type,
        level,
        salary,
        sort,
        minSalary,
        maxSalary,
        page = 1,
      } = req.query; // jobs?keyword=react&city=Yerevan&page=2

      const limit = 20;
      const offset = (page - 1) * limit;

      const where = {};
      const andConditions = [];
      let order = [["createdAt", "DESC"]];
      let attributes = { include: [] };

      // Keyword search
      if (keyword) {
        const words = keyword.trim().split(/\s+/);

        // Relevance score (safe, using literal)
        const scoreParts = words.map(
          () =>
            `(CASE WHEN title LIKE ? OR description LIKE ? THEN 1 ELSE 0 END)`,
        );

        attributes.include.push([
          literal(scoreParts.join(" + ")),
          "relevanceScore",
        ]);

        // Build where OR conditions
        where[Op.or] = words.flatMap((word) => [
          { title: { [Op.like]: `%${word}%` } },
          { description: { [Op.like]: `%${word}%` } },
        ]);

        // Sort by relevance first, then newest
        order = [
          [literal("relevanceScore"), "DESC"],
          ["createdAt", "DESC"],
        ];
      }

      // Filters
      if (category) where.category = category;
      if (city) where.city = city;
      if (type) where.type = type;
      if (level) where.level = level;

      // Salary filters
      if (salary === "mentioned") {
        andConditions.push({ salaryMin: { [Op.not]: null } });
        andConditions.push({ salaryMax: { [Op.not]: null } });
      } else if (salary === "not-mentioned") {
        andConditions.push({ salaryMin: null });
        andConditions.push({ salaryMax: null });
      }

      // Salary range filters (minSalary/maxSalary)
      if (minSalary) {
        andConditions.push({
          [Op.or]: [
            { salaryMax: { [Op.gte]: minSalary } },
            { salaryMax: { [Op.eq]: null } },
          ],
        });
      }
      if (maxSalary) {
        andConditions.push({
          [Op.or]: [
            { salaryMin: { [Op.lte]: maxSalary } },
            { salaryMin: { [Op.eq]: null } },
          ],
        });
      }

      if (andConditions.length > 0) {
        where[Op.and] = andConditions;
      }

      // Sorting (if keyword is NOT used)
      if (!keyword) {
        if (sort === "oldest") {
          order = [["createdAt", "ASC"]];
        } else if (sort === "highest-salary") {
          order = [[literal("COALESCE(salaryMax, salaryMin, 0)"), "DESC"]];
        } else if (sort === "lowest-salary") {
          order = [[literal("COALESCE(salaryMax, salaryMin, 0)"), "ASC"]];
        }
      }

      // Prepare replacements for safe literal binding (for relevanceScore)
      const replacements =
        keyword
          ?.trim()
          .split(/\s+/)
          .flatMap((word) => [`%${word}%`, `%${word}%`]) || [];

      const { rows, count } = await Job.findAndCountAll({
        where,
        order,
        attributes,
        limit,
        offset,
        replacements,
      });

      res.json({
        count,
        page: Number(page),
        limit,
        jobs: rows,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
  async getJobById(req, res) {
    const { id } = req.params;
    try {
      const job = await Job.findByPk(id);
      if (!job) return res.status(404).json({ error: "Job is not found" });

      res.json({ job });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Something went wrong" });
    }
  }
  async createJob(req, res) {
    try {
      const userId = req.user.id; // from auth middleware
      const { roleId } = req.user;

      if (roleId !== 2) {
        return res.status(403).json({
          error: "Access denied. Only employers can create jobs.",
        });
      }
      const employer = await Employer.findOne({ where: { userId } });
      if (!employer) {
        return res.status(404).json({ error: "Employer profile not found." });
      }

      const {
        title,
        description,
        location,
        salaryMin,
        salaryMax,
        category,
        city,
        type,
        level,
      } = req.body;

      if (salaryMin && salaryMax && salaryMin > salaryMax) {
        return res.status(400).json({
          error: "Minimum salary cannot be larger than maximum salary.",
        });
      }

      const newJob = await Job.create({
        employerId: employer.id,
        title,
        description,
        location,
        salaryMin,
        salaryMax,
        category,
        city,
        type,
        level,
        status: "open",
      });

      res.status(201).json({
        message: "Job created successfully",
        job: newJob,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
  async updateJobById(req, res) {
    try {
      const jobId = req.params.id;
      const userId = req.user.id;
      const { roleId } = req.user;

      if (roleId !== 2 && roleId !== 1) {
        return res.status(403).json({
          error: "Access denied. Only employers or admin can update jobs.",
        });
      }

      const job = await Job.findByPk(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job is not found." });
      }

      let employer = null;
      if (roleId !== 1) {
        employer = await Employer.findOne({ where: { userId } });

        if (!employer) {
          return res.status(404).json({ error: "Employer profile not found." });
        }

        if (job.employerId !== employer.id) {
          return res.status(403).json({
            error: "You cannot update a job you do not own.",
          });
        }
      }

      const {
        title,
        description,
        location,
        salaryMin,
        salaryMax,
        category,
        city,
        type,
        level,
        status,
      } = req.body;

      if (salaryMin && salaryMax && salaryMin > salaryMax) {
        return res.status(400).json({
          error: "Minimum salary cannot be larger than maximum salary.",
        });
      }

      await job.update({
        title,
        description,
        location,
        salaryMin,
        salaryMax,
        category,
        city,
        type,
        level,
        status,
      });

      res.json({
        message: "Job updated successfully",
        job,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
  async deleteJob(req, res) {
    try {
      const jobId = req.params.id;
      const userId = req.user.id;
      const { roleId } = req.user;

      if (roleId !== 2 && roleId !== 1) {
        return res.status(403).json({
          error: "Access denied. Only employers or admins can delete jobs.",
        });
      }

      const job = await Job.findByPk(jobId);

      if (!job) {
        return res.status(404).json({ error: "Job not found." });
      }

      if (roleId !== 1) {
        const employer = await Employer.findOne({ where: { userId } });
        if (!employer) {
          return res.status(404).json({ error: "Employer profile not found." });
        }
        if (job.employerId !== employer.id) {
          return res.status(403).json({
            error: "You cannot delete a job you do not own.",
          });
        }
      }

      await job.destroy();
      res.json({ message: "Job deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: "Server error: Could not delete job",
      });
    }
  }
  async getJobsByCompany(req, res) {
    try {
      const { id: companyId } = req.params;

      const jobs = await Job.findAll({
        include: [
          {
            model: Employer,
            where: { companyId },
            attributes: [], 
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      res.json({ jobs });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
  async getMyJobs(req, res) {
    try {
      const userId = req.user.id; // from auth middleware

      // Get all jobs posted by the authenticated employer
      const jobs = await Job.findAll({
        include: [
          {
            model: Employer,
            where: { userId },
            attributes: [],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      res.json({ jobs });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
  async closeJob(req, res) {
    try {
      const jobId = req.params.id;
      const userId = req.user.id;
      const { roleId } = req.user;

      const job = await Job.findByPk(jobId);
      if (!job) return res.status(404).json({ error: "Job not found." });

      if (roleId !== 1) {
        const employer = await Employer.findOne({ where: { userId } });
        if (!employer) {
          return res.status(404).json({ error: "Employer profile not found." });
        }
        if (job.employerId !== employer.id) {
          return res
            .status(403)
            .json({ error: "You cannot close a job you do not own." });
        }
      }

      job.status = "closed";
      await job.save();

      res.json({ message: "Job closed successfully", job });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
  async openJob(req, res) {
    try {
      const jobId = req.params.id;
      const userId = req.user.id;
      const { roleId } = req.user;

      const job = await Job.findByPk(jobId);
      if (!job) return res.status(404).json({ error: "Job not found." });

      if (roleId !== 1) {
        const employer = await Employer.findOne({ where: { userId } });
        if (!employer) {
          return res.status(404).json({ error: "Employer profile not found." });
        }
        if (job.employerId !== employer.id) {
          return res
            .status(403)
            .json({ error: "You cannot open a job you do not own." });
        }
      }

      job.status = "open";
      await job.save();

      res.json({ message: "Job reopened successfully", job });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
}

export default new JobController();
