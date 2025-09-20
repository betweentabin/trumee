'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormPersist } from '@/hooks/useFormPersist';
import useAuthV2 from '@/hooks/useAuthV2';
import StepLayout from '../components/StepLayout';
import StepNavigation from '../components/StepNavigation';
import { DefaultModal } from '@/components/modal';
import ResumePreview from '@/components/pure/resume/preview';
import toast from 'react-hot-toast';
import ResumeExperiencesForm, { ResumeExperiencesFormHandle } from '@/features/resume/form/ResumeExperiencesForm';
import { ExperienceDraft } from '@/features/resume/form/types';
import { saveExperiences } from '@/features/resume/form/api';
import { EMPLOYMENT_TYPE_LABEL_BY_VALUE, EMPLOYMENT_TYPE_VALUE_BY_LABEL } from '@/features/resume/form/constants';

const normalizeMonth = (value?: string | null): string => {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  if (/^\d{4}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{4}\/\d{2}$/.test(trimmed)) return trimmed.replace('/', '-');
  try {
    const date = new Date(trimmed);
    if (!Number.isNaN(date.getTime())) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    }
  } catch {}
  return trimmed;
};

const toDraft = (experience: any, index: number): ExperienceDraft => ({
  id: experience?.id ?? index + 1,
  company: experience?.company ?? '',
  periodFrom: normalizeMonth(experience?.periodFrom ?? experience?.period_from),
  periodTo: normalizeMonth(experience?.periodTo ?? experience?.period_to),
  employmentType:
    EMPLOYMENT_TYPE_VALUE_BY_LABEL[experience?.employmentType as string] ||
    EMPLOYMENT_TYPE_VALUE_BY_LABEL[experience?.employment_type as string] ||
    experience?.employmentType ||
    'fulltime',
  business: experience?.business ?? '',
  capital: experience?.capital ?? '',
  teamSize: experience?.teamSize ?? experience?.team_size ?? '',
  tasks: experience?.tasks ?? '',
  position: experience?.position ?? '',
  industry: experience?.industry ?? '',
});

const toStore = (draft: ExperienceDraft, fallbackId: number) => ({
  id: draft.id ?? fallbackId,
  company: draft.company,
  periodFrom: draft.periodFrom,
  periodTo: draft.periodTo,
  employmentType: EMPLOYMENT_TYPE_LABEL_BY_VALUE[draft.employmentType || ''] || EMPLOYMENT_TYPE_LABEL_BY_VALUE['fulltime'],
  business: draft.business,
  capital: draft.capital,
  teamSize: draft.teamSize,
  tasks: draft.tasks,
  position: draft.position,
  industry: draft.industry,
});

const buildPreviewData = (experiences: ExperienceDraft[]) => {
  const jobhistoryList = experiences.map((_, i) => `job${i + 1}`);
  const formValues: Record<string, any> = {};
  experiences.forEach((exp, idx) => {
    const key = jobhistoryList[idx];
    formValues[key] = {
      company: exp.company,
      capital: exp.capital,
      work_content: exp.tasks,
      since: exp.periodFrom ? exp.periodFrom.replace('-', '/') : '',
      to: exp.periodTo ? exp.periodTo.replace('-', '/') : '現在',
      people: exp.teamSize,
      duty: exp.position,
      business: exp.business,
    };
  });
  return { jobhistoryList, formValues };
};

export default function Step3ExperiencePage() {
  const router = useRouter();
  const { initializeAuth, currentUser } = useAuthV2();
  const {
    formState,
    setExperiences: setExperiencesInStore,
    markStepCompleted,
    saveToLocalStorage,
  } = useFormPersist();

  const [experiences, setExperiences] = useState<ExperienceDraft[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const formRef = useRef<ResumeExperiencesFormHandle>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (currentUser?.id) {
      router.push(`/users/${currentUser.id}/experience`);
    }
  }, [currentUser, router]);

  useEffect(() => {
    const stored = formState.stepData.experiences;
    if (stored?.length) {
      setExperiences(stored.map((exp, idx) => toDraft(exp, idx)));
    } else {
      setExperiences([toDraft({}, 0)]);
    }
  }, [formState.stepData.experiences]);

  const previewData = useMemo(() => buildPreviewData(experiences), [experiences]);

  const syncStore = (next: ExperienceDraft[]) => {
    setExperiences(next);
    setExperiencesInStore(next.map((exp, idx) => toStore(exp, idx + 1)) as any);
  };

  const handleExperiencesChange = (next: ExperienceDraft[]) => {
    syncStore(next);
  };

  const persistToBackend = async () => {
    try {
      await saveExperiences(experiences);
      return true;
    } catch (error) {
      console.error('Failed to persist experiences:', error);
      toast.error('職歴の保存に失敗しました');
      return false;
    }
  };

  const validateForm = () => {
    const valid = formRef.current?.validate() ?? true;
    if (!valid) {
      toast.error('入力内容を確認してください');
    }
    return valid;
  };

  const handleNext = async () => {
    if (!validateForm()) return;
    saveToLocalStorage();
    const ok = await persistToBackend();
    if (ok) {
      markStepCompleted(3);
      toast.success('職歴情報を保存しました');
      router.push('/auth/step/step4-preference');
    }
  };

  const handleBack = () => {
    saveToLocalStorage();
    router.push('/auth/step/step2-education');
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    saveToLocalStorage();
    const ok = await persistToBackend();
    if (ok) toast.success('職歴情報を保存しました');
  };

  return (
    <StepLayout currentStep={3} title="職歴">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">職歴を入力してください</h2>

          <ResumeExperiencesForm ref={formRef} value={experiences} onChange={handleExperiencesChange} />

          <div className="mt-8 flex justify-between">
            <button
              onClick={handleBack}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              戻る
            </button>
            <div className="space-x-3">
              <button
                onClick={() => setShowPreview(true)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                プレビュー
              </button>
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

      <StepNavigation currentStep={3} />

      <DefaultModal isOpen={showPreview} onClose={() => setShowPreview(false)}>
        <div className="w-full max-w-4xl">
          <ResumePreview
            userName=""
            jobhistoryList={previewData.jobhistoryList}
            formValues={previewData.formValues}
          />
          <div className="p-4 flex justify-end">
            <button
              onClick={() => setShowPreview(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              閉じる
            </button>
          </div>
        </div>
      </DefaultModal>
    </StepLayout>
  );
}
