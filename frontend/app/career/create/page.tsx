'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';

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

export default function CreateResumePage() {
  const router = useRouter();
  const pathname = usePathname();
  const userIdFromPath = (() => {
    if (!pathname) return null;
    const parts = pathname.split('/').filter(Boolean);
    if (parts[0] === 'users' && parts[1]) return parts[1];
    return null;
  })();
  const to = (p: string) => (userIdFromPath ? `/users/${userIdFromPath}${p}` : p);
  const [currentStep, setCurrentStep] = useState(1);
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

  const handleInputChange = (field: keyof ResumeData, value: any) => {
    setResumeData(prev => ({ ...prev, [field]: value }));
  };

  const handleWorkExperienceChange = (index: number, field: keyof WorkExperience, value: any) => {
    const updated = [...resumeData.workExperiences];
    updated[index] = { ...updated[index], [field]: value };
    setResumeData(prev => ({ ...prev, workExperiences: updated }));
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

  const removeWorkExperience = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      workExperiences: prev.workExperiences.filter((_, i) => i !== index)
    }));
  };

  const handleEducationChange = (index: number, field: keyof Education, value: any) => {
    const updated = [...resumeData.education];
    updated[index] = { ...updated[index], [field]: value };
    setResumeData(prev => ({ ...prev, education: updated }));
  };

  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, {
        school: '',
        degree: '',
        field: '',
        graduationDate: ''
      }]
    }));
  };

  const handleSkillChange = (index: number, value: string) => {
    const updated = [...resumeData.skills];
    updated[index] = value;
    setResumeData(prev => ({ ...prev, skills: updated }));
  };

  const addSkill = () => {
    setResumeData(prev => ({ ...prev, skills: [...prev.skills, ''] }));
  };

  const removeSkill = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      // バックエンドのResumeモデルに合わせてデータを変換
      const apiData = {
        desired_job: resumeData.desiredPosition || '',
        desired_industries: [],
        desired_locations: [],
        skills: resumeData.skills.filter(s => s).join(', '),
        self_pr: resumeData.summary || '',
        // 追加データをJSONFieldとして保存
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
          languages: resumeData.languages
        }
      };

      // 🚨 API呼び出しを無効化（401エラー対策）
      // const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      // const response = await fetch(`${apiUrl}/api/v2/resumes/`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify(apiData)
      // });

      // if (response.ok) {
      //   const data = await response.json();
      //   toast.success('職務経歴書を作成しました');
      //   router.push(`/career/view/${data.id}`);
      // } else {
      //   const errorData = await response.json();
      //   console.error('API Error:', errorData);
      //   toast.error(errorData.message || '作成に失敗しました');
      // }

      // ダミー応答（デバッグモード）+ localStorageに保存
      const newCareerResume = {
        id: Date.now().toString(),
        title: resumeData.title || '無題の職務経歴書',
        fullName: resumeData.fullName,
        email: resumeData.email,
        desiredPosition: resumeData.desiredPosition,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };
      
      const storedCareerResumes = localStorage.getItem('debug_career_resumes');
      const existingResumes = storedCareerResumes ? JSON.parse(storedCareerResumes) : [];
      const updatedResumes = [newCareerResume, ...existingResumes];
      localStorage.setItem('debug_career_resumes', JSON.stringify(updatedResumes));
      
      console.log('Resume data to create:', apiData);
      console.log('Saved career resume to localStorage:', newCareerResume);
      toast.success('職務経歴書を作成しました（デバッグモード）');
      router.push(to('/career'));
    } catch (error) {
      console.error('Failed to create resume:', error);
      toast.error('エラーが発生しました');
    }
  };

  // ---- Draft autosave/load ----
  const DRAFT_KEY = 'career_create_draft_v2';
  // Load draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.resumeData) setResumeData(parsed.resumeData);
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
      }
    } catch (e) {
      console.warn('Failed to load draft:', e);
    }
  }, []);
  // Autosave on change (throttled by event loop)
  const saveDraft = (message?: string) => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ resumeData, currentStep, savedAt: new Date().toISOString() })
      );
      if (message) toast.success(message);
    } catch (e) {
      console.warn('Failed to save draft:', e);
      if (message) toast.error('下書き保存に失敗しました');
    }
  };
  // Autosave when major state changes
  useEffect(() => {
    const id = setTimeout(() => saveDraft(), 0);
    return () => clearTimeout(id);
  }, [resumeData, currentStep]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      toast.success('下書きを削除しました');
    } catch {}
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">基本情報（自己PRなし）</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">タイトル</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={resumeData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="例: マーケティング職向け職務経歴書"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">氏名 *</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={resumeData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">メールアドレス *</label>
                <input
                  type="email"
                  className="w-full p-2 border rounded-lg"
                  value={resumeData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">電話番号 *</label>
                <input
                  type="tel"
                  className="w-full p-2 border rounded-lg"
                  value={resumeData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">生年月日</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded-lg"
                  value={resumeData.birthDate}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">住所</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={resumeData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">希望職種</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={resumeData.desiredPosition}
                  onChange={(e) => handleInputChange('desiredPosition', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">希望年収</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={resumeData.desiredSalary}
                  onChange={(e) => handleInputChange('desiredSalary', e.target.value)}
                  placeholder="例: 500万円〜"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">職歴</h2>
            {resumeData.workExperiences.map((exp, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">職歴 {index + 1}</h3>
                  {resumeData.workExperiences.length > 1 && (
                    <button
                      onClick={() => removeWorkExperience(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      削除
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">会社名</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-lg"
                      value={exp.company}
                      onChange={(e) => handleWorkExperienceChange(index, 'company', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">役職</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-lg"
                      value={exp.position}
                      onChange={(e) => handleWorkExperienceChange(index, 'position', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">開始日</label>
                    <input
                      type="date"
                      className="w-full p-2 border rounded-lg"
                      value={exp.startDate}
                      onChange={(e) => handleWorkExperienceChange(index, 'startDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">終了日</label>
                    <input
                      type="date"
                      className="w-full p-2 border rounded-lg"
                      value={exp.endDate}
                      onChange={(e) => handleWorkExperienceChange(index, 'endDate', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">職務内容</label>
                  <textarea
                    className="w-full p-2 border rounded-lg"
                    rows={3}
                    value={exp.description}
                    onChange={(e) => handleWorkExperienceChange(index, 'description', e.target.value)}
                  />
                </div>
              </div>
            ))}
            <button
              onClick={addWorkExperience}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400"
            >
              + 職歴を追加
            </button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">学歴</h2>
            {resumeData.education.map((edu, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">学校名</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-lg"
                      value={edu.school}
                      onChange={(e) => handleEducationChange(index, 'school', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">学位</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-lg"
                      value={edu.degree}
                      onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                      placeholder="例: 学士"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">専攻</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-lg"
                      value={edu.field}
                      onChange={(e) => handleEducationChange(index, 'field', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">卒業年月</label>
                    <input
                      type="date"
                      className="w-full p-2 border rounded-lg"
                      value={edu.graduationDate}
                      onChange={(e) => handleEducationChange(index, 'graduationDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={addEducation}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400"
            >
              + 学歴を追加
            </button>
          </div>
        );

      case 4:
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
                    onChange={(e) => handleSkillChange(index, e.target.value)}
                    placeholder="例: プロジェクトマネジメント"
                  />
                  {resumeData.skills.length > 1 && (
                    <button
                      onClick={() => removeSkill(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addSkill}
                className="mt-2 text-[#FF733E] hover:text-blue-800"
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
                className="mt-2 text-[#FF733E] hover:text-blue-800"
              >
                + 資格を追加
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">自己PR</h2>
            <div>
              <label className="block text-sm font-medium mb-2">自己PR</label>
              <textarea
                className="w-full p-2 border rounded-lg"
                rows={8}
                value={resumeData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                placeholder="あなたの強みや経験を簡潔に記載してください"
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">職務経歴（プレビュー）</h2>
            <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
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
                  {resumeData.workExperiences.map((w, i) => (
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
                  {resumeData.education.map((e, i) => (
                    <div key={i} className="border rounded p-2">
                      <div className="font-medium">{e.school || '学校名未設定'} / {e.degree || '学位未設定'}</div>
                      <div className="text-xs text-gray-500">{e.field || '専攻未設定'} / {e.graduationDate || '卒業年月未設定'}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500">スキル</span>
                <div className="mt-1 text-sm">{resumeData.skills.filter(Boolean).join(', ') || '（未入力）'}</div>
              </div>
            </div>
            <div className="text-sm text-gray-500">この内容で「作成する」を押すと保存されます。</div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">職務経歴書作成</h1>
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
            </div>
          </div>
          {/* Clickable Stepper: 6 steps */}
          <div className="flex justify-between items-center mt-6">
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
            <button className={`text-left flex-1 mx-1 ${currentStep === 1 ? 'font-semibold text-gray-900' : 'text-gray-600'}`} onClick={() => setCurrentStep(1)}>基本情報</button>
            <button className={`text-center flex-1 mx-1 ${currentStep === 2 ? 'font-semibold text-gray-900' : 'text-gray-600'}`} onClick={() => setCurrentStep(2)}>職歴</button>
            <button className={`text-center flex-1 mx-1 ${currentStep === 3 ? 'font-semibold text-gray-900' : 'text-gray-600'}`} onClick={() => setCurrentStep(3)}>学歴</button>
            <button className={`text-center flex-1 mx-1 ${currentStep === 4 ? 'font-semibold text-gray-900' : 'text-gray-600'}`} onClick={() => setCurrentStep(4)}>スキル</button>
            <button className={`text-center flex-1 mx-1 ${currentStep === 5 ? 'font-semibold text-gray-900' : 'text-gray-600'}`} onClick={() => setCurrentStep(5)}>自己PR</button>
            <button className={`text-right flex-1 mx-1 ${currentStep === 6 ? 'font-semibold text-gray-900' : 'text-gray-600'}`} onClick={() => setCurrentStep(6)}>職務経歴</button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {renderStep()}

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
                onClick={() => setCurrentStep(prev => Math.min(6, prev + 1))}
                className="px-6 py-2 bg-[#FF733E] text-white rounded-lg hover:bg-[#FF8659]"
              >
                次へ
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-8 py-2 bg-[#FF733E] text-white rounded-lg hover:bg-[#FF8659]"
              >
                作成する
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
