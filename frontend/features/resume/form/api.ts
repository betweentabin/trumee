import apiV2Client from '@/lib/api-v2-client';
import { ExperienceDraft, PreferenceDraft, ResumeDraft } from './types';
import { experienceDraftToPayload, buildResumeDraft, isExperienceEmpty } from './utils';
import { DEFAULT_RESUME_TITLE } from './constants';
import { Resume } from '@/types/api-v2';

type EnsureResumeResult = {
  resume: Resume;
  created: boolean;
};

const ensureResume = async (): Promise<EnsureResumeResult> => {
  const resumes = await apiV2Client.getResumes();
  const existing = resumes.find((r) => r.is_active) || resumes[0] || null;
  if (existing) {
    return { resume: existing, created: false };
  }
  const created = await apiV2Client.createResume({
    title: DEFAULT_RESUME_TITLE,
    description: '',
    objective: '',
    skills: '',
    experiences: [],
    certifications: [],
  });
  return { resume: created, created: true };
};

export const loadResumeDraft = async (): Promise<ResumeDraft> => {
  const { resume } = await ensureResume();
  const seekerProfiles = await apiV2Client.getSeekerProfiles().catch(() => []);
  const profile = seekerProfiles?.[0] ?? null;
  return buildResumeDraft(resume, profile as any);
};

export const saveExperiences = async (experiences: ExperienceDraft[]) => {
  const filtered = experiences.filter((exp) => !isExperienceEmpty(exp));
  const { resume } = await ensureResume();
  await apiV2Client.updateResume(resume.id as unknown as string, {
    experiences: filtered.map((exp, idx) => experienceDraftToPayload(exp, idx)),
    is_active: true,
  });
};

export const savePreferences = async (preference: PreferenceDraft) => {
  const { resume } = await ensureResume();
  await apiV2Client.updateResume(resume.id as unknown as string, {
    desired_job: preference.desiredJobTypes?.join(', ') || undefined,
    desired_industries: preference.desiredIndustries,
    desired_locations: preference.desiredLocations,
  });

  if (preference.desiredSalary) {
    const profiles = await apiV2Client.getSeekerProfiles().catch(() => []);
    const profile = profiles?.[0];
    if (profile) {
      await apiV2Client.updateSeekerProfile(profile.id as unknown as string, {
        desired_salary: preference.desiredSalary,
      } as any).catch(async () => {
        await apiV2Client.createSeekerProfile({ desired_salary: preference.desiredSalary } as any);
      });
    } else {
      await apiV2Client.createSeekerProfile({ desired_salary: preference.desiredSalary } as any);
    }
  }
};

export const saveResumeDraft = async (draft: ResumeDraft) => {
  const { resume } = await ensureResume();
  const experiences = draft.experiences.filter((exp) => !isExperienceEmpty(exp));
  await apiV2Client.updateResume(resume.id as unknown as string, {
    title: draft.title || DEFAULT_RESUME_TITLE,
    description: draft.description,
    objective: draft.objective,
    skills: draft.skills,
    self_pr: draft.selfPr,
    desired_job: draft.preference.desiredJobTypes?.join(', ') || undefined,
    desired_industries: draft.preference.desiredIndustries,
    desired_locations: draft.preference.desiredLocations,
    experiences: experiences.map((exp, idx) => experienceDraftToPayload(exp, idx)),
    is_active: draft.isActive,
    educations: draft.educations?.map((edu, idx) => ({
      ...edu,
      order: idx,
    })),
    certifications: draft.certifications?.map((cert, idx) => ({
      ...cert,
      order: idx,
    })),
  });

  if (draft.preference.desiredSalary) {
    const profiles = await apiV2Client.getSeekerProfiles().catch(() => []);
    const profile = profiles?.[0];
    if (profile) {
      await apiV2Client.updateSeekerProfile(profile.id as unknown as string, {
        desired_salary: draft.preference.desiredSalary,
      } as any).catch(async () => {
        await apiV2Client.createSeekerProfile({ desired_salary: draft.preference.desiredSalary } as any);
      });
    } else {
      await apiV2Client.createSeekerProfile({ desired_salary: draft.preference.desiredSalary } as any);
    }
  }
};
