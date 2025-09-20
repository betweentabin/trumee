import { buildApiUrl, getApiHeaders } from '@/config/api';

export type ResumePreviewData = {
  userName?: string;
  jobhistoryList: string[];
  formValues: Record<string, any>;
  resumeId?: string;
};

export const emptyResumePreview: ResumePreviewData = {
  userName: undefined,
  jobhistoryList: [],
  formValues: {},
  resumeId: undefined,
};

type FetchResumePreviewParams = {
  userId: string;
  token?: string;
};

const toStringSafe = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return String(value ?? '');
};

const pickField = (source: any, keys: string[]): unknown => {
  if (!source || typeof source !== 'object') return undefined;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const value = (source as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
  }
  return undefined;
};

const normalizeDate = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/現在|present/i.test(trimmed)) {
      return '現在';
    }

    // Try to parse ISO-like strings first
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}/${String(parsed.getMonth() + 1).padStart(2, '0')}`;
    }

    // Handle "YYYY-MM" or "YYYY/MM" formats
    const ymMatch = trimmed.match(/^(\d{4})[-/年\.](\d{1,2})/);
    if (ymMatch) {
      const [, year, month] = ymMatch;
      return `${year}/${String(Number(month)).padStart(2, '0')}`;
    }

    return trimmed;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}/${String(value.getMonth() + 1).padStart(2, '0')}`;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return '';
};

const parseTimestamp = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 0;

    // Handle Unix timestamp strings
    if (/^\d+$/.test(trimmed)) {
      const numeric = Number(trimmed);
      if (Number.isFinite(numeric)) {
        return numeric > 10_000_000_000 ? numeric : numeric * 1000;
      }
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getTime();
    }
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.getTime();
  }
  return 0;
};

const resolveResumeTimestamp = (resume: any): number => {
  if (!resume) return 0;
  const candidates: unknown[] = [
    pickField(resume, ['updated_at', 'updatedAt']),
    pickField(resume, ['created_at', 'createdAt']),
    pickField(resume, ['submitted_at', 'submittedAt']),
    pickField(resume?.extra_data, ['updated_at', 'updatedAt', 'lastEditedAt']),
    pickField(resume?.extra_data, ['created_at', 'createdAt', 'generatedAt']),
  ];

  return candidates.reduce((max, current) => {
    const ts = parseTimestamp(current);
    return ts > max ? ts : max;
  }, 0);
};

const buildPreviewFromExperiences = (experiences: any[]) => {
  const jobhistoryList = experiences.map((_, idx) => `exp_${idx}`);
  const formValues: Record<string, any> = {};

  experiences.forEach((exp, idx) => {
    const key = jobhistoryList[idx];
    const sinceRaw = pickField(exp, ['period_from', 'periodFrom', 'start_date', 'startDate', 'since']);
    const toRaw = pickField(exp, ['period_to', 'periodTo', 'end_date', 'endDate', 'to']);
    const isCurrentFlag = pickField(exp, ['is_current', 'isCurrent', 'current']);

    let toValue = normalizeDate(toRaw);
    if (!toValue && typeof isCurrentFlag === 'boolean' && isCurrentFlag) {
      toValue = '現在';
    }
    if (!toValue && typeof toRaw === 'string' && /present/i.test(toRaw)) {
      toValue = '現在';
    }

    formValues[key] = {
      since: normalizeDate(sinceRaw),
      to: toValue,
      company: toStringSafe(pickField(exp, ['company', 'company_name', 'companyName', 'organization'])),
      business: toStringSafe(pickField(exp, ['business', 'business_content', 'businessContent', 'industry'])),
      capital: toStringSafe(pickField(exp, ['capital', 'capital_amount', 'capitalAmount'])),
      people: toStringSafe(pickField(exp, ['team_size', 'teamSize', 'member_count', 'memberCount', 'people'])),
      duty: toStringSafe(pickField(exp, ['position', 'role', 'jobTitle', 'duty'])),
      work_content: toStringSafe(
        pickField(exp, ['tasks', 'work_content', 'workContent', 'description', 'workActivity', 'responsibilities', 'achievements'])
      ),
    };
  });

  return { jobhistoryList, formValues };
};

export const fetchResumePreview = async ({ userId, token }: FetchResumePreviewParams): Promise<ResumePreviewData> => {
  if (!userId) return { ...emptyResumePreview };

  const headers = getApiHeaders(token);
  let userName: string | undefined;

  try {
    const resUser = await fetch(buildApiUrl(`/users/${encodeURIComponent(userId)}/`), { headers });
    if (resUser.ok) {
      const payload = await resUser.json();
      userName = toStringSafe(payload?.full_name || payload?.fullName || payload?.name || '').trim() || undefined;
    }
  } catch (err) {
    console.warn('Failed to load user profile for resume preview', err);
  }

  try {
    const res = await fetch(buildApiUrl(`/users/${encodeURIComponent(userId)}/resumes/`), { headers });
    if (!res.ok) {
      return {
        ...emptyResumePreview,
        userName,
      };
    }

    const payload = await res.json();
    const list = Array.isArray(payload) ? payload : payload?.results || [];
    if (!Array.isArray(list) || list.length === 0) {
      return {
        ...emptyResumePreview,
        userName,
      };
    }

    const sortedByRecency = [...list].sort((a, b) => {
      const diff = resolveResumeTimestamp(b) - resolveResumeTimestamp(a);
      if (diff !== 0) return diff;
      // fall back to keeping active resumes ahead if timestamps match
      if (a?.is_active && !b?.is_active) return -1;
      if (!a?.is_active && b?.is_active) return 1;
      return 0;
    });

    const resume = sortedByRecency[0];
    const experiencesFromSerializer = Array.isArray(resume?.experiences) ? resume.experiences : [];
    const extraExperiences = Array.isArray(resume?.extra_data?.workExperiences)
      ? resume.extra_data.workExperiences
      : [];

    const experiences = experiencesFromSerializer.length > 0 ? experiencesFromSerializer : extraExperiences;
    const { jobhistoryList, formValues } = buildPreviewFromExperiences(experiences);

    const resolvedUserName = userName
      || toStringSafe(resume?.extra_data?.fullName)
      || toStringSafe(resume?.user_full_name)
      || undefined;

    return {
      userName: resolvedUserName || undefined,
      jobhistoryList,
      formValues,
      resumeId: resume?.id ? String(resume.id) : undefined,
    };
  } catch (err) {
    console.warn('Failed to load resume preview data', err);
    return {
      ...emptyResumePreview,
      userName,
    };
  }
};
