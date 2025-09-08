'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormPersist } from '@/hooks/useFormPersist';
import { useAuth } from '@/hooks/useAuth';
import StepNavigation from '../components/StepNavigation';
import StepLayout from '../components/StepLayout';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api-v2-client';

const salaryRanges = [
  '300万円未満',
  '300万円～400万円',
  '400万円～500万円',
  '500万円～600万円',
  '600万円～700万円',
  '700万円～800万円',
  '800万円～900万円',
  '900万円～1000万円',
  '1000万円以上'
];

const industries = [
  'IT・通信',
  '金融',
  '製造業',
  '小売・流通',
  '不動産・建設',
  '医療・福祉',
  '教育',
  'サービス業',
  'メディア・広告',
  'その他'
];

const jobTypes = [
  'エンジニア',
  '営業',
  'マーケティング',
  '事務・管理',
  '企画',
  'デザイナー',
  'コンサルタント',
  '研究開発',
  'その他'
];

const workStyles = [
  'フルリモート',
  'ハイブリッド（週2-3日出社）',
  'ハイブリッド（週1日出社）',
  '出社メイン',
  'フレックスタイム制',
  '固定時間制'
];

const prefectures = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

export default function Step4PreferencePage() {
  const router = useRouter();
  // 🚨 認証チェックを無効化
  // const { requireAuth } = useAuth();
  const {
    formState,
    updatePreference,
    markStepCompleted,
    goToStep,
    saveToLocalStorage,
  } = useFormPersist();

  // 🚨 認証チェックを無効化
  // useEffect(() => {
  //   requireAuth();
  // }, []);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    desiredSalary: '',
    desiredIndustries: [] as string[],
    desiredJobTypes: [] as string[],
    desiredLocations: [] as string[],
    workStyle: '',
    availableDate: '',
  });

  // Load saved data on mount
  useEffect(() => {
    if (formState.stepData.preference) {
      setFormData({
        desiredSalary: formState.stepData.preference.desiredSalary || '',
        desiredIndustries: formState.stepData.preference.desiredIndustries || [],
        desiredJobTypes: formState.stepData.preference.desiredJobTypes || [],
        desiredLocations: formState.stepData.preference.desiredLocations || [],
        workStyle: formState.stepData.preference.workStyle || '',
        availableDate: formState.stepData.preference.availableDate || '',
      });
    }
  }, [formState.stepData.preference]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.desiredSalary) newErrors.desiredSalary = '希望年収を選択してください';
    if (formData.desiredIndustries.length === 0) newErrors.desiredIndustries = '希望業界を少なくとも1つ選択してください';
    if (formData.desiredJobTypes.length === 0) newErrors.desiredJobTypes = '希望職種を少なくとも1つ選択してください';
    if (formData.desiredLocations.length === 0) newErrors.desiredLocations = '希望勤務地を少なくとも1つ選択してください';

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

  const handleCheckboxChange = (field: 'desiredIndustries' | 'desiredJobTypes' | 'desiredLocations', value: string) => {
    setFormData(prev => {
      const currentValues = prev[field];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return { ...prev, [field]: newValues };
    });

    // Clear error when user selects
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNext = async () => {
    if (!validateForm()) return;
    updatePreference(formData);
    saveToLocalStorage();
    const ok = await savePreferenceToBackend();
    if (ok) {
      markStepCompleted(4);
      toast.success('希望条件を保存しました');
      router.push('/auth/step/step5-confirm');
    }
  };

  const handleBack = async () => {
    updatePreference(formData);
    saveToLocalStorage();
    await savePreferenceToBackend();
    router.push('/auth/step/step3-experience');
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    updatePreference(formData);
    saveToLocalStorage();
    const ok = await savePreferenceToBackend();
    if (ok) toast.success('希望条件を保存しました');
  };

  const savePreferenceToBackend = async (): Promise<boolean> => {
    try {
      // SeekerProfileの希望年収
      await apiClient.createSeekerProfile({ desired_salary: formData.desiredSalary } as any);

      // 履歴書（アクティブがあればそれ、なければ先頭/新規）
      const resumes = await apiClient.getResumes().catch(() => []);
      let resume = resumes.find((r: any) => r.is_active) || resumes[0] || null;
      if (!resume) {
        resume = await apiClient.createResume({
          title: '職務経歴書',
          description: '',
          objective: '',
          skills: '',
          experiences: [],
          certifications: [],
        } as any);
      }

      await apiClient.updateResume(resume.id, {
        desired_job: (formData.desiredJobTypes || [])[0] || '',
        desired_industries: formData.desiredIndustries || [],
        desired_locations: formData.desiredLocations || [],
      } as any);

      return true;
    } catch (error) {
      console.error('Failed to save preference:', error);
      toast.error('希望条件の保存に失敗しました');
      return false;
    }
  };

  return (
    <StepLayout currentStep={4} title="希望条件">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            希望条件を入力してください
          </h2>

          <div className="space-y-6">
            {/* Desired Salary */}
            <div>
              <label htmlFor="desiredSalary" className="block text-sm font-medium text-gray-700 mb-2">
                希望年収 <span className="text-red-500">*</span>
              </label>
              <select
                id="desiredSalary"
                name="desiredSalary"
                value={formData.desiredSalary}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF733E] focus:border-transparent ${
                  errors.desiredSalary ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">選択してください</option>
                {salaryRanges.map(range => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
              {errors.desiredSalary && (
                <p className="mt-1 text-sm text-red-600">{errors.desiredSalary}</p>
              )}
            </div>

            {/* Desired Industries */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                希望業界（複数選択可） <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {industries.map(industry => (
                  <label key={industry} className="flex items-center">
                    <input
                      type="checkbox"
                      value={industry}
                      checked={formData.desiredIndustries.includes(industry)}
                      onChange={() => handleCheckboxChange('desiredIndustries', industry)}
                      className="mr-2 rounded border-gray-300 text-[#FF733E] focus:ring-[#FF733E]"
                    />
                    <span className="text-sm text-gray-700">{industry}</span>
                  </label>
                ))}
              </div>
              {errors.desiredIndustries && (
                <p className="mt-1 text-sm text-red-600">{errors.desiredIndustries}</p>
              )}
            </div>

            {/* Desired Job Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                希望職種（複数選択可） <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {jobTypes.map(jobType => (
                  <label key={jobType} className="flex items-center">
                    <input
                      type="checkbox"
                      value={jobType}
                      checked={formData.desiredJobTypes.includes(jobType)}
                      onChange={() => handleCheckboxChange('desiredJobTypes', jobType)}
                      className="mr-2 rounded border-gray-300 text-[#FF733E] focus:ring-[#FF733E]"
                    />
                    <span className="text-sm text-gray-700">{jobType}</span>
                  </label>
                ))}
              </div>
              {errors.desiredJobTypes && (
                <p className="mt-1 text-sm text-red-600">{errors.desiredJobTypes}</p>
              )}
            </div>

            {/* Desired Locations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                希望勤務地（複数選択可） <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {prefectures.map(prefecture => (
                  <label key={prefecture} className="flex items-center">
                    <input
                      type="checkbox"
                      value={prefecture}
                      checked={formData.desiredLocations.includes(prefecture)}
                      onChange={() => handleCheckboxChange('desiredLocations', prefecture)}
                      className="mr-2 rounded border-gray-300 text-[#FF733E] focus:ring-[#FF733E]"
                    />
                    <span className="text-sm text-gray-700">{prefecture}</span>
                  </label>
                ))}
              </div>
              {errors.desiredLocations && (
                <p className="mt-1 text-sm text-red-600">{errors.desiredLocations}</p>
              )}
            </div>

            {/* Work Style */}
            <div>
              <label htmlFor="workStyle" className="block text-sm font-medium text-gray-700 mb-2">
                希望する働き方
              </label>
              <select
                id="workStyle"
                name="workStyle"
                value={formData.workStyle}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
              >
                <option value="">選択してください</option>
                {workStyles.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>

            {/* Available Date */}
            <div>
              <label htmlFor="availableDate" className="block text-sm font-medium text-gray-700 mb-2">
                転職可能時期
              </label>
              <input
                type="date"
                id="availableDate"
                name="availableDate"
                value={formData.availableDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                転職可能な最短の日付を選択してください
              </p>
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
                className="px-6 py-2 bg-[#FF733E] text-white rounded-lg hover:bg-[#e9632e] transition"
              >
                次へ進む
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <StepNavigation currentStep={4} />
    </StepLayout>
  );
}
