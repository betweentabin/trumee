interface IndustrySelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const INDUSTRIES = [
  { value: 'it', label: 'IT・通信' },
  { value: 'finance', label: '金融' },
  { value: 'manufacturing', label: '製造業' },
  { value: 'retail', label: '小売・流通' },
  { value: 'service', label: 'サービス業' },
  { value: 'other', label: 'その他' },
];

export default function IndustrySelect({ value, onChange, className }: IndustrySelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className || "w-full px-3 py-2 border border-gray-300 rounded-md"}
    >
      <option value="">選択してください</option>
      {INDUSTRIES.map((industry) => (
        <option key={industry.value} value={industry.value}>
          {industry.label}
        </option>
      ))}
    </select>
  );
}