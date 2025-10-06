'use client';

import { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import toast from 'react-hot-toast';
import { buildApiUrl } from '@/config/api';
import { getAuthHeaders } from '@/utils/auth';

type FormInputs = {
  lastName: string;
  firstName: string;
  companyName: string;
  capital: string;
  phone1: string;
  phone2: string;
  phone3: string;
  email: string;
  homepage: string;
  // 既存UI維持（現時点では保存対象外）
  subscriptions: {
    messageNews: boolean;
    newJobs: boolean;
    matchingReport: boolean;
  };
};

export default function CompanyForm() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormInputs>({
    defaultValues: {
      subscriptions: {
        messageNews: false,
        newJobs: true,
        matchingReport: true,
      },
    },
  });

  // Fetch company data via API v2 and prefill
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(buildApiUrl('/user/profile/'), {
          headers: { ...getAuthHeaders() },
        });
        if (!res.ok) throw new Error('プロフィールの取得に失敗しました');
        const data = await res.json();
        const user = data || {};
        const profile = user.company_profile || {};

        // User fields
        const email = String(user.email || '');
        const phone = String(user.phone || '');
        const phoneParts = phone.split('-');
        setValue('email', email);
        setValue('phone1', phoneParts[0] || '');
        setValue('phone2', phoneParts[1] || '');
        setValue('phone3', phoneParts[2] || '');

        // Company profile fields
        setValue('companyName', String(profile.company_name || user.company_name || ''));
        setValue('homepage', String(profile.company_url || user.company_url || ''));
        setValue('capital', String(profile.capital ?? ''));

        // contact_person を last/first に分割（簡易）
        const contact = String(profile.contact_person || '').trim();
        if (contact) {
          const parts = contact.split(/\s+/);
          if (parts.length >= 2) {
            setValue('lastName', parts[0]);
            setValue('firstName', parts.slice(1).join(' '));
          } else {
            setValue('lastName', contact);
          }
        }
      } catch (e: any) {
        console.error('companyinfo load failed', e);
        // 非致命
      }
    })();
  }, [setValue]);

  // Submit updated form data
  const onSubmit: SubmitHandler<FormInputs> = async (formData) => {
    try {
      // Build payloads
      const phone = [formData.phone1, formData.phone2, formData.phone3].filter(Boolean).join('-');
      const companyPayload: any = {
        company_name: (formData.companyName || '').trim(),
        company_url: (formData.homepage || '').trim(),
      };
      const capitalDigits = (formData.capital || '').replace(/[^0-9]/g, '');
      if (capitalDigits) companyPayload.capital = parseInt(capitalDigits, 10);
      const contact = `${(formData.lastName || '').trim()} ${(formData.firstName || '').trim()}`.trim();
      if (contact) companyPayload.contact_person = contact;

      // 1) Update company profile
      const res1 = await fetch(buildApiUrl('/company/profile/'), {
        method: 'PUT',
        headers: { ...getAuthHeaders() },
        body: JSON.stringify(companyPayload),
      });
      if (!res1.ok) {
        const t = await res1.text();
        throw new Error(`会社情報の保存に失敗しました (${res1.status}) ${t}`);
      }

      // 2) Update user contact (email/phone) if present
      //   current_user_v2 の id を参照
      const currentUserRaw = typeof window !== 'undefined' ? localStorage.getItem('current_user_v2') : null;
      const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
      if (currentUser?.id) {
        const res2 = await fetch(buildApiUrl(`/users/${currentUser.id}/update/`), {
          method: 'PATCH',
          headers: { ...getAuthHeaders() },
          body: JSON.stringify({ email: (formData.email || '').trim(), phone }),
        });
        if (!res2.ok) {
          const t = await res2.text();
          throw new Error(`連絡先の保存に失敗しました (${res2.status}) ${t}`);
        }
      }

      toast.success('保存しました');
    } catch (error: any) {
      console.error('companyinfo save failed', error);
      toast.error(error?.message || '更新に失敗しました');
    }
  };

  return (
    <>
      <h1 className="text-3xl">登録情報の管理設定</h1>
      <h2 className="text-xl mt-4 mb-5">登録した情報を編集できます。</h2>
      <form onSubmit={handleSubmit(onSubmit)} className=" mx-auto bg-white p-6 rounded shadow-md text-sm text-gray-700">
        <h2 className="text-orange-500 font-bold mb-4 text-base">企業情報</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1">氏名</label>
            <input
              {...register('lastName', { required: true })}
              className="w-full border border-gray-300 rounded px-2 py-1"
              placeholder="山田"
            />
          </div>
          <div className="mt-6">
            <input
              {...register('firstName', { required: true })}
              className="w-full border border-gray-300 rounded px-2 py-1"
              placeholder="太郎"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-1">会社名</label>
          <input
            {...register('companyName', { required: true })}
            className="w-full border border-gray-300 rounded px-2 py-1"
            placeholder="会社名を入力してください"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">資本金</label>
          <input
            {...register('capital')}
            className="w-full border border-gray-300 rounded px-2 py-1"
            placeholder="資本金を入力してください"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">電話番号</label>
          <div className="flex gap-2">
            <input {...register('phone1')} className="w-1/3 border border-gray-300 rounded px-2 py-1" placeholder="080" />
            <input {...register('phone2')} className="w-1/3 border border-gray-300 rounded px-2 py-1" placeholder="1234" />
            <input {...register('phone3')} className="w-1/3 border border-gray-300 rounded px-2 py-1" placeholder="5678" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-1">メールアドレス/会員ID</label>
          <input
            {...register('email', { required: true, pattern: /^\S+@\S+$/i })}
            className="w-full border border-gray-300 rounded px-2 py-1"
            placeholder="sample@gmail.com"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-1">会社HP・URL</label>
          <input {...register('homepage')} className="w-full border border-gray-300 rounded px-2 py-1" placeholder="https://www." />
        </div>

        <div className="mb-6 p-4 border border-orange-300 rounded bg-orange-50">
          <p className="text-orange-500 font-semibold mb-2 text-sm">メールの配信</p>
          <div className="space-y-2 text-xs text-gray-700">
            <label className="flex items-center space-x-2">
              <input type="checkbox" {...register('subscriptions.messageNews')} className="accent-orange-500" />
              <span>採用者からのメッセージ受信時にニュースを受け取る</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" {...register('subscriptions.newJobs')} className="accent-orange-500" defaultChecked />
              <span>新着募集情報を含めた通知メールを受け取る</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" {...register('subscriptions.matchingReport')} className="accent-orange-500" defaultChecked />
              <span>マッチング状況レポート通知メールを受け取る</span>
            </label>
          </div>
        </div>

        <div className="text-center">
          <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded">保存する →</button>
        </div>
      </form>
    </>
  );
}
