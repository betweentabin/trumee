export const sex_options = [
  { value: 0, label: "*-š" },
  { value: 1, label: "7'" },
  { value: 2, label: "s'" },
  { value: 3, label: "]nÖ" },
];

export const getSexLabel = (value: number): string => {
  const option = sex_options.find(opt => opt.value === value);
  return option ? option.label : "*-š";
};