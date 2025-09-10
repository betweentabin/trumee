interface RadioProps {
  name: string;
  value: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
}

export default function Radio({ name, value, checked, onChange, label }: RadioProps) {
  return (
    <label className="flex items-center">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mr-2"
      />
      {label && <span>{label}</span>}
    </label>
  );
}