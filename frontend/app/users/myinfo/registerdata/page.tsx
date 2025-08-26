'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaUser, FaBriefcase, FaClipboardList, FaFileAlt } from 'react-icons/fa';

export default function RegisterDataPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('profile');

  const sections = [
    { id: 'profile', label: 'プロフィール', icon: FaUser, href: '/auth/step/step1-profile' },
    { id: 'history', label: '経歴', icon: FaBriefcase, href: '/auth/step/step3-experience' },
    { id: 'hope', label: '希望条件', icon: FaClipboardList, href: '/auth/step/step4-preference' },
    { id: 'resume', label: '履歴書', icon: FaFileAlt, href: '/resumes' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">登録情報</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => router.push(section.href)}
              className="flex flex-col items-center p-4 bg-white border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <Icon className="text-3xl text-blue-500 mb-2" />
              <span className="text-sm font-medium">{section.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">登録情報の管理</h2>
        <p className="text-gray-600 mb-4">
          各セクションをクリックして、情報の確認・編集ができます。
        </p>
        
        <div className="space-y-3">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold">プロフィール</h3>
            <p className="text-sm text-gray-600">基本情報や連絡先を管理</p>
          </div>
          
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold">経歴</h3>
            <p className="text-sm text-gray-600">職歴・学歴・スキルを登録</p>
          </div>
          
          <div className="border-l-4 border-yellow-500 pl-4">
            <h3 className="font-semibold">希望条件</h3>
            <p className="text-sm text-gray-600">希望する職種・勤務地・年収を設定</p>
          </div>
          
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-semibold">履歴書</h3>
            <p className="text-sm text-gray-600">履歴書の作成・管理・ダウンロード</p>
          </div>
        </div>
      </div>
    </div>
  );
}