'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
      const response = await fetch('http://localhost:8000/api/resumes/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(resumeData)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('職務経歴書を作成しました');
        router.push(`/career/view/${data.id}`);
      } else {
        toast.error('作成に失敗しました');
      }
    } catch (error) {
      console.error('Failed to create resume:', error);
      toast.error('エラーが発生しました');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">基本情報</h2>
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
            <div>
              <label className="block text-sm font-medium mb-2">自己PR</label>
              <textarea
                className="w-full p-2 border rounded-lg"
                rows={4}
                value={resumeData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                placeholder="あなたの強みや経験を簡潔に記載してください"
              />
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
                className="mt-2 text-blue-600 hover:text-blue-800"
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
                className="mt-2 text-blue-600 hover:text-blue-800"
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">職務経歴書作成</h1>
          <div className="flex justify-between items-center mt-4">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 mx-1 rounded ${
                  step <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className={currentStep === 1 ? 'font-semibold' : ''}>基本情報</span>
            <span className={currentStep === 2 ? 'font-semibold' : ''}>職歴</span>
            <span className={currentStep === 3 ? 'font-semibold' : ''}>学歴</span>
            <span className={currentStep === 4 ? 'font-semibold' : ''}>スキル</span>
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

            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                次へ
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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