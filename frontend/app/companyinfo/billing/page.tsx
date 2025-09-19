"use client";

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { buildApiUrl } from '@/config/api';
import { getAuthHeaders } from '@/utils/auth';

interface BillingForm {
  billing_company_name: string;
  billing_department: string;
  billing_zip: string;
  billing_address: string;
  billing_email: string;
}

export default function CompanyBillingPage() {
  const [form, setForm] = useState<BillingForm>({
    billing_company_name: '',
    billing_department: '',
    billing_zip: '',
    billing_address: '',
    billing_email: '',
  });
  const [loading, setLoading] = useState(false);

useEffect(() => {
  (async () => {
    try {
      const res = await fetch(buildApiUrl('/company/profile/'), {
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) return;

      const data = await res.json();
      setForm((prev) => ({
        ...prev,
        billing_company_name: data.billing_company_name || '',
        billing_department: data.billing_department || '',
        billing_zip: data.billing_zip || '',
        billing_address: data.billing_address || '',
        billing_email: data.billing_email || '',
      }));
    } catch (e) {
      // ignore
    }
  })();
}, []);

  const save = async () => {
    const payload = {
      billing_company_name: form.billing_company_name?.trim() || '',
      billing_department: form.billing_department?.trim() || '',
      billing_zip: form.billing_zip?.trim() || '',
      billing_address: form.billing_address?.trim() || '',
      billing_email: form.billing_email?.trim() || '',
    };

    try {
      setLoading(true);
      const res = await fetch(buildApiUrl('/company/profile/'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => undefined);
        const message = detail && typeof detail === 'object'
          ? Object.values(detail)
              .map((value) => Array.isArray(value) ? value.join(' / ') : String(value))
              .join('\n')
          : '保存に失敗しました';
        throw new Error(message);
      }
      toast.success('請求書送付先を保存しました');
    } catch (e: any) {
      toast.error(e?.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">請求書の送付先情報</h1>
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">会社名</label>
          <input value={form.billing_company_name} onChange={(e)=>setForm({...form, billing_company_name: e.target.value})} className="w-full border border-secondary-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">部署・担当者</label>
          <input value={form.billing_department} onChange={(e)=>setForm({...form, billing_department: e.target.value})} className="w-full border border-secondary-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">郵便番号</label>
            <input value={form.billing_zip} onChange={(e)=>setForm({...form, billing_zip: e.target.value})} className="w-full border border-secondary-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600" placeholder="100-0000" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">住所</label>
            <input value={form.billing_address} onChange={(e)=>setForm({...form, billing_address: e.target.value})} className="w-full border border-secondary-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">請求書送付先メール</label>
          <input type="email" value={form.billing_email} onChange={(e)=>setForm({...form, billing_email: e.target.value})} className="w-full border border-secondary-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600" placeholder="billing@example.com" />
        </div>
        <div className="text-right">
          <button onClick={save} disabled={loading} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:bg-secondary-300">{loading ? '保存中...' : '保存'}</button>
        </div>
      </div>
    </div>
  );
}
