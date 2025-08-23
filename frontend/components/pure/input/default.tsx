import React from 'react';

interface DefaultInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  name?: string;
  id?: string;
}

const DefaultInput: React.FC<DefaultInputProps> = ({
  value = '',
  onChange,
  placeholder = '',
  type = 'text',
  disabled = false,
  required = false,
  className = '',
  name,
  id,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <input
      type={type}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      name={name}
      id={id}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${className}`}
    />
  );
};

export default DefaultInput;