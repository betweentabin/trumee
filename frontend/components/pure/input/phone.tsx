interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function PhoneInput({ value, onChange, placeholder, className }: PhoneInputProps) {
  return (
    <input
      type="tel"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || "090-0000-0000"}
      className={className || "w-full px-3 py-2 border border-gray-300 rounded-md"}
    />
  );
}