'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormPersist } from '@/hooks/useFormPersist';
import { useAuth } from '@/hooks/useAuth';
import StepNavigation from '../components/StepNavigation';
import StepLayout from '../components/StepLayout';
import toast from 'react-hot-toast';

const educationTypes = [
  '大学院（博士）',
  '大学院（修士）',
  '大学',
  '短期大学',
  '専門学校',
  '高等専門学校',
  '高等学校',
  'その他'
];

export default function Step2EducationPage() {
  const router = useRouter();
  const { requireAuth } = useAuth();
  const {
    formState,
    updateEducation,
    markStepCompleted,
    navigateToStep,
    saveToLocalStorage,
  } = useFormPersist();

  // Redirect if not authenticated
  requireAuth();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    school: '',
    faculty: '',
    graduationYear: '',
    educationType: '',
  });

  // Load saved data on mount
  useEffect(() => {
    if (formState.stepData.education) {
      setFormData({
        ...formData,
        ...formState.stepData.education,
      });
    }
  }, [formState.stepData.education]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.school) newErrors.school = '学校名を入力してください';
    if (!formData.educationType) newErrors.educationType = '学歴区分を選択してください';
    if (!formData.graduationYear) newErrors.graduationYear = '卒業年を入力してください';

    // Validate graduation year
    if (formData.graduationYear) {
      const year = parseInt(formData.graduationYear);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1950 || year > currentYear + 10) {
        newErrors.graduationYear = '有効な卒業年を入力してください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleNext = () => {
    if (validateForm()) {
      updateEducation(formData);
      markStepCompleted(2);
      saveToLocalStorage();
      toast.success('学歴情報を保存しました');
      navigateToStep(3);
    }
  };

  const handleBack = () => {
    updateEducation(formData);
    saveToLocalStorage();
    navigateToStep(1);
  };

  const handleSave = () => {
    if (validateForm()) {
      updateEducation(formData);
      saveToLocalStorage();
      toast.success('学歴情報を保存しました');
    }
  };

  return (
    <StepLayout currentStep={2} title="学歴">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            学歴を入力してください
          </h2>

          <div className="space-y-6">
            {/* Education Type */}
            <div>
              <label htmlFor="educationType" className="block text-sm font-medium text-gray-700 mb-2">
                学歴区分 <span className="text-red-500">*</span>
              </label>
              <select
                id="educationType"
                name="educationType"
                value={formData.educationType}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.educationType ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">選択してください</option>
                {educationTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.educationType && (
                <p className="mt-1 text-sm text-red-600">{errors.educationType}</p>
              )}
            </div>

            {/* School Name */}
            <div>
              <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-2">
                学校名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="school"
                name="school"
                value={formData.school}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.school ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="例: 東京大学"
              />
              {errors.school && (
                <p className="mt-1 text-sm text-red-600">{errors.school}</p>
              )}
            </div>

            {/* Faculty/Department */}
            <div>
              <label htmlFor="faculty" className="block text-sm font-medium text-gray-700 mb-2">
                学部・学科
              </label>
              <input
                type="text"
                id="faculty"
                name="faculty"
                value={formData.faculty}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例: 工学部情報工学科"
              />
            </div>

            {/* Graduation Year */}
            <div>
              <label htmlFor="graduationYear" className="block text-sm font-medium text-gray-700 mb-2">
                卒業年 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="graduationYear"
                name="graduationYear"
                value={formData.graduationYear}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.graduationYear ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="例: 2020"
                maxLength={4}
              />
              {errors.graduationYear && (
                <p className="mt-1 text-sm text-red-600">{errors.graduationYear}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                西暦4桁で入力してください
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  最終学歴を入力してください。複数の学歴がある場合は、最も高い学歴を入力してください。
                </p>
              </div>
            </div>
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
      <StepNavigation currentStep={2} />
    </StepLayout>
  );
}