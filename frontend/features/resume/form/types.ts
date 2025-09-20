export type ExperienceDraft = {
  id: number;
  company: string;
  periodFrom: string; // YYYY-MM
  periodTo: string; // YYYY-MM or ''
  employmentType?: string;
  business: string;
  capital?: string;
  teamSize?: string;
  tasks: string;
  position?: string;
  industry?: string;
};

export type PreferenceDraft = {
  desiredSalary?: string;
  desiredIndustries: string[];
  desiredJobTypes: string[];
  desiredLocations: string[];
  workStyle?: string;
  availableDate?: string;
};

import { EducationFormData, CertificationFormData } from '@/types/api-v2';

export type ResumeDraft = {
  resumeId?: string;
  title: string;
  description?: string;
  objective?: string;
  skills?: string;
  selfPr?: string;
  isActive: boolean;
  experiences: ExperienceDraft[];
  preference: PreferenceDraft;
  educations?: EducationFormData[];
  certifications?: CertificationFormData[];
};

export type ExperienceValidationResult = {
  company?: string;
  periodFrom?: string;
  periodTo?: string;
  tasks?: string;
  employmentType?: string;
};
