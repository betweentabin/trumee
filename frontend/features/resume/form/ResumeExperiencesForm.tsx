'use client';

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { EMPLOYMENT_TYPE_OPTIONS } from './constants';
import { ExperienceDraft, ExperienceValidationResult } from './types';
import { cleanExperienceDraft } from './utils';

type Props = {
  value: ExperienceDraft[];
  onChange: (value: ExperienceDraft[]) => void;
  minItems?: number;
};

export type ResumeExperiencesFormHandle = {
  validate: () => boolean;
};

const emptyExperience = (nextId: number): ExperienceDraft => ({
  id: nextId,
  company: '',
  periodFrom: '',
  periodTo: '',
  employmentType: 'fulltime',
  business: '',
  capital: '',
  teamSize: '',
  tasks: '',
  position: '',
  industry: '',
});

const ResumeExperiencesForm = forwardRef<ResumeExperiencesFormHandle, Props>(({ value, onChange, minItems = 1 }, ref) => {
  const [experiences, setExperiences] = useState<ExperienceDraft[]>(() => {
    if (value?.length) return value.map((exp) => ({ ...emptyExperience(exp.id), ...exp }));
    return [emptyExperience(1)];
  });
  const [errors, setErrors] = useState<Record<number, ExperienceValidationResult>>({});

  useEffect(() => {
    if (!value) return;
    setExperiences((prev) => {
      const map = new Map<number, ExperienceDraft>();
      value.forEach((exp) => map.set(exp.id, { ...emptyExperience(exp.id), ...exp }));
      return Array.from(map.values()).sort((a, b) => a.id - b.id);
    });
  }, [value]);

  const nextId = useMemo(() => {
    return experiences.reduce((max, exp) => Math.max(max, exp.id), 0) + 1;
  }, [experiences]);

  const sync = (next: ExperienceDraft[]) => {
    setExperiences(next);
    onChange(next.map((exp) => cleanExperienceDraft(exp)));
  };

  const handleChange = (index: number, field: keyof ExperienceDraft, newValue: string) => {
    sync(
      experiences.map((exp, idx) =>
        idx === index
          ? {
              ...exp,
              [field]: newValue,
            }
          : exp
      )
    );
    if (errors[index]?.[field as keyof ExperienceValidationResult]) {
      setErrors((prev) => {
        const updated = { ...prev };
        const copy = { ...updated[index] };
        delete copy[field as keyof ExperienceValidationResult];
        if (Object.keys(copy).length === 0) {
          delete updated[index];
        } else {
          updated[index] = copy;
        }
        return updated;
      });
    }
  };

  const handleAdd = () => {
    sync([...experiences, emptyExperience(nextId)]);
  };

  const handleRemove = (index: number) => {
    if (experiences.length <= minItems) return;
    sync(experiences.filter((_, idx) => idx !== index));
    setErrors((prev) => {
      if (!(index in prev)) return prev;
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  const validate = (): boolean => {
    const nextErrors: Record<number, ExperienceValidationResult> = {};
    experiences.forEach((exp, index) => {
      const currentErrors: ExperienceValidationResult = {};
      if (!exp.company?.trim()) {
        currentErrors.company = '会社名を入力してください';
      }
      if (!exp.periodFrom?.trim()) {
        currentErrors.periodFrom = '入社年月を入力してください';
      }
      if (exp.periodTo && exp.periodFrom && exp.periodTo < exp.periodFrom) {
        currentErrors.periodTo = '退社年月は入社年月以降にしてください';
      }
      if (!exp.tasks?.trim()) {
        currentErrors.tasks = '職務内容を入力してください';
      }
      if (!exp.employmentType) {
        currentErrors.employmentType = '雇用形態を選択してください';
      }
      if (Object.keys(currentErrors).length > 0) {
        nextErrors[index] = currentErrors;
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  useImperativeHandle(ref, () => ({ validate }));

  return (
    <div className="space-y-6">
      {experiences.map((exp, index) => (
        <div key={exp.id} className="border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">職歴 {index + 1}</h3>
            {experiences.length > minItems && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-sm text-red-500 hover:text-red-600"
              >
                削除
              </button>
            )}
          </div>
          <div className="px-4 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                会社名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={exp.company}
                onChange={(e) => handleChange(index, 'company', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-default focus:border-transparent ${
                  errors[index]?.company ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="例: 株式会社サンプル"
              />
              {errors[index]?.company && <p className="mt-1 text-sm text-red-600">{errors[index]?.company}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  入社年月 <span className="text-red-500">*</span>
                </label>
                <input
                  type="month"
                  value={exp.periodFrom}
                  onChange={(e) => handleChange(index, 'periodFrom', e.target.value)}
                  className={`w-full h-11 px-4 pr-10 rounded-xl border shadow-sm bg-white text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-default focus:border-transparent ${
                    errors[index]?.periodFrom ? 'border-red-300' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                />
                {errors[index]?.periodFrom && <p className="mt-1 text-sm text-red-600">{errors[index]?.periodFrom}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">退社年月</label>
                <input
                  type="month"
                  value={exp.periodTo}
                  onChange={(e) => handleChange(index, 'periodTo', e.target.value)}
                  className={`w-full h-11 px-4 pr-10 rounded-xl border shadow-sm bg-white text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-default focus:border-transparent ${
                    errors[index]?.periodTo ? 'border-red-300' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                />
                {errors[index]?.periodTo && <p className="mt-1 text-sm text-red-600">{errors[index]?.periodTo}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  雇用形態 <span className="text-red-500">*</span>
                </label>
                <select
                  value={exp.employmentType || ''}
                  onChange={(e) => handleChange(index, 'employmentType', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-default focus:border-transparent ${
                    errors[index]?.employmentType ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">選択してください</option>
                  {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors[index]?.employmentType && <p className="mt-1 text-sm text-red-600">{errors[index]?.employmentType}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">役職</label>
                <input
                  type="text"
                  value={exp.position}
                  onChange={(e) => handleChange(index, 'position', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-default focus:border-transparent"
                  placeholder="例: チームリーダー"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">事業内容 / 部署</label>
                <input
                  type="text"
                  value={exp.business}
                  onChange={(e) => handleChange(index, 'business', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-default focus:border-transparent"
                  placeholder="例: SaaSプロダクト開発部"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">部署規模</label>
                  <input
                    type="text"
                    value={exp.teamSize}
                    onChange={(e) => handleChange(index, 'teamSize', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-default focus:border-transparent"
                    placeholder="例: 10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">資本金</label>
                  <input
                    type="text"
                    value={exp.capital}
                    onChange={(e) => handleChange(index, 'capital', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-default focus:border-transparent"
                    placeholder="例: 1,000"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                職務内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={exp.tasks}
                onChange={(e) => handleChange(index, 'tasks', e.target.value)}
                className={`w-full min-h-[120px] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-default focus:border-transparent ${
                  errors[index]?.tasks ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="担当した仕事内容を具体的に記載してください"
              />
              {errors[index]?.tasks && <p className="mt-1 text-sm text-red-600">{errors[index]?.tasks}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">業種</label>
              <input
                type="text"
                value={exp.industry}
                onChange={(e) => handleChange(index, 'industry', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-default focus:border-transparent"
                placeholder="例: IT・通信"
              />
            </div>
          </div>
        </div>
      ))}

      <div className="pt-2">
        <button
          type="button"
          onClick={handleAdd}
          className="w-full md:w-auto px-4 py-2 rounded-lg border border-dashed border-gray-400 text-gray-700 hover:bg-gray-50"
        >
          + 職歴を追加する
        </button>
      </div>
    </div>
  );
});

ResumeExperiencesForm.displayName = 'ResumeExperiencesForm';

export default ResumeExperiencesForm;
