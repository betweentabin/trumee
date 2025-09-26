'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import apiV2Client from '@/lib/api-v2-client';
import toast from 'react-hot-toast';
import useAuthV2 from '@/hooks/useAuthV2';

export default function CompanyNewJobPage() {
  const { initializeAuth, requireRole } = useAuthV2();
  const pathname = usePathname();
  const parts = (pathname || '').split('/').filter(Boolean);
  const companyIdFromPath = parts[0] === 'company' && parts[1] && parts.includes('jobs') ? parts[1] : null;
  const backHref = companyIdFromPath ? `/company/${companyIdFromPath}` : '/company';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('fulltime');
  const [loading, setLoading] = useState(false);

  // init auth & role
  useEffect(() => {
    initializeAuth();
    requireRole('company', '/auth/login');
  }, [initializeAuth, requireRole]);

  const handleSubmit = async () => {
    if (!title || !description) {
      toast.error('タイトルと仕事内容は必須です');
      return;
    }
    setLoading(true);
    try {
      const payload = { title, description, requirements, location, employment_type: employmentType };
      const res = await apiV2Client.createCompanyJob(payload);
      toast.success('求人を作成しました');
    } catch (e: any) {
      toast.error('求人の作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">求人を作成</h1>
        <Link href={backHref} className="text-sm text-gray-600 hover:text-gray-900">戻る</Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">求人タイトル</label>
          <input className="w-full border rounded-lg px-4 py-2" placeholder="例：フロントエンドエンジニア" value={title} onChange={(e)=>setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">仕事内容</label>
          <textarea className="w-full border rounded-lg px-4 py-2 h-32" placeholder="業務内容を入力" value={description} onChange={(e)=>setDescription(e.target.value)}></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">応募要件</label>
          <textarea className="w-full border rounded-lg px-4 py-2 h-24" placeholder="必須/歓迎スキル等" value={requirements} onChange={(e)=>setRequirements(e.target.value)}></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">勤務地</label>
            <input className="w-full border rounded-lg px-4 py-2" placeholder="東京都 渋谷区" value={location} onChange={(e)=>setLocation(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">雇用形態</label>
            <select className="w-full border rounded-lg px-4 py-2" value={employmentType} onChange={(e)=>setEmploymentType(e.target.value)}>
              <option value="fulltime">正社員</option>
              <option value="contract">契約社員</option>
              <option value="internship">インターン</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button className="px-6 py-2 rounded-full border" disabled={loading}>下書き保存</button>
          <button onClick={handleSubmit} disabled={loading} className={`px-6 py-2 rounded-full text-white ${loading ? 'bg-gray-400' : 'bg-[#FF733E] hover:bg-[#e9632e]'}`}>{loading ? '作成中...' : '公開する'}</button>
        </div>
      </div>
    </div>
  );
}
