// Utility to anonymize user-identifying info for company views

export const anonymizeUserLabel = (source?: { id?: any } | string | number | null) => {
  let raw = '';
  if (!source) {
    raw = '';
  } else if (typeof source === 'object' && 'id' in source) {
    raw = String((source as any).id ?? '');
  } else {
    raw = String(source);
  }
  const sanitized = raw.replace(/[^a-zA-Z0-9]/g, '');
  const code = (sanitized.slice(-4) || '0000').toUpperCase();
  return `匿名ユーザー #${code}`;
};

export const anonymizeInitial = () => '匿';

