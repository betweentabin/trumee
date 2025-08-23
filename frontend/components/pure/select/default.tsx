import React from 'react';
import Select, { SingleValue } from 'react-select';

interface Option {
  value: string;
  label: string;
}

interface DefaultSelectProps {
  instanceId?: string;
  options: Option[];
  value?: Option | null;
  onChange?: (value: Option | null) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isSearchable?: boolean;
  isClearable?: boolean;
  className?: string;
  name?: string;
}

const DefaultSelect: React.FC<DefaultSelectProps> = ({
  instanceId,
  options = [],
  value,
  onChange,
  placeholder = '選択してください',
  isDisabled = false,
  isSearchable = true,
  isClearable = true,
  className = '',
  name,
}) => {
  const handleChange = (newValue: SingleValue<Option>) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderColor: state.isFocused ? '#FF733E' : '#D1D5DB',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(255, 115, 62, 0.2)' : 'none',
      '&:hover': {
        borderColor: '#FF733E',
      },
      minHeight: '38px',
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#FF733E'
        : state.isFocused
        ? 'rgba(255, 115, 62, 0.1)'
        : 'white',
      color: state.isSelected ? 'white' : '#374151',
      '&:active': {
        backgroundColor: '#FF733E',
      },
    }),
  };

  return (
    <Select
      instanceId={instanceId}
      name={name}
      options={options}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isSearchable={isSearchable}
      isClearable={isClearable}
      className={className}
      styles={customStyles}
      noOptionsMessage={() => 'オプションが見つかりません'}
    />
  );
};

export default DefaultSelect;