import React from 'react';

interface CheckInputConditionsProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  onClick?: () => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
  id?: string;
}

const CheckInputConditions: React.FC<CheckInputConditionsProps> = ({
  checked = false,
  onChange,
  onClick,
  label = '',
  disabled = false,
  className = '',
  name,
  id,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.checked);
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <label 
      className={`flex items-center space-x-2 cursor-pointer ${disabled ? 'opacity-50' : ''} ${className}`}
      onClick={handleClick}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        name={name}
        id={id}
        className="w-4 h-4 text-orange-600 bg-white border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
      />
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
};

export default CheckInputConditions;