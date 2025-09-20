'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import StepLayout from '../components/StepLayout';
import StepNavigation from '../components/StepNavigation';
import { useFormPersist } from '@/hooks/useFormPersist';
import useAuthV2 from '@/hooks/useAuthV2';
import { PreferenceDraft } from '@/features/resume/form/types';
import ResumePreferencesForm, { ResumePreferencesFormHandle } from '@/features/resume/form/ResumePreferencesForm';
import { savePreferences } from '@/features/resume/form/api';
import toast from 'react-hot-toast';

const toDraft = (preference: any): PreferenceDraft => ({
  desiredSalary: preference?.desiredSalary || preference?.desired_salary || '',
  desiredIndustries: Array.isArray(preference?.desiredIndustries)
    ? preference.desiredIndustries
    : (preference?.desired_industries || []),
  desiredJobTypes: Array.isArray(preference?.desiredJobTypes)
    ? preference.desiredJobTypes
    : (preference?.desired_job_types || []),
  desiredLocations: Array.isArray(preference?.desiredLocations)
    ? preference.desiredLocations
    : (preference?.desired_locations || []),
  workStyle: preference?.workStyle || '',
  availableDate: preference?.availableDate || '',
});

const toStore = (draft: PreferenceDraft) => ({
  desiredSalary: draft.desiredSalary,
  desiredIndustries: draft.desiredIndustries,
  desiredJobTypes: draft.desiredJobTypes,
  desiredLocations: draft.desiredLocations,
  workStyle: draft.workStyle,
  availableDate: draft.availableDate,
});

export default function Step4PreferencePage() {
  const router = useRouter();
  const { currentUser, initializeAuth } = useAuthV2();
  const {
    formState,
    updatePreference,
    markStepCompleted,
    saveToLocalStorage,
  } = useFormPersist();

  const [preference, setPreference] = useState<PreferenceDraft>(() => toDraft({}));
  const formRef = useRef<ResumePreferencesFormHandle>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (currentUser?.id) {
      router.push(`/users/${currentUser.id}/preference`);
    }
  }, [currentUser, router]);

  useEffect(() => {
    setPreference(toDraft(formState.stepData.preference));
  }, [formState.stepData.preference]);

  const handleChange = (next: PreferenceDraft) => {
    setPreference(next);
    updatePreference(toStore(next));
  };

  const persistToBackend = async () => {
    try {
      await savePreferences(preference);
      return true;
    } catch (error) {
      console.error('Failed to persist preference:', error);
      toast.error('希望条件の保存に失敗しました');
      return false;
    }
  };

  const validate = () => {
    const result = formRef.current?.validate() ?? true;
    if (!result) {
      toast.error('必須項目を入力してください');
    }
    return result;
  };

  const handleNext = async () => {
    if (!validate()) return;
    saveToLocalStorage();
    const ok = await persistToBackend();
    if (ok) {
      markStepCompleted(4);
      toast.success('希望条件を保存しました');
      router.push('/auth/step/step5-confirm');
    }
  };

  const handleBack = async () => {
    saveToLocalStorage();
    await persistToBackend();
    router.push('/auth/step/step3-experience');
  };

  const handleSave = async () => {
    if (!validate()) return;
    saveToLocalStorage();
    const ok = await persistToBackend();
    if (ok) toast.success('希望条件を保存しました');
  };

  return (
    <StepLayout currentStep={4} title="希望条件">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">希望条件を入力してください</h2>

          <ResumePreferencesForm ref={formRef} value={preference} onChange={handleChange} />

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

      <StepNavigation currentStep={4} />
    </StepLayout>
  );
}
