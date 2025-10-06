'use client';

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { INDUSTRY_OPTIONS, JOB_TYPE_OPTIONS, PREFECTURE_OPTIONS, SALARY_RANGES, WORK_STYLE_OPTIONS } from './constants';
import { PreferenceDraft } from './types';

type Props = {
  value: PreferenceDraft;
  onChange: (value: PreferenceDraft) => void;
};

export type ResumePreferencesFormHandle = {
  validate: () => boolean;
};

const defaultPreference: PreferenceDraft = {
  desiredSalary: '',
  desiredIndustries: [],
  desiredJobTypes: [],
  desiredLocations: [],
  workStyle: '',
  availableDate: '',
};

const ResumePreferencesForm = forwardRef<ResumePreferencesFormHandle, Props>(({ value, onChange }, ref) => {
  const [form, setForm] = useState<PreferenceDraft>({ ...defaultPreference, ...value });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm({ ...defaultPreference, ...value });
  }, [value]);

  const toggleMulti = (field: keyof Pick<PreferenceDraft, 'desiredIndustries' | 'desiredJobTypes' | 'desiredLocations'>, option: string) => {
    setForm((prev) => {
      const current = new Set(prev[field]);
      if (current.has(option)) {
        current.delete(option);
      } else {
        current.add(option);
      }
      const next = {
        ...prev,
        [field]: Array.from(current),
      } as PreferenceDraft;
      onChange(next);
      if (errors[field]) {
        setErrors((prevErrors) => {
          const nextErrors = { ...prevErrors };
          delete nextErrors[field];
          return nextErrors;
        });
      }
      return next;
    });
  };

  const handleChange = (field: keyof PreferenceDraft, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      onChange(next);
      if (errors[field]) {
        setErrors((prevErrors) => {
          const nextErrors = { ...prevErrors };
          delete nextErrors[field];
          return nextErrors;
        });
      }
      return next;
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.desiredSalary) nextErrors.desiredSalary = '希望年収を選択してください';
    if (!form.desiredIndustries?.length) nextErrors.desiredIndustries = '希望業界を選択してください';
    if (!form.desiredJobTypes?.length) nextErrors.desiredJobTypes = '希望職種を選択してください';
    if (!form.desiredLocations?.length) nextErrors.desiredLocations = '希望勤務地を選択してください';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  useImperativeHandle(ref, () => ({ validate }));

  const isChecked = (field: keyof Pick<PreferenceDraft, 'desiredIndustries' | 'desiredJobTypes' | 'desiredLocations'>, option: string) => {
    return form[field]?.includes(option);
  };

  const multiSection = (
    title: string,
    field: keyof Pick<PreferenceDraft, 'desiredIndustries' | 'desiredJobTypes' | 'desiredLocations'>,
    options: string[]
  ) => (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-2">
        {title} <span className="text-red-500">*</span>
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {options.map((option) => (
          <label key={option} className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition ${
            isChecked(field, option) ? 'border-primary-default bg-primary-default/5 text-primary-default' : 'border-gray-300 hover:border-primary-default'
          }`}>
            <input
              type="checkbox"
              checked={isChecked(field, option)}
              onChange={() => toggleMulti(field, option)}
              className="accent-primary-default"
            />
            <span className="text-sm">{option}</span>
          </label>
        ))}
      </div>
      {errors[field] && <p className="mt-2 text-sm text-red-600">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          希望年収 <span className="text-red-500">*</span>
        </label>
        <select
          value={form.desiredSalary || ''}
          onChange={(e) => handleChange('desiredSalary', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-default focus:border-transparent ${
            errors.desiredSalary ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <option value="">選択してください</option>
          {SALARY_RANGES.map((range) => (
            <option key={range} value={range}>
              {range}
            </option>
          ))}
        </select>
        {errors.desiredSalary && <p className="mt-1 text-sm text-red-600">{errors.desiredSalary}</p>}
      </div>

      {multiSection('希望業界', 'desiredIndustries', INDUSTRY_OPTIONS)}
      {multiSection('希望職種', 'desiredJobTypes', JOB_TYPE_OPTIONS)}
      {multiSection('希望勤務地', 'desiredLocations', PREFECTURE_OPTIONS)}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">希望する働き方</label>
          <select
            value={form.workStyle || ''}
            onChange={(e) => handleChange('workStyle', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-default focus:border-transparent"
          >
            <option value="">選択してください</option>
            {WORK_STYLE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">入社可能時期</label>
          <input
            type="month"
            value={form.availableDate || ''}
            onChange={(e) => handleChange('availableDate', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-default focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
});

ResumePreferencesForm.displayName = 'ResumePreferencesForm';

export default ResumePreferencesForm;
