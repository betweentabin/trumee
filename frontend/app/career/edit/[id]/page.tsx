'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
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
  jobSummary: string;
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
  const pathname = usePathname();
  const userIdFromPath = (() => {
    if (!pathname) return null;
    const parts = pathname.split('/').filter(Boolean);
    return parts[0] === 'users' && parts[1] ? parts[1] : null;
  })();
  const to = (p: string) => (userIdFromPath ? `/users/${userIdFromPath}${p}` : p);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [agreePublish, setAgreePublish] = useState(false);
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loadedFromDraft, setLoadedFromDraft] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData>({
    title: '',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    summary: '',
    jobSummary: '',
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

  // ---- Draft autosave/load (per resume id) ----
  const resumeId = String((params as any)?.id || '');
  const DRAFT_KEY = `career_edit_draft_v1_${resumeId}`;

  useEffect(() => {
    let hasDraft = false;
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(DRAFT_KEY) : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.resumeData) setResumeData(parsed.resumeData);
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
        hasDraft = true;
        setLoadedFromDraft(true);
      } else {
        setLoadedFromDraft(false);
      }
    } catch (e) {
      console.warn('Failed to load edit draft:', e);
    }
    fetchResume(!hasDraft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  const saveDraft = (message?: string) => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ resumeData, currentStep, savedAt: new Date().toISOString() })
      );
      if (message) toast.success(message);
    } catch (e) {
      console.warn('Failed to save edit draft:', e);
      if (message) toast.error('下書き保存に失敗しました');
    }
  };

  useEffect(() => {
    const id = setTimeout(() => saveDraft(), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData, currentStep]);

  const clearDraft = () => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(DRAFT_KEY);
      toast.success('下書きを削除しました');
      // 再取得して編集前の状態に戻す
      fetchResume(true);
    } catch {}
  };

  const fetchResume = async (apply: boolean = true) => {
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
        if (apply) {
          setResumeData({
            title: extra.title || '',
            fullName: extra.fullName || '',
            email: extra.email || '',
            phone: extra.phone || '',
            address: extra.address || '',
            birthDate: extra.birthDate || '',
            summary: data?.self_pr || '',
            jobSummary: extra.jobSummary || '',
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
          jobSummary: resumeData.jobSummary || '',
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
        router.push(to('/career'));
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
    const steps = ['基本情報', '職歴', 'スキル', '自己PR', '職務要約', '完了'];
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <button
              type="button"
              key={step}
              onClick={() => setCurrentStep(step)}
              className="flex-1 mx-1"
              title={`${step}へ移動`}
            >
              <div
                className={`h-2 w-full rounded ${
                  step <= currentStep ? 'bg-[#FF733E]' : 'bg-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm">
          {steps.map((label, idx) => (
            <button
              key={label}
              className={`${
                idx + 1 === currentStep ? 'font-semibold text-gray-900' : 'text-gray-600'
              } ${idx === 0 ? 'text-left' : idx === steps.length - 1 ? 'text-right' : 'text-center'} flex-1 mx-1`}
              onClick={() => setCurrentStep(idx + 1)}
            >
              {label}
            </button>
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
            <h2 className="text-2xl font-semibold mb-4">基本情報・学歴</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  タイトル
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
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
                  className="w-full p-2 border rounded-lg"
                  value={resumeData.fullName}
                  onChange={(e) => setResumeData(prev => ({ ...prev, fullName: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="w-full p-2 border rounded-lg"
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
                  className="w-full p-2 border rounded-lg"
                  value={resumeData.phone}
                  onChange={(e) => setResumeData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  生年月日
                </label>
                <input
                  type="date"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
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
                  className="w-full p-2 border rounded-lg"
                  value={resumeData.address}
                  onChange={(e) => setResumeData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
            </div>

            {/* 自己PRは後続ステップで入力 */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  希望職種
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
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
                  className="w-full p-2 border rounded-lg"
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
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">学校名</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded-lg"
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
                        className="w-full p-2 border rounded-lg"
                        value={edu.degree}
                        onChange={(e) => {
                          const updated = [...resumeData.education];
                          updated[index].degree = e.target.value;
                          setResumeData(prev => ({ ...prev, education: updated }));
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">専攻</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded-lg"
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
                        className="w-full p-2 border rounded-lg"
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
                className="w-full py-2 border-2 border-dashed border-secondary-400 rounded-lg hover:border-secondary-500"
              >
                + 学歴を追加
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">職務要約</h2>
            <textarea
              className="w-full p-4 border rounded-lg min-h-48 focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              placeholder="これまでのご経験を要約して記載してください（例：◯年の開発経験／主要実績・得意領域 など）"
              value={resumeData.jobSummary || ''}
              onChange={(e) => setResumeData(prev => ({ ...prev, jobSummary: e.target.value }))}
              rows={8}
            />
            <div className="text-sm text-gray-500">プレビューは印刷画面で確認できます（氏名や住所などの個人情報は載りません）。</div>
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
            <h2 className="text-2xl font-semibold mb-4">職歴</h2>
            {resumeData.workExperiences.map((exp, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">職歴 {index + 1}</h3>
                  {resumeData.workExperiences.length > 1 && (
                    <button
                      onClick={() => {
                        const updated = [...resumeData.workExperiences];
                        updated.splice(index, 1);
                        setResumeData(prev => ({ ...prev, workExperiences: updated }));
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      削除
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">会社名</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-lg"
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
                      className="w-full p-2 border rounded-lg"
                      value={exp.position}
                      onChange={(e) => {
                        const updated = [...resumeData.workExperiences];
                        updated[index].position = e.target.value;
                        setResumeData(prev => ({ ...prev, workExperiences: updated }));
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">開始日</label>
                    <input
                      type="month"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
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
                      type="month"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
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
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    rows={4}
                    value={exp.description}
                    onChange={(e) => {
                      const updated = [...resumeData.workExperiences];
                      updated[index].description = e.target.value;
                      setResumeData(prev => ({ ...prev, workExperiences: updated }));
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">実績（箇条書き推奨）</label>
                  {(exp.achievements || []).map((ach, i) => (
                    <input
                      key={i}
                      type="text"
                      className="w-full mb-2 p-3 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      value={ach}
                      onChange={(e) => {
                        const updated = [...(resumeData.workExperiences[index].achievements || [])];
                        updated[i] = e.target.value;
                        const we = [...resumeData.workExperiences];
                        we[index] = { ...we[index], achievements: updated };
                        setResumeData(prev => ({ ...prev, workExperiences: we }));
                      }}
                      placeholder="例：新規顧客開拓で前年比120%達成 など"
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...(resumeData.workExperiences[index].achievements || [])];
                      updated.push('');
                      const we = [...resumeData.workExperiences];
                      we[index] = { ...we[index], achievements: updated };
                      setResumeData(prev => ({ ...prev, workExperiences: we }));
                    }}
                    className="text-primary-600 text-sm"
                  >
                    + 実績を追加
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={addWorkExperience}
              className="w-full py-2 border-2 border-dashed border-secondary-400 rounded-lg hover:border-secondary-500"
            >
              + 職歴を追加
            </button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">スキル・資格</h2>
            <div>
              <h3 className="font-semibold mb-3">スキル</h3>
              {resumeData.skills.map((skill, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="flex-1 p-2 border rounded-lg"
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
                className="mt-2 text-primary-600 hover:text-primary-700"
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
                    className="flex-1 p-2 border rounded-lg"
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
                className="mt-2 text-primary-600 hover:text-primary-700"
              >
                + 資格を追加
              </button>
            </div>
          </div>
        );

case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">自己PR</h2>
            <div>
              <label className="block text-sm font-medium mb-2">自己PR</label>
              <textarea
                className="w-full p-2 border rounded-lg"
                rows={8}
                value={resumeData.summary}
                onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="あなたの強みや経験を簡潔に記載してください"
              />
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
      achievements: (e.achievements || []).filter(Boolean),
    })) };
    // step4: skills
    const step4 = { skills: (resumeData.skills || []).filter(Boolean) };
    // step5: self PR
    const step5 = {
      selfPR: resumeData.summary || '',
      jobSummary: resumeData.jobSummary || '',
    };
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">職務経歴書編集</h1>
            <div className="flex gap-2">
              <button
                onClick={() => saveDraft('下書きを保存しました')}
                className="px-4 py-2 border rounded-md text-[#FF733E] border-[#FF733E] hover:bg-orange-50"
              >
                下書き保存
              </button>
              <button
                onClick={clearDraft}
                className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100"
              >
                下書き削除
              </button>
              <button
                onClick={() => router.push(to(`/career/print?id=${params.id}`)) }
                className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
              >
                プレビュー／印刷
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

        <div className="bg-white rounded-lg shadow-md p-6">
          <StepIndicator />
          
          <div className="mt-8">
            {renderStep()}
          </div>

          {currentStep <= 6 && (
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                className={`px-6 py-2 rounded-lg ${
                  currentStep === 1
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
                disabled={currentStep === 1}
              >
                前へ
              </button>
              {currentStep < 6 ? (
                <button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="px-6 py-2 bg-[#FF733E] text-white rounded-lg hover:bg-[#FF8659]"
                >
                  次へ
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-8 py-2 bg-[#FF733E] text-white rounded-lg hover:bg-[#FF8659]"
                >
                  保存
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
