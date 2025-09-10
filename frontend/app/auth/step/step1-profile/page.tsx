'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormPersist } from '@/hooks/useFormPersist';
import StepLayout from '@/components/auth/StepLayout';
import toast from 'react-hot-toast';
import useAuthV2 from '@/hooks/useAuthV2';

export default function Step1ProfilePage() {
  const router = useRouter();
  const { currentUser } = useAuthV2();
  const { formState, updateFormData } = useFormPersist();
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    title: '',
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    address: '',
    experience: '',
    desiredSalary: ''
  });

  // Redirect to user-specific page if logged in
  useEffect(() => {
    if (currentUser?.id) {
      router.replace(`/users/${currentUser.id}/profile`);
    }
  }, [currentUser, router]);

  // Load saved data on mount
  useEffect(() => {
    const savedData = formState.stepData?.step1;
    if (savedData) {
      setFormData(prev => ({
        ...prev,
        ...savedData
      }));
    }
  }, [formState.stepData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) newErrors.name = '氏名を入力してください';
    if (!formData.email) newErrors.email = 'メールアドレスを入力してください';
    if (!formData.phone) newErrors.phone = '電話番号を入力してください';
    if (!formData.birthDate) newErrors.birthDate = '生年月日を入力してください';
    if (!formData.address) newErrors.address = '住所を入力してください';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validateForm()) {
      // Save to persistent storage
      updateFormData('step1', formData);
      toast.success('基本情報を保存しました');
      router.push('/auth/step/step2-education');
    }
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  return (
    <StepLayout currentStep={1} stepTitle="職務経歴書編集">
      <div className="space-y-6">
        {/* 基本情報 Section */}
        <div>
          <h2 className="text-lg font-bold mb-4">基本情報</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Title Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                タイトル
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="例: マーケティング職向け職務経歴書"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
              />
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                氏名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6B35] focus:border-[#FF6B35] ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6B35] focus:border-[#FF6B35] ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                電話番号 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6B35] focus:border-[#FF6B35] ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Birth Date Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                生年月日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6B35] focus:border-[#FF6B35] ${
                  errors.birthDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.birthDate && (
                <p className="mt-1 text-xs text-red-600">{errors.birthDate}</p>
              )}
            </div>

            {/* Address Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                住所 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6B35] focus:border-[#FF6B35] ${
                  errors.address ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.address && (
                <p className="mt-1 text-xs text-red-600">{errors.address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Self PR Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            自己PR
          </label>
          <textarea
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            rows={5}
            placeholder="あなたの強みや経験を簡潔に記載してください"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
          />
        </div>

        {/* Desired Conditions Section */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              希望職種
            </label>
            <input
              type="text"
              placeholder="営業、マーケティングなど"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              希望年収
            </label>
            <input
              type="text"
              name="desiredSalary"
              value={formData.desiredSalary}
              onChange={handleChange}
              placeholder="例: 500万円〜"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
            />
          </div>
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