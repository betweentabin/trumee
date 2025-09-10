interface TextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export default function Textarea({ value, onChange, placeholder, rows = 4, className }: TextareaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={className || "w-full px-3 py-2 border border-gray-300 rounded-md"}
    />
  );
}