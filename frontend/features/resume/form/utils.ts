import { Experience, Resume, SeekerProfile } from '@/types/api-v2';
import { ExperienceDraft, ResumeDraft } from './types';
import { DEFAULT_RESUME_TITLE } from './constants';

const toMonthString = (value?: string | null): string => {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    }
  } catch {}
  const normalized = String(value);
  if (/^\d{4}-\d{2}$/.test(normalized)) return normalized;
  if (/^\d{4}\/\d{2}$/.test(normalized)) return normalized.replace('/', '-');
  return normalized;
};

export const experienceToDraft = (exp: Experience, index: number): ExperienceDraft => ({
  id: index,
  company: exp.company || '',
  periodFrom: toMonthString(exp.period_from),
  periodTo: toMonthString(exp.period_to),
  employmentType: exp.employment_type || 'fulltime',
  business: exp.business || '',
  capital: exp.capital || '',
  teamSize: exp.team_size || '',
  tasks: exp.tasks || '',
  position: exp.position || '',
  industry: exp.industry || '',
});

export const buildResumeDraft = (resume?: Resume | null, profile?: SeekerProfile | null): ResumeDraft => {
  if (!resume) {
    return {
      title: DEFAULT_RESUME_TITLE,
      description: '',
      objective: '',
      skills: '',
      selfPr: '',
      isActive: true,
      experiences: [],
      preference: {
        desiredSalary: profile?.desired_salary,
        desiredIndustries: [],
        desiredJobTypes: [],
        desiredLocations: [],
        workStyle: '',
        availableDate: '',
      },
    };
  }

  return {
    resumeId: resume.id as unknown as string,
    title: resume.title || DEFAULT_RESUME_TITLE,
    description: resume.description || '',
    objective: resume.objective || '',
    skills: resume.skills || '',
    selfPr: resume.self_pr || '',
    isActive: Boolean(resume.is_active),
    experiences: Array.isArray(resume.experiences)
      ? resume.experiences.map((exp, index) => experienceToDraft(exp, index))
      : [],
    preference: {
      desiredSalary: profile?.desired_salary,
      desiredIndustries: Array.isArray(resume.desired_industries) ? resume.desired_industries : [],
      desiredJobTypes: resume.desired_job ? resume.desired_job.split(',').map((s) => s.trim()).filter(Boolean) : [],
      desiredLocations: Array.isArray(resume.desired_locations) ? resume.desired_locations : [],
      workStyle: '',
      availableDate: '',
    },
  };
};

const toIsoDate = (value?: string): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`;
  if (/^\d{4}\/\d{2}$/.test(trimmed)) return `${trimmed.replace('/', '-')}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  try {
    const date = new Date(trimmed);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch {}
  return trimmed;
};

export const experienceDraftToPayload = (draft: ExperienceDraft, order: number) => ({
  company: draft.company.trim(),
  period_from: toIsoDate(draft.periodFrom),
  period_to: toIsoDate(draft.periodTo),
  employment_type: draft.employmentType || 'fulltime',
  business: (draft.business || '').trim(),
  capital: draft.capital || '',
  team_size: draft.teamSize || '',
  tasks: draft.tasks?.trim() || '仕事内容未記載',
  position: (draft.position || '').trim(),
  industry: (draft.industry || '').trim(),
  order,
});

export const cleanExperienceDraft = (draft: ExperienceDraft) => ({
  ...draft,
  company: draft.company.trim(),
  business: draft.business.trim(),
  tasks: draft.tasks.trim(),
  position: draft.position?.trim() || '',
  industry: draft.industry?.trim() || '',
  capital: draft.capital?.trim() || '',
  teamSize: draft.teamSize?.trim() || '',
});

export const isExperienceEmpty = (draft: ExperienceDraft): boolean => {
  return !draft.company && !draft.periodFrom && !draft.periodTo && !draft.tasks;
};
