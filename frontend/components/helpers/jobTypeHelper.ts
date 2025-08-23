import { jobTypes } from "../content/common/job_type";
import { industries } from "../content/common/industry";

export const getJobTypeNames = (jobTypeIds: string): string => {
  if (!jobTypeIds) return "";

  const ids = jobTypeIds.split(",").filter((id) => id.trim());
  const names = ids
    .map((id) => {
      const jobType = jobTypes.find((jt) => jt.id.toString() === id.trim());
      return jobType ? jobType.name : "";
    })
    .filter((name) => name);

  return names.join(", ");
};

export const getFirstJobTypeName = (jobTypeIds: string): string => {
  if (!jobTypeIds) return "";

  const firstId = jobTypeIds.split(",")[0]?.trim();
  if (!firstId) return "";

  const jobType = jobTypes.find((jt) => jt.id.toString() === firstId);
  return jobType ? jobType.name : "";
};

export const getIndustryNames = (industryIds: string): string => {
  if (!industryIds) return "";

  const ids = industryIds.split(",").filter((id) => id.trim());
  const names = ids
    .map((id) => {
      const industry = industries.find(
        (ind) => ind.id.toString() === id.trim()
      );
      return industry ? industry.name : "";
    })
    .filter((name) => name);

  return names.join(", ");
};

export const getFirstIndustryName = (industryIds: string): string => {
  if (!industryIds) return "";

  const firstId = industryIds.split(",")[0]?.trim();
  if (!firstId) return "";

  const industry = industries.find((ind) => ind.id.toString() === firstId);
  return industry ? industry.name : "";
};
