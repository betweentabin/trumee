'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormPersist } from '@/hooks/useFormPersist';
import useAuthV2 from '@/hooks/useAuthV2';
import StepLayout from '@/components/auth/StepLayout';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';

interface EducationEntry {
  id: string;
  schoolName: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
  description: string;
}

export default function Step2EducationPage() {
  const router = useRouter();
  const { currentUser } = useAuthV2();
  const { formState, updateFormData } = useFormPersist();
  
  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>([
    {
      id: '1',
      schoolName: '',
      degree: '',
      major: '',
      startDate: '',
      endDate: '',
      description: ''
    }
  ]);

  // Redirect to user-specific page if user exists
  useEffect(() => {
    if (currentUser?.id) {
      // Check if education page exists, otherwise go to profile
      router.push(`/users/${currentUser.id}/profile`);
      return;
    }
  }, [currentUser, router]);

  // Load saved data on mount
  useEffect(() => {
    const savedData = formState.stepData?.step2;
    if (savedData && savedData.educationEntries) {
      setEducationEntries(savedData.educationEntries);
    }
  }, [formState.stepData]);

  const handleChange = (id: string, field: keyof EducationEntry, value: string) => {
    setEducationEntries(prev => 
      prev.map(entry => 
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const addEducationEntry = () => {
    const newEntry: EducationEntry = {
      id: Date.now().toString(),
      schoolName: '',
      degree: '',
      major: '',
      startDate: '',
      endDate: '',
      description: ''
    };
    setEducationEntries(prev => [...prev, newEntry]);
  };

  const removeEducationEntry = (id: string) => {
    if (educationEntries.length > 1) {
      setEducationEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  const validateForm = () => {
    // Basic validation - at least one education entry with school name
    return educationEntries.some(entry => entry.schoolName.trim() !== '');
  };

  const handleNext = () => {
    if (validateForm()) {
      updateFormData('step2', { educationEntries });
      toast.success('学歴情報を保存しました');
      router.push('/auth/step/step3-experience');
    } else {
      toast.error('少なくとも1つの学歴を入力してください');
    }
  };

  const handleBack = () => {
    router.push('/auth/step/step1-profile');
  };

  return (
    <StepLayout currentStep={2} stepTitle="職務経歴書編集">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold mb-4">学歴</h2>
          
          {educationEntries.map((entry, index) => (
            <div key={entry.id} className="mb-6 p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-semibold">学歴 {index + 1}</h3>
                {educationEntries.length > 1 && (
                  <button
                    onClick={() => removeEducationEntry(entry.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    学校名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={entry.schoolName}
                    onChange={(e) => handleChange(entry.id, 'schoolName', e.target.value)}
                    placeholder="例: 東京大学"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    学位
                  </label>
                  <select
                    value={entry.degree}
                    onChange={(e) => handleChange(entry.id, 'degree', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                  >
                    <option value="">選択してください</option>
                    <option value="高校卒業">高校卒業</option>
                    <option value="専門学校卒業">専門学校卒業</option>
                    <option value="短大卒業">短大卒業</option>
                    <option value="学士">学士</option>
                    <option value="修士">修士</option>
                    <option value="博士">博士</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    専攻
                  </label>
                  <input
                    type="text"
                    value={entry.major}
                    onChange={(e) => handleChange(entry.id, 'major', e.target.value)}
                    placeholder="例: 経済学部"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    入学年月
                  </label>
                  <input
                    type="month"
                    value={entry.startDate}
                    onChange={(e) => handleChange(entry.id, 'startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    卒業年月
                  </label>
                  <input
                    type="month"
                    value={entry.endDate}
                    onChange={(e) => handleChange(entry.id, 'endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  詳細・活動内容
                </label>
                <textarea
                  value={entry.description}
                  onChange={(e) => handleChange(entry.id, 'description', e.target.value)}
                  rows={3}
                  placeholder="学生時代の活動、研究内容、受賞歴など"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                />
              </div>
            </div>
          ))}

          <button
            onClick={addEducationEntry}
            className="flex items-center gap-2 px-4 py-2 text-[#FF6B35] border border-[#FF6B35] rounded-md hover:bg-[#FF6B35] hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            学歴を追加
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6">
          <button
            onClick={handleBack}
            className="px-8 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            前へ
          </button>
          <button
            onClick={handleNext}
            className="px-8 py-2.5 bg-[#FF6B35] text-white rounded-md hover:bg-[#e85a2b] transition-colors"
          >
            次へ
          </button>
        </div>
      </div>
    </StepLayout>
  );
}