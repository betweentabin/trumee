export interface NormalizedExperience {
  id: string;
  company: string;
  period_from: string;
  period_to: string;
  position?: string;
  tasks?: string;
}

const toYearMonth = (value?: string | null): string => {
  if (!value) return '';
  const raw = String(value).trim();
  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${date.getFullYear()}/${month}`;
  }
  // 既に YYYY/MM・YYYY-MM 等の形式であればそのまま返す
  const normalized = raw.replace(/-/g, '/');
  return normalized.length >= 7 ? normalized.slice(0, 7) : normalized;
};

const pick = <T, K extends keyof T>(source: T | undefined, keys: K[], fallback = ''): string => {
  if (!source) return fallback;
  for (const key of keys) {
    const value = source[key];
    if (value) return String(value);
  }
  return fallback;
};

export const normalizeResumeExperiences = (resume: any): NormalizedExperience[] => {
  if (!resume) return [];

  const normalized: NormalizedExperience[] = [];
  const seen = new Set<string>();

  const push = (item: NormalizedExperience) => {
    if (!item.company && !item.tasks) return;
    if (seen.has(item.id)) return;
    seen.add(item.id);
    normalized.push(item);
  };

  const baseList = Array.isArray(resume?.experiences) ? resume.experiences : [];
  baseList.forEach((exp: any, index: number) => {
    const id = exp?.id ? String(exp.id) : `base-${index}`;
    const company = pick(exp, ['company', 'company_name', 'companyName'], '');
    const position = pick(exp, ['position', 'title', 'role']);
    const tasks = pick(exp, ['tasks', 'description', 'detail']);
    const periodFrom = toYearMonth(pick(exp, ['period_from', 'periodFrom', 'start_date', 'startDate']));
    const periodToRaw = pick(exp, ['period_to', 'periodTo', 'end_date', 'endDate']);
    const periodTo = periodToRaw ? toYearMonth(periodToRaw) : '現在';

    push({
      id,
      company,
      position,
      tasks,
      period_from: periodFrom,
      period_to: periodTo,
    });
  });

  const extraList = Array.isArray(resume?.extra_data?.workExperiences) ? resume.extra_data.workExperiences : [];
  extraList.forEach((exp: any, index: number) => {
    const id = exp?.id ? String(exp.id) : `extra-${index}`;
    if (seen.has(id)) {
      return;
    }
    const company = pick(exp, ['company', 'companyName'], '');
    const position = pick(exp, ['position', 'title']);
    const tasks = pick(exp, ['description', 'detail', 'tasks']);
    const periodFrom = toYearMonth(pick(exp, ['startDate', 'period_from', 'since']));
    const periodToRaw = pick(exp, ['endDate', 'period_to', 'to']);
    const periodTo = periodToRaw ? toYearMonth(periodToRaw) : '現在';

    push({
      id,
      company,
      position,
      tasks,
      period_from: periodFrom,
      period_to: periodTo,
    });
  });

  return normalized;
};

