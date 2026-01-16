import { sequelize } from "../config/database.js";
import { User } from "./User.js";
import { Role } from "./Role.js";
import { Employer } from "./Employer.js";
import { Candidate } from "./Candidate.js";
import { Company } from "./Company.js";
import { Application } from "./Application.js";
import { Job } from "./Job.js";

Role.hasMany(User, { foreignKey: "roleId" });
User.belongsTo(Role, { foreignKey: "roleId" });

User.hasMany(Employer, { foreignKey: "userId" });
Employer.belongsTo(User, { foreignKey: "userId"});

User.hasMany(Candidate, { foreignKey: "userId" });
Candidate.belongsTo(User, { foreignKey: "userId" });

Company.hasMany(Employer, { foreignKey: "companyId" });
Employer.belongsTo(Company, { foreignKey: "companyId"});

Employer.hasMany(Job, { foreignKey: "employerId" });
Job.belongsTo(Employer, { foreignKey: "employerId" });

Candidate.hasMany(Application, { foreignKey: "candidateId" });
Application.belongsTo(Candidate, { foreignKey: "candidateId" });

Job.hasMany(Application, { foreignKey: "jobId" });
Application.belongsTo(Job, { foreignKey: "jobId" });

export {
  sequelize,
  User,
  Role,
  Employer,
  Candidate,
  Company,
  Job,
  Application,
};
