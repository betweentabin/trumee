'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormPersist } from '@/hooks/useFormPersist';
import { useAuth } from '@/hooks/useAuth';
import StepNavigation from '../components/StepNavigation';
import StepLayout from '../components/StepLayout';
import toast from 'react-hot-toast';

interface Experience {
  id: number;
  company: string;
  periodFrom: string;
  periodTo: string;
  employmentType: string;
  business: string;
  capital?: string;
  teamSize?: string;
  tasks: string;
  position?: string;
  industry?: string;
}

const employmentTypes = [
  '正社員',
  '契約社員',
  '派遣社員',
  'パート・アルバイト',
  '業務委託',
  'インターン',
  'その他'
];

export default function Step3ExperiencePage() {
  const router = useRouter();
  // 🚨 認証チェックを無効化
  // const { requireAuth } = useAuth();
  const {
    formState,
    setExperiences,
    markStepCompleted,
    navigateToStep,
    saveToLocalStorage,
  } = useFormPersist();

  // 🚨 認証チェックを無効化
  // requireAuth();

  const [experiences, setLocalExperiences] = useState<Experience[]>([]);
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  // Load saved data on mount
  useEffect(() => {
    if (formState.stepData.experiences && formState.stepData.experiences.length > 0) {
      setLocalExperiences(formState.stepData.experiences);
    } else {
      // Initialize with one empty experience
      setLocalExperiences([createEmptyExperience()]);
    }
  }, [formState.stepData.experiences]);

  function createEmptyExperience(): Experience {
    return {
      id: Date.now(),
      company: '',
      periodFrom: '',
      periodTo: '',
      employmentType: '',
      business: '',
      capital: '',
      teamSize: '',
      tasks: '',
      position: '',
      industry: '',
    };
  }

  const validateExperience = (exp: Experience, index: number) => {
    const newErrors: Record<string, string> = {};

    if (!exp.company) newErrors.company = '会社名を入力してください';
    if (!exp.periodFrom) newErrors.periodFrom = '入社年月を選択してください';
    if (!exp.employmentType) newErrors.employmentType = '雇用形態を選択してください';
    if (!exp.business) newErrors.business = '事業内容を入力してください';
    if (!exp.tasks) newErrors.tasks = '職務内容を入力してください';

    // Validate period logic
    if (exp.periodFrom && exp.periodTo) {
      const from = new Date(exp.periodFrom);
      const to = new Date(exp.periodTo);
      if (from > to) {
        newErrors.periodTo = '退社年月は入社年月より後の日付を選択してください';
      }
    }

    setErrors(prev => ({ ...prev, [index]: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateAllExperiences = () => {
    let isValid = true;
    experiences.forEach((exp, index) => {
      if (!validateExperience(exp, index)) {
        isValid = false;
      }
    });
    return isValid;
  };

  const handleExperienceChange = (index: number, field: keyof Experience, value: string) => {
    setLocalExperiences(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    // Clear error for this field
    if (errors[index]?.[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors[index]) {
          delete newErrors[index][field];
          if (Object.keys(newErrors[index]).length === 0) {
            delete newErrors[index];
          }
        }
        return newErrors;
      });
    }
  };

  const addExperience = () => {
    setLocalExperiences(prev => [...prev, createEmptyExperience()]);
    setExpandedIndex(experiences.length);
  };

  const removeExperience = (index: number) => {
    if (experiences.length > 1) {
      setLocalExperiences(prev => prev.filter((_, i) => i !== index));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    }
  };

  const handleNext = () => {
    if (validateAllExperiences()) {
      setExperiences(experiences);
      markStepCompleted(3);
      saveToLocalStorage();
      toast.success('職歴情報を保存しました');
      navigateToStep(4);
    }
  };

  const handleBack = () => {
    setExperiences(experiences);
    saveToLocalStorage();
    navigateToStep(2);
  };

  const handleSave = () => {
    if (validateAllExperiences()) {
      setExperiences(experiences);
      saveToLocalStorage();
      toast.success('職歴情報を保存しました');
    }
  };

  return (
    <StepLayout currentStep={3} title="職歴">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            職歴を入力してください
          </h2>

          <div className="space-y-4">
            {experiences.map((exp, index) => (
              <div key={exp.id} className="border border-gray-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">
                    職歴 {index + 1}: {exp.company || '未入力'}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      expandedIndex === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedIndex === index && (
                  <div className="px-4 py-4 border-t border-gray-200 space-y-4">
                    {/* Company Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        会社名 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors[index]?.company ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="例: 株式会社サンプル"
                      />
                      {errors[index]?.company && (
                        <p className="mt-1 text-sm text-red-600">{errors[index].company}</p>
                      )}
                    </div>

                    {/* Period */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          入社年月 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="month"
                          value={exp.periodFrom}
                          onChange={(e) => handleExperienceChange(index, 'periodFrom', e.target.value)}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors[index]?.periodFrom ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors[index]?.periodFrom && (
                          <p className="mt-1 text-sm text-red-600">{errors[index].periodFrom}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          退社年月
                        </label>
                        <input
                          type="month"
                          value={exp.periodTo}
                          onChange={(e) => handleExperienceChange(index, 'periodTo', e.target.value)}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors[index]?.periodTo ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors[index]?.periodTo && (
                          <p className="mt-1 text-sm text-red-600">{errors[index].periodTo}</p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                          現在在職中の場合は空欄のままにしてください
                        </p>
                      </div>
                    </div>

                    {/* Employment Type and Position */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          雇用形態 <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={exp.employmentType}
                          onChange={(e) => handleExperienceChange(index, 'employmentType', e.target.value)}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors[index]?.employmentType ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          <option value="">選択してください</option>
                          {employmentTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        {errors[index]?.employmentType && (
                          <p className="mt-1 text-sm text-red-600">{errors[index].employmentType}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          役職
                        </label>
                        <input
                          type="text"
                          value={exp.position || ''}
                          onChange={(e) => handleExperienceChange(index, 'position', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="例: エンジニア、マネージャー"
                        />
                      </div>
                    </div>

                    {/* Business Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        事業内容 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={exp.business}
                        onChange={(e) => handleExperienceChange(index, 'business', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors[index]?.business ? 'border-red-300' : 'border-gray-300'
                        }`}
                        rows={2}
                        placeholder="例: Webサービスの開発・運営"
                      />
                      {errors[index]?.business && (
                        <p className="mt-1 text-sm text-red-600">{errors[index].business}</p>
                      )}
                    </div>

                    {/* Tasks */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        職務内容 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={exp.tasks}
                        onChange={(e) => handleExperienceChange(index, 'tasks', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors[index]?.tasks ? 'border-red-300' : 'border-gray-300'
                        }`}
                        rows={4}
                        placeholder="具体的な業務内容を記載してください"
                      />
                      {errors[index]?.tasks && (
                        <p className="mt-1 text-sm text-red-600">{errors[index].tasks}</p>
                      )}
                    </div>

                    {/* Remove Button */}
                    {experiences.length > 1 && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeExperience(index)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          この職歴を削除
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Experience Button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={addExperience}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              職歴を追加
            </button>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-between">
            <button
              onClick={handleBack}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              戻る
            </button>
            <div className="space-x-3">
              <button
                onClick={handleSave}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                保存
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                次へ進む
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <StepNavigation currentStep={3} />
    </StepLayout>
  );
}