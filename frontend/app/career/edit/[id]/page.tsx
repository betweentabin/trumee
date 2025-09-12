'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FaChevronRight } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getAuthHeaders } from '@/utils/auth';

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
        setResumeData({
          title: data.title || '',
          fullName: data.fullName || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          birthDate: data.birthDate || '',
          summary: data.summary || '',
          desiredPosition: data.desiredPosition || '',
          desiredSalary: data.desiredSalary || '',
          workExperiences: data.workExperiences || [{
            company: '',
            position: '',
            startDate: '',
            endDate: '',
            description: '',
            achievements: ['']
          }],
          education: data.education || [{
            school: '',
            degree: '',
            field: '',
            graduationDate: ''
          }],
          skills: data.skills || [''],
          certifications: data.certifications || [''],
          languages: data.languages || [{ language: '', level: '' }]
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
      const response = await fetch(`${apiUrl}/api/v2/resumes/${params.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(resumeData)
      });

      if (response.ok) {
        toast.success('職務経歴書を更新しました');
        router.push('/career');
      } else {
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

  const Sidebar = () => (
    <div className="w-80 bg-white border-r border-gray-200 p-6">
      <div className="space-y-1">
        <div className="py-3 px-4 cursor-pointer hover:bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">TOP</span>
            <FaChevronRight className="text-gray-400" />
          </div>
        </div>
        <div className="py-3 px-4 cursor-pointer hover:bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">登録情報の確認・変更</span>
            <FaChevronRight className="text-gray-400" />
          </div>
        </div>
        <div className="py-3 px-4 cursor-pointer hover:bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">パスワードの変更</span>
            <FaChevronRight className="text-gray-400" />
          </div>
        </div>
        <div className="py-3 px-4 cursor-pointer hover:bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">支払い情報登録・変更</span>
            <FaChevronRight className="text-gray-400" />
          </div>
        </div>
        <div className="py-3 px-4 cursor-pointer hover:bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">有料プラン</span>
            <FaChevronRight className="text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );

  const StepIndicator = () => {
    const steps = ['基本情報', '職歴', '学歴', 'スキル'];
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                自己PR
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent"
                rows={6}
                placeholder="あなたの強みや経験を簡潔に記載してください"
                value={resumeData.summary}
                onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
              />
            </div>

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
            <h2 className="text-2xl font-bold mb-6">学歴</h2>
            {resumeData.education.map((edu, index) => (
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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 max-w-5xl mx-auto p-8">
        <div className="mb-8">
          <div className="text-sm text-gray-600 mb-4">
            TOP &gt; マイページ
          </div>
          <h1 className="text-3xl font-bold text-gray-900">職務経歴書編集</h1>
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

            {currentStep < 4 ? (
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
