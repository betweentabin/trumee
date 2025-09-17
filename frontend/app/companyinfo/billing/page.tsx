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
        if (res.ok) {
          const data = await res.json();
          setForm((prev) => ({ ...prev, ...data }));
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const save = async () => {
    try {
      setLoading(true);
      const res = await fetch(buildApiUrl('/company/profile/'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('保存に失敗しました');
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
          <input value={form.billing_company_name} onChange={(e)=>setForm({...form, billing_company_name: e.target.value})} className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">部署・担当者</label>
          <input value={form.billing_department} onChange={(e)=>setForm({...form, billing_department: e.target.value})} className="w-full border rounded p-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">郵便番号</label>
            <input value={form.billing_zip} onChange={(e)=>setForm({...form, billing_zip: e.target.value})} className="w-full border rounded p-2" placeholder="100-0000" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">住所</label>
            <input value={form.billing_address} onChange={(e)=>setForm({...form, billing_address: e.target.value})} className="w-full border rounded p-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">請求書送付先メール</label>
          <input type="email" value={form.billing_email} onChange={(e)=>setForm({...form, billing_email: e.target.value})} className="w-full border rounded p-2" placeholder="billing@example.com" />
        </div>
        <div className="text-right">
          <button onClick={save} disabled={loading} className="px-6 py-2 bg-[#FF733E] text-white rounded-lg disabled:bg-gray-400">{loading ? '保存中...' : '保存'}</button>
        </div>
      </div>
    </div>
  );
}
