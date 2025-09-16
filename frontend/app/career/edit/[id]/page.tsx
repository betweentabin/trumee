'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
// import { FaChevronRight } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getAuthHeaders } from '@/utils/auth';
import { buildApiUrl } from '@/config/api';

interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  achievements: string[];
}

interface Education {
  school: string;
  degree: string;
  field: string;
  graduationDate: string;
}

interface ResumeData {
  title: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  birthDate: string;
  summary: string;
  desiredPosition: string;
  desiredSalary: string;
  workExperiences: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications: string[];
  languages: { language: string; level: string }[];
}

export default function EditResumePage() {
  const router = useRouter();
  const params = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [agreePublish, setAgreePublish] = useState(false);
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData>({
    title: '',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    summary: '',
    desiredPosition: '',
    desiredSalary: '',
    workExperiences: [{
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: '',
      achievements: ['']
    }],
    education: [{
      school: '',
      degree: '',
      field: '',
      graduationDate: ''
    }],
    skills: [''],
    certifications: [''],
    languages: [{ language: '', level: '' }]
  });

  useEffect(() => {
    fetchResume();
  }, [params.id]);

  const fetchResume = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v2/resumes/${params.id}/`, {
        headers: {
          ...getAuthHeaders(),
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const extra = data?.extra_data || {};
        setResumeData({
          title: extra.title || '',
          fullName: extra.fullName || '',
          email: extra.email || '',
          phone: extra.phone || '',
          address: extra.address || '',
          birthDate: extra.birthDate || '',
          summary: data?.self_pr || '',
          desiredPosition: data?.desired_job || '',
          desiredSalary: extra.desiredSalary || '',
          // Keep experiences/education only in extra_data for now to avoid nested validation
          workExperiences: extra.workExperiences || [{
            company: '',
            position: '',
            startDate: '',
            endDate: '',
            description: '',
            achievements: ['']
          }],
          education: extra.education || [{
            school: '',
            degree: '',
            field: '',
            graduationDate: ''
          }],
          // API stores skills as comma-separated string; split to array for editing
          skills: (data?.skills ? String(data.skills).split(',').map((s: string) => s.trim()).filter(Boolean) : ['']),
          certifications: extra.certifications || [''],
          languages: extra.languages || [{ language: '', level: '' }]
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching resume:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      // Map local state to API fields (keep complex sections in extra_data)
      const apiData = {
        desired_job: resumeData.desiredPosition || '',
        desired_industries: [],
        desired_locations: [],
        skills: (resumeData.skills || []).filter(s => s).join(', '),
        self_pr: resumeData.summary || '',
        extra_data: {
          title: resumeData.title,
          fullName: resumeData.fullName,
          email: resumeData.email,
          phone: resumeData.phone,
          address: resumeData.address,
          birthDate: resumeData.birthDate,
          desiredSalary: resumeData.desiredSalary,
          workExperiences: resumeData.workExperiences,
          education: resumeData.education,
          certifications: resumeData.certifications,
          languages: resumeData.languages,
        },
      } as any;

      const response = await fetch(`${apiUrl}/api/v2/resumes/${params.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        toast.success('職務経歴書を更新しました');
        router.push('/career');
      } else {
        // Try to surface backend error for easier debugging
        try {
          const err = await response.json();
          console.error('Resume update failed:', err);
        } catch {}
        throw new Error('更新に失敗しました');
      }
    } catch (error) {
      toast.error('更新に失敗しました');
    }
  };

  const addWorkExperience = () => {
    setResumeData(prev => ({
      ...prev,
      workExperiences: [...prev.workExperiences, {
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        description: '',
        achievements: ['']
      }]
    }));
  };

  const addSkill = () => {
    setResumeData(prev => ({ ...prev, skills: [...prev.skills, ''] }));
  };

  // 左メニュー（マイページ項目）は非表示に変更

  const StepIndicator = () => {
    const steps = ['基本情報', '職歴', '学歴', 'スキル', '自己PR', '完了'];
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex-1 relative">
              <div className="flex items-center">
                <div
                  className={`h-2 flex-1 ${
                    index + 1 <= currentStep ? 'bg-[#FF733E]' : 'bg-gray-200'
                  } ${index === 0 ? 'rounded-l' : ''} ${
                    index === steps.length - 1 ? 'rounded-r' : ''
                  }`}
                />
              </div>
              <div className="text-center mt-2">
                <span className={`text-sm ${index + 1 === currentStep ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                  {step}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">基本情報</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  タイトル
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
                  placeholder="例: マーケティング職向け職務経歴書"
                  value={resumeData.title}
                  onChange={(e) => setResumeData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  氏名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
                  value={resumeData.fullName}
                  onChange={(e) => setResumeData(prev => ({ ...prev, fullName: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
                  value={resumeData.email}
                  onChange={(e) => setResumeData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電話番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
                  value={resumeData.phone}
                  onChange={(e) => setResumeData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  生年月日
                </label>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
                  value={resumeData.birthDate}
                  onChange={(e) => setResumeData(prev => ({ ...prev, birthDate: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  住所
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
                  value={resumeData.address}
                  onChange={(e) => setResumeData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
            </div>

            {/* 自己PRは後続ステップで入力 */}

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  希望職種
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
                  value={resumeData.desiredPosition}
                  onChange={(e) => setResumeData(prev => ({ ...prev, desiredPosition: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  希望年収
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
                  placeholder="例: 500万円〜"
                  value={resumeData.desiredSalary}
                  onChange={(e) => setResumeData(prev => ({ ...prev, desiredSalary: e.target.value }))}
                />
              </div>
            </div>
            {/* 学歴（基本情報に含める） */}
            <div className="space-y-4">
              <h3 className="font-semibold">学歴</h3>
              {(resumeData.education || []).map((edu, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">学校名</label>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
                        value={edu.school}
                        onChange={(e) => {
                          const updated = [...resumeData.education];
                          updated[index].school = e.target.value;
                          setResumeData(prev => ({ ...prev, education: updated }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">学位</label>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
                        value={edu.degree}
                        onChange={(e) => {
                          const updated = [...resumeData.education];
                          updated[index].degree = e.target.value;
                          setResumeData(prev => ({ ...prev, education: updated }));
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">専攻</label>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
                        value={edu.field}
                        onChange={(e) => {
                          const updated = [...resumeData.education];
                          updated[index].field = e.target.value;
                          setResumeData(prev => ({ ...prev, education: updated }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">卒業年月</label>
                      <input
                        type="date"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
                        value={edu.graduationDate}
                        onChange={(e) => {
                          const updated = [...resumeData.education];
                          updated[index].graduationDate = e.target.value;
                          setResumeData(prev => ({ ...prev, education: updated }));
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setResumeData(prev => ({ ...prev, education: [...prev.education, { school: '', degree: '', field: '', graduationDate: '' }] }))}
                className="mt-2 text-[#FF733E] hover:text-[#FF8659] font-medium"
              >
                + 学歴を追加
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">職務要約（プレビュー）</h2>
            <div className="bg-gray-50 border rounded-lg p-6 space-y-3">
              <div><span className="text-xs text-gray-500">タイトル</span><div>{resumeData.title || '（未設定）'}</div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><span className="text-xs text-gray-500">氏名</span><div>{resumeData.fullName || '（未設定）'}</div></div>
                <div><span className="text-xs text-gray-500">メール</span><div>{resumeData.email || '（未設定）'}</div></div>
                <div><span className="text-xs text-gray-500">電話</span><div>{resumeData.phone || '（未設定）'}</div></div>
                <div><span className="text-xs text-gray-500">住所</span><div>{resumeData.address || '（未設定）'}</div></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><span className="text-xs text-gray-500">希望職種</span><div>{resumeData.desiredPosition || '（未設定）'}</div></div>
                <div><span className="text-xs text-gray-500">希望年収</span><div>{resumeData.desiredSalary || '（未設定）'}</div></div>
              </div>
              <div>
                <span className="text-xs text-gray-500">自己PR</span>
                <div className="whitespace-pre-wrap">{resumeData.summary || '（未入力）'}</div>
              </div>
              <div>
                <span className="text-xs text-gray-500">職歴</span>
                <div className="space-y-2 mt-1">
                  {(resumeData.workExperiences || []).map((w, i) => (
                    <div key={i} className="border rounded p-2">
                      <div className="font-medium">{w.company || '会社名未設定'} / {w.position || '役職未設定'}</div>
                      <div className="text-xs text-gray-500">{w.startDate || '----/--'} ~ {w.endDate || '----/--'}</div>
                      {w.description && <div className="mt-1 text-sm whitespace-pre-wrap">{w.description}</div>}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500">学歴</span>
                <div className="space-y-2 mt-1">
                  {(resumeData.education || []).map((e, i) => (
                    <div key={i} className="border rounded p-2">
                      <div className="font-medium">{e.school || '学校名未設定'} / {e.degree || '学位未設定'}</div>
                      <div className="text-xs text-gray-500">{e.field || '専攻未設定'} / {e.graduationDate || '卒業年月未設定'}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500">スキル</span>
                <div className="mt-1 text-sm">{(resumeData.skills || []).filter(Boolean).join(', ') || '（未入力）'}</div>
              </div>
            </div>
            <div className="text-sm text-gray-500">この内容で「保存」を押すと反映されます。</div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-2">職務経歴書の作成が完了しました</h2>
            <p className="text-gray-600">個人情報を特定されない範囲でスキルや経験をシステム内に公開することに同意後、PDFの保存が行えます。</p>

            <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
              <input type="checkbox" className="mt-1" checked={agreePublish} onChange={(e)=>setAgreePublish(e.target.checked)} />
              <span className="text-sm text-gray-700">スキルや経験の公開に関するご案内を確認しました。</span>
            </label>

            <div className="space-y-3">
              <button
                disabled={!agreePublish || sending}
                onClick={async ()=>{
                  setSending(true);
                  try {
                    const ok = await handleSendPdfEmail();
                    if (ok) toast.success('メールを送信しました');
                  } catch (e) {
                    toast.error('メール送信に失敗しました');
                  } finally { setSending(false); }
                }}
                className={`w-full py-3 rounded-lg border ${!agreePublish || sending ? 'bg-gray-200 text-gray-400' : 'bg-gray-700 text-white hover:bg-gray-800'}`}
              >{sending ? '送信中…' : 'メールを送信する（PDFを送付します）'}</button>

              <button
                disabled={!agreePublish || downloading}
                onClick={async ()=>{
                  setDownloading(true);
                  try { await handleDownloadPdf(); } finally { setDownloading(false); }
                }}
                className={`w-full py-3 rounded-lg border ${!agreePublish || downloading ? 'bg-gray-200 text-gray-400' : 'bg-gray-100 hover:bg-gray-200'}`}
              >{downloading ? '生成中…' : 'PDFをダウンロードする'}</button>
            </div>

            <div className="text-sm text-gray-500">「保存」を押すと、編集内容が反映されます。</div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">職歴</h2>
            {resumeData.workExperiences.map((exp, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">職歴 {index + 1}</h3>
                  {resumeData.workExperiences.length > 1 && (
                    <button
                      onClick={() => {
                        const updated = [...resumeData.workExperiences];
                        updated.splice(index, 1);
                        setResumeData(prev => ({ ...prev, workExperiences: updated }));
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      削除
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">会社名</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
                      value={exp.company}
                      onChange={(e) => {
                        const updated = [...resumeData.workExperiences];
                        updated[index].company = e.target.value;
                        setResumeData(prev => ({ ...prev, workExperiences: updated }));
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">役職</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
                      value={exp.position}
                      onChange={(e) => {
                        const updated = [...resumeData.workExperiences];
                        updated[index].position = e.target.value;
                        setResumeData(prev => ({ ...prev, workExperiences: updated }));
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">開始日</label>
                    <input
                      type="date"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
                      value={exp.startDate}
                      onChange={(e) => {
                        const updated = [...resumeData.workExperiences];
                        updated[index].startDate = e.target.value;
                        setResumeData(prev => ({ ...prev, workExperiences: updated }));
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">終了日</label>
                    <input
                      type="date"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
                      value={exp.endDate}
                      onChange={(e) => {
                        const updated = [...resumeData.workExperiences];
                        updated[index].endDate = e.target.value;
                        setResumeData(prev => ({ ...prev, workExperiences: updated }));
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">職務内容</label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
                    rows={4}
                    value={exp.description}
                    onChange={(e) => {
                      const updated = [...resumeData.workExperiences];
                      updated[index].description = e.target.value;
                      setResumeData(prev => ({ ...prev, workExperiences: updated }));
                    }}
                  />
                </div>
              </div>
            ))}
            <button
              onClick={addWorkExperience}
              className="mt-4 text-[#FF733E] hover:text-[#FF8659] font-medium"
            >
              + 職歴を追加
            </button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">スキル・資格</h2>
            <div>
              <h3 className="font-semibold mb-3">スキル</h3>
              {resumeData.skills.map((skill, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
                    value={skill}
                    onChange={(e) => {
                      const updated = [...resumeData.skills];
                      updated[index] = e.target.value;
                      setResumeData(prev => ({ ...prev, skills: updated }));
                    }}
                    placeholder="例: JavaScript"
                  />
                  {resumeData.skills.length > 1 && (
                    <button
                      onClick={() => {
                        const updated = [...resumeData.skills];
                        updated.splice(index, 1);
                        setResumeData(prev => ({ ...prev, skills: updated }));
                      }}
                      className="px-3 py-1 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setResumeData(prev => ({ ...prev, skills: [...prev.skills, ''] }))}
                className="mt-2 text-[#FF733E] hover:text-[#FF8659] font-medium"
              >
                + スキルを追加
              </button>
            </div>
            <div>
              <h3 className="font-semibold mb-3">資格</h3>
              {resumeData.certifications.map((cert, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
                    value={cert}
                    onChange={(e) => {
                      const updated = [...resumeData.certifications];
                      updated[index] = e.target.value;
                      setResumeData(prev => ({ ...prev, certifications: updated }));
                    }}
                    placeholder="例: TOEIC 800点"
                  />
                </div>
              ))}
              <button
                onClick={() => setResumeData(prev => ({ ...prev, certifications: [...prev.certifications, ''] }))}
                className="mt-2 text-[#FF733E] hover:text-[#FF8659] font-medium"
              >
                + 資格を追加
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">スキル・資格</h2>
            
            <div>
              <h3 className="font-semibold mb-3">スキル</h3>
              {resumeData.skills.map((skill, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
                    value={skill}
                    onChange={(e) => {
                      const updated = [...resumeData.skills];
                      updated[index] = e.target.value;
                      setResumeData(prev => ({ ...prev, skills: updated }));
                    }}
                    placeholder="例: JavaScript"
                  />
                  {resumeData.skills.length > 1 && (
                    <button
                      onClick={() => {
                        const updated = [...resumeData.skills];
                        updated.splice(index, 1);
                        setResumeData(prev => ({ ...prev, skills: updated }));
                      }}
                      className="px-3 py-1 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addSkill}
                className="mt-2 text-[#FF733E] hover:text-[#FF8659] font-medium"
              >
                + スキルを追加
              </button>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">資格</h3>
              {resumeData.certifications.map((cert, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
                    value={cert}
                    onChange={(e) => {
                      const updated = [...resumeData.certifications];
                      updated[index] = e.target.value;
                      setResumeData(prev => ({ ...prev, certifications: updated }));
                    }}
                    placeholder="例: TOEIC 800点"
                  />
                </div>
              ))}
              <button
                onClick={() => setResumeData(prev => ({ ...prev, certifications: [...prev.certifications, ''] }))}
                className="mt-2 text-[#FF733E] hover:text-[#FF8659] font-medium"
              >
                + 資格を追加
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // helper: build resumeData for PDF API
  const buildPdfPayload = () => {
    // step1
    const step1 = {
      name: resumeData.fullName,
      email: resumeData.email,
      phone: resumeData.phone,
      birthDate: resumeData.birthDate,
      address: resumeData.address,
    };
    // step2: education
    const step2 = { education: (resumeData.education || []).map(e => ({
      startDate: '',
      endDate: e.graduationDate || '',
      school: e.school,
    })) };
    // step3: experience
    const step3 = { experience: (resumeData.workExperiences || []).map(e => ({
      company: e.company,
      position: e.position,
      startDate: e.startDate,
      endDate: e.endDate,
      description: e.description,
    })) };
    // step4: skills
    const step4 = { skills: (resumeData.skills || []).filter(Boolean) };
    // step5: self PR
    const step5 = { selfPR: resumeData.summary || '' };
    return { step1, step2, step3, step4, step5 };
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await fetch(buildApiUrl('/resumes/download-pdf/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ resumeData: buildPdfPayload() }),
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(err?.slice(0,120) || 'PDF生成に失敗しました');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('PDFをダウンロードしました');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'PDFのダウンロードに失敗しました');
    }
  };

  const handleSendPdfEmail = async (): Promise<boolean> => {
    const payload = { resumeData: buildPdfPayload() };
    const res = await fetch(buildApiUrl('/resumes/send-pdf/'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error('send-pdf failed', res.status, t);
      toast.error('メール送信に失敗しました');
      return false;
    }
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className="flex-1 flex justify-center items-center">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-8">
        <div className="mb-8">
          <div className="text-sm text-gray-600 mb-4">
            TOP &gt; マイページ
          </div>
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-bold text-gray-900">職務経歴書編集</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentStep(5)}
                className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
              >
                プレビュー
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 border rounded-md text-[#FF733E] border-[#FF733E] hover:bg-orange-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <StepIndicator />
          
          <div className="mt-8">
            {renderStep()}
          </div>

          <div className="flex justify-between mt-12">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              className={`px-8 py-3 rounded-lg font-medium ${
                currentStep === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              disabled={currentStep === 1}
            >
              前へ
            </button>

            {currentStep < 6 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-8 py-3 bg-[#FF733E] text-white rounded-lg hover:bg-[#FF8659] font-medium"
              >
                次へ
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-[#FF733E] text-white rounded-lg hover:bg-[#FF8659] font-medium"
              >
                保存
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
