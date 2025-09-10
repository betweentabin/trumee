interface JobTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const JOB_TYPES = [
  { value: 'full-time', label: '正社員' },
  { value: 'contract', label: '契約社員' },
  { value: 'part-time', label: 'パート・アルバイト' },
  { value: 'intern', label: 'インターン' },
  { value: 'freelance', label: 'フリーランス' },
];

export default function JobTypeSelect({ value, onChange, className }: JobTypeSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className || "w-full px-3 py-2 border border-gray-300 rounded-md"}
    >
      <option value="">選択してください</option>
      {JOB_TYPES.map((type) => (
        <option key={type.value} value={type.value}>
          {type.label}
        </option>
      ))}
    </select>
  );
}