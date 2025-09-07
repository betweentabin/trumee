'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormPersist } from '@/hooks/useFormPersist';
import useAuthV2 from '@/hooks/useAuthV2';
import StepNavigation from '../components/StepNavigation';
import StepLayout from '../components/StepLayout';
import toast from 'react-hot-toast';

export default function Step5ConfirmPage() {
  const router = useRouter();
  const { initializeAuth } = useAuthV2();
  const {
    formState,
    markStepCompleted,
    navigateToStep,
    saveToBackend,
  } = useFormPersist();

  useEffect(() => { initializeAuth(); }, [initializeAuth]);

  const { profile, education, experiences, preference } = formState.stepData;

  const handleBack = () => { router.push('/auth/step/step4-preference'); };

  const handleConfirm = async () => {
    try {
      // Save to backend
      const success = await saveToBackend();
      
      if (success) {
        markStepCompleted(5);
        toast.success('履歴書情報を保存しました');
        router.push('/auth/step/step6-download');
      } else {
        toast.error('保存に失敗しました。もう一度お試しください。');
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      toast.error('保存中にエラーが発生しました');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
  };

  const formatMonth = (monthString: string) => {
    if (!monthString) return '';
    const [year, month] = monthString.split('-');
    return `${year}年${month}月`;
  };

  return (
    <StepLayout currentStep={5} title="確認">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            入力内容の確認
          </h2>

          <div className="space-y-8">
            {/* Profile Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">基本情報</h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">氏名</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profile?.lastName} {profile?.firstName}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">カナ</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profile?.lastNameKana} {profile?.firstNameKana}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile?.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">電話番号</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile?.phone}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">生年月日</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(profile?.birthday || '')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">性別</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile?.sex}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">都道府県</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile?.prefecture}</dd>
                </div>
              </dl>
            </div>

            {/* Education Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">学歴</h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">学歴区分</dt>
                  <dd className="mt-1 text-sm text-gray-900">{education?.educationType}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">学校名</dt>
                  <dd className="mt-1 text-sm text-gray-900">{education?.school}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">学部・学科</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {education?.faculty || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">卒業年</dt>
                  <dd className="mt-1 text-sm text-gray-900">{education?.graduationYear}年</dd>
                </div>
              </dl>
            </div>

            {/* Experience Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">職歴</h3>
              {experiences && experiences.length > 0 ? (
                <div className="space-y-4">
                  {experiences.map((exp, index) => (
                    <div key={exp.id} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        職歴 {index + 1}: {exp.company}
                      </h4>
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <dt className="inline font-medium text-gray-500">期間：</dt>
                          <dd className="inline text-gray-900 ml-1">
                            {formatMonth(exp.periodFrom)} 〜 {exp.periodTo ? formatMonth(exp.periodTo) : '現在'}
                          </dd>
                        </div>
                        <div>
                          <dt className="inline font-medium text-gray-500">雇用形態：</dt>
                          <dd className="inline text-gray-900 ml-1">{exp.employmentType}</dd>
                        </div>
                        <div>
                          <dt className="inline font-medium text-gray-500">業種：</dt>
                          <dd className="inline text-gray-900 ml-1">{exp.industry}</dd>
                        </div>
                        <div>
                          <dt className="inline font-medium text-gray-500">役職：</dt>
                          <dd className="inline text-gray-900 ml-1">{exp.position || '-'}</dd>
                        </div>
                        <div className="md:col-span-2">
                          <dt className="font-medium text-gray-500">職務内容：</dt>
                          <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{exp.tasks}</dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">職歴情報が入力されていません</p>
              )}
            </div>

            {/* Preference Section */}
            <div className="pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">希望条件</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">希望年収</dt>
                  <dd className="mt-1 text-sm text-gray-900">{preference?.desiredSalary}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">希望業種</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {preference?.desiredIndustries?.join('、') || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">希望職種</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {preference?.desiredJobTypes?.join('、') || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">希望勤務地</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {preference?.desiredLocations?.join('、') || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">希望の働き方</dt>
                  <dd className="mt-1 text-sm text-gray-900">{preference?.workStyle}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">転職可能時期</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {preference?.availableDate ? formatDate(preference.availableDate) : '未定'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Warning Box */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  内容を確認して、間違いがなければ「確定する」ボタンをクリックしてください。
                  修正が必要な場合は「戻る」ボタンから該当のステップに戻って修正してください。
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
            <button
              onClick={handleConfirm}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              確定する
            </button>
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <StepNavigation currentStep={5} />
    </StepLayout>
  );
}
