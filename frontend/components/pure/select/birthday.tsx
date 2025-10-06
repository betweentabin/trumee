interface BirthdaySelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function BirthdaySelect({ value, onChange, className }: BirthdaySelectProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className || "w-full px-3 py-2 border border-gray-300 rounded-md"}
    />
  );
}
