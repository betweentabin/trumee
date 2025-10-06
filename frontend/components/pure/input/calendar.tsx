interface CalendarInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  type?: 'date' | 'month';
}

export default function CalendarInput({ value, onChange, className, type = 'date' }: CalendarInputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className || "input-date"}
    />
  );
}
