import {
  Application,
  Job,
  Candidate,
  User,
  Employer,
} from "../models/index.js";

class ApplicationController {
  async applyForJob(req, res) {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;
      const { roleId } = req.user;

      if (roleId !== 3) {
        //candidate
        return res.status(403).json({
          error: "Access denied. Only candidates can apply for jobs.",
        });
      }

      const candidate = await Candidate.findOne({ where: { userId } });
      if (!candidate) {
        return res.status(404).json({
          error: "Candidate profile not found.",
        });
      }

      const job = await Job.findByPk(jobId);
      if (!job) {
        return res.status(404).json({
          error: "Job not found.",
        });
      }

      const newApplication = await Application.create({
        candidateId: candidate.id,
        jobId,
        status: "pending",
      });

      res.status(201).json({
        message: "Application submitted successfully",
        application: newApplication,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: "Something went wrong",
      });
    }
  }
  async getCandidateApplications(req, res) {
    try {
      const { id: userId, roleId } = req.user; // user info

      // Only candidates can view their applications
      if (roleId !== 3) {
        return res.status(403).json({
          error: "Only candidates can view their applications.",
        });
      }

      // Find candidate profile
      const candidate = await Candidate.findOne({ where: { userId } });
      if (!candidate) {
        return res.status(404).json({
          error: "Candidate profile not found.",
        });
      }

      // Fetch all applications with Job info
      const applications = await Application.findAll({
        where: { candidateId: candidate.id },
        include: [
          {
            model: Job, // matches your association
            attributes: [
              "id",
              "title",
              "description",
              "location",
              "salaryMin",
              "salaryMax",
              "category",
              "city",
              "type",
              "level",
              "status",
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      // Send response
      res.json({
        applications,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: "Something went wrong",
      });
    }
  }
  async getJobApplications(req, res) {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;
      const { roleId } = req.user;

      if (roleId !== 2 && roleId !== 1) {
        return res.status(403).json({
          error: "Access denied. Only employers can view job applications.",
        });
      }

      const job = await Job.findByPk(jobId);
      if (!job) {
        return res.status(404).json({
          error: "Job not found.",
        });
      }

      const applications = await Application.findAll({
        where: { jobId },
        include: [
          {
            model: Candidate,
            as: "candidate",
            attributes: [
              "id",
              "profession",
              "city",
              "phone",
              "linkedin",
              "cvUrl",
            ],
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

      res.json({
        job: {
          id: job.id,
          title: job.title,
        },
        applications,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: "Something went wrong",
      });
    }
  }
  async updateApplicationStatus(req, res) {
    try {
      const { applicationId } = req.params;
      const { status } = req.body;
      const { id: userId, roleId } = req.user;

      const validStatuses = ["pending", "accepted", "rejected"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }

      const application = await Application.findByPk(applicationId, {
        include: [
          {
            model: Job,
            attributes: ["id", "title", "employerId"],
          },
        ],
      });

      if (!application) {
        return res.status(404).json({
          error: "Application not found.",
        });
      }

      if (roleId !== 2 && roleId !== 1) {
        return res.status(403).json({
          error: "Only employers can update application status.",
        });
      }

      if (roleId !== 1) {
        const employer = await Employer.findOne({ where: { userId } });
        if (!employer || application.Job.employerId !== employer.id) {
          return res.status(403).json({
            error: "You cannot update an application for a job you do not own.",
          });
        }
      }

      application.status = status;
      await application.save();

      res.json({
        message: "Application status updated successfully",
        application,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: "Something went wrong",
      });
    }
  }
  async getApplicationById(req, res) {
    try {
      const { applicationId } = req.params;
      const userId = req.user.id;
      const { roleId } = req.user;

      const application = await Application.findByPk(applicationId, {
        include: [
          {
            model: Job,
            as: "job",
            attributes: [
              "id",
              "title",
              "description",
              "location",
              "salaryMin",
              "salaryMax",
              "category",
              "city",
              "type",
              "level",
              "status",
            ],
          },
          {
            model: Candidate,
            as: "candidate",
            attributes: [
              "id",
              "profession",
              "city",
              "phone",
              "linkedin",
              "cvUrl",
            ],
            include: [
              {
                model: User,
                as: "user",
                attributes: ["id", "name", "surname", "email"],
              },
            ],
          },
        ],
      });

      if (!application) {
        return res.status(404).json({
          error: "Application not found.",
        });
      }

      // Check permissions
      if (roleId === 3) {
        // Candidate can only view their own applications
        const candidate = await Candidate.findOne({ where: { userId } });
        if (!candidate || application.candidateId !== candidate.id) {
          return res.status(403).json({
            error: "You can only view your own applications.",
          });
        }
      } else if (roleId === 2) {
        // Employer can only view applications for their jobs
        const employer = await Employer.findOne({ where: { userId } });
        if (!employer || application.job.employerId !== employer.id) {
          return res.status(403).json({
            error: "You cannot view this application.",
          });
        }
      }
      // Admin can view all (no check needed)

      res.json({
        application,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: "Something went wrong",
      });
    }
  }
  async withdrawApplication(req, res) { //candidate deletes
    try {
      const { applicationId } = req.params;
      const userId = req.user.id;
      const { roleId } = req.user;

      if (roleId !== 3) {
        return res.status(403).json({
          error: "Only candidates can withdraw applications.",
        });
      }

      const candidate = await Candidate.findOne({ where: { userId } });
      if (!candidate) {
        return res.status(404).json({
          error: "Candidate profile not found.",
        });
      }

      const application = await Application.findByPk(applicationId);

      if (!application) {
        return res.status(404).json({
          error: "Application not found.",
        });
      }

      if (application.status === "accepted") {
        return res.status(400).json({
          error:
            "Cannot delete an accepted application. Please contact the employer.",
        });
      }

      await application.destroy();

      res.json({
        message: "Application withdrawn successfully",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: "Something went wrong",
      });
    }
  }
}

export default new ApplicationController();
