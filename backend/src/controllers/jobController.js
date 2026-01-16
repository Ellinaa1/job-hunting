import { Job } from "../models/index.js";
import { Employer } from "../models/index.js";
import { Op } from "sequelize";
import { fn, col, literal } from "sequelize";

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
        page = 1,
      } = req.query;

      const limit = 20; // 1 pageum 20 job
      const offset = (page - 1) * limit; // 2rd pagum piti 20rdic sksi, 2rd-um 40

      const where = {};
      const andConditions = [];
      let order = [["createdAt", "DESC"]];
      let attributes = { include: [] };

      // keyword search
      if (keyword) {
        const words = keyword.trim().split(/\s+/);
        // words = ["senior", "react", "developer"]

        // relevance score (3 → 2 → 1)
        const scoreParts = words.map(
          (word) => `
        (CASE 
          WHEN title LIKE '%${word}%' 
            OR description LIKE '%${word}%' 
          THEN 1 ELSE 0 
        END)
      `
        );

        // add relevanceScore to result
        attributes.include.push([
          literal(scoreParts.join(" + ")),
          "relevanceScore",
        ]);

        // match at least 1 word
        where[Op.or] = words.flatMap((word) => [
          { title: { [Op.like]: `%${word}%` } },
          { description: { [Op.like]: `%${word}%` } },
        ]);

        // sort by relevance first, then by newest
        order = [
          [literal("relevanceScore"), "DESC"],
          ["createdAt", "DESC"],
        ];
      }

      // fitlers
      if (category) where.category = category;
      if (city) where.city = city;
      if (type) where.type = type;
      if (level) where.level = level;

      // salary filters
      if (salary === "mentioned") {
        andConditions.push({ salaryMin: { [Op.not]: null } });
        andConditions.push({ salaryMax: { [Op.not]: null } });
      }

      if (salary === "not-mentioned") {
        andConditions.push({ salaryMin: null });
        andConditions.push({ salaryMax: null });
      }

      if (andConditions.length > 0) {
        where[Op.and] = andConditions;
      }

      // -----------------------------------
      // 4. Sorting (if user selected it)
      //    IMPORTANT: This must NOT override keyword search ordering!
      // -----------------------------------
      if (!keyword) {
        // ONLY apply these sorts if keyword is NOT used
        if (sort === "oldest") {
          order = [["createdAt", "ASC"]];
        } else if (sort === "highest-salary") {
          order = [[literal("COALESCE(salaryMax, salaryMin, 0)"), "DESC"]];
        } else if (sort === "lowest-salary") {
          order = [[literal("COALESCE(salaryMax, salaryMin, 0)"), "ASC"]];
        }
      }

      const { rows, count } = await Job.findAndCountAll({
        where,
        order,
        attributes,
        limit,
        offset,
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
        return res
          .status(400)
          .json({ error: "salaryMin cannot be larger than salaryMax." });
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
      const jobId = req.params.id; // ✔ using id from route, but renamed to jobId
      const userId = req.user.id;
      const { roleId } = req.user;

      // 1. Only employers or admin can update jobs
      if (roleId !== 2 && roleId !== 1) {
        return res.status(403).json({
          error: "Access denied. Only employers or admin can update jobs.",
        });
      }

      // 2. Find job
      const job = await Job.findByPk(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found." });
      }

      // 3. Ownership check for employer (admin skips this)
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

      // 4. Validate salary
      if (salaryMin && salaryMax && salaryMin > salaryMax) {
        return res.status(400).json({
          error: "salaryMin cannot be greater than salaryMax.",
        });
      }

      // 5. Update job
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
  async getJobsByEmployer(req, res) {
    try {
      const { id: employerId } = req.params;

      const jobs = await Job.findAll({
        where: { employerId },
        order: [["createdAt", "DESC"]],
      });

      res.json({ jobs });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  } // not checked
  async closeJob(req, res) {
    try {
      const jobId = req.params.id;
      const userId = req.user.id;
      const { roleId } = req.user;

      const job = await Job.findByPk(jobId);
      if (!job) return res.status(404).json({ error: "Job not found." });

      // Employer ownership check (admin bypasses)
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
  } // not checked
  async openJob(req, res) {
    try {
      const jobId = req.params.id;
      const userId = req.user.id;
      const { roleId } = req.user;

      const job = await Job.findByPk(jobId);
      if (!job) return res.status(404).json({ error: "Job not found." });

      // Employer ownership check (admin bypasses)
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
  } // not checked
}

export default new JobController();
