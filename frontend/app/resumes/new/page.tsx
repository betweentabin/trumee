'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-v2-client';
import useAuthV2 from '@/hooks/useAuthV2';
import { EducationFormData, CertificationFormData } from '@/types/api-v2';
import { ExperienceDraft, PreferenceDraft, ResumeDraft } from '@/features/resume/form/types';
import ResumeExperiencesForm, { ResumeExperiencesFormHandle } from '@/features/resume/form/ResumeExperiencesForm';
import ResumePreferencesForm, { ResumePreferencesFormHandle } from '@/features/resume/form/ResumePreferencesForm';
import { saveResumeDraft } from '@/features/resume/form/api';
import toast from 'react-hot-toast';
import { FaSave, FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';

interface ResumeFormData {
  title: string;
  description: string;
  objective: string;
  skills: string;
  education: string;
  certifications: string;
  languages: string;
  hobbies: string;
  is_active: boolean;
  educations: EducationFormData[];
  certificationDetails: CertificationFormData[];
}

export default function NewResumePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [useV2API, setUseV2API] = useState(true); // API v2をデフォルトに設定
  const { isAuthenticated, initializeAuth } = useAuthV2();
  
  // ページ読み込み時の初期化
  useEffect(() => {
    console.log('📝 New resume: Loading without auth checks');
    if (typeof window !== 'undefined') {
      localStorage.setItem('useV2Api', 'true');
    }
  }, []); // routerを依存配列から除外

  const [formData, setFormData] = useState<ResumeFormData>({
    title: '',
    description: '',
    objective: '',
    skills: '',
    education: '',
    certifications: '',
    languages: '',
    hobbies: '',
    is_active: false,
    educations: [],
    certificationDetails: [],
  });

  const [experiences, setExperiences] = useState<ExperienceDraft[]>([
    {
      id: 1,
      company: '',
      periodFrom: '',
      periodTo: '',
      employmentType: 'fulltime',
      business: '',
      capital: '',
      teamSize: '',
      tasks: '',
      position: '',
      industry: '',
    },
  ]);

  const [preference, setPreference] = useState<PreferenceDraft>({
    desiredSalary: '',
    desiredIndustries: [],
    desiredJobTypes: [],
    desiredLocations: [],
    workStyle: '',
    availableDate: '',
  });

  const experiencesRef = useRef<ResumeExperiencesFormHandle>(null);
  const preferenceRef = useRef<ResumePreferencesFormHandle>(null);

  const handleExperiencesChange = (next: ExperienceDraft[]) => {
    setExperiences(next);
  };

  const handlePreferenceChange = (next: PreferenceDraft) => {
    setPreference(next);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast.error('タイトルを入力してください');
      return;
    }

    if (useV2API) {
      const validExperiences = experiencesRef.current?.validate() ?? true;
      const validPreference = preferenceRef.current?.validate() ?? true;
      if (!validExperiences || !validPreference) {
        return;
      }

      const draft: ResumeDraft = {
        title: formData.title,
        description: formData.description,
        objective: formData.objective,
        skills: formData.skills,
        selfPr: '',
        isActive: formData.is_active,
        experiences,
        preference,
        educations: formData.educations,
        certifications: formData.certificationDetails,
      };

      try {
        setLoading(true);
        await saveResumeDraft(draft);
        toast.success('履歴書を作成しました');
        router.push('/resumes');
      } catch (error: any) {
        console.error('Failed to create resume:', error);
        toast.error('履歴書の作成に失敗しました');
        if (error?.response?.status === 401) {
          router.push('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    } else {
      // 従来のAPIもDRFトークンで呼び出し
      setLoading(true);
      try {
        const legacyExperiences = experiences.map((exp) => ({
          company: exp.company,
          period_from: exp.periodFrom,
          period_to: exp.periodTo || undefined,
          employment_type: exp.employmentType,
          position: exp.position,
          business: exp.business,
          capital: exp.capital,
          team_size: exp.teamSize,
          tasks: exp.tasks,
          industry: exp.industry,
          achievements: '',
          technologies_used: [],
        }));
        const resumeData: any = {
          ...formData,
          experiences: legacyExperiences,
        };
        const response = await apiClient.createResume(resumeData);
        toast.success('履歴書を作成しました');
        router.push('/resumes');
      } catch (error: any) {
        console.error('Failed to create resume:', error);
        if (error.response?.status === 401) {
          toast.error('ログインが必要です');
          router.push('/auth/login');
        } else {
          toast.error('履歴書の作成に失敗しました');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // 学歴追加
  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      educations: [...prev.educations, {
        school_name: '',
        faculty: '',
        major: '',
        graduation_date: '',
        education_type: 'university',
      }]
    }));
  };

  // 学歴削除
  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      educations: prev.educations.filter((_, i) => i !== index)
    }));
  };

  // 学歴更新
  const updateEducation = (index: number, field: keyof EducationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      educations: prev.educations.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  // 資格追加
  const addCertification = () => {
    setFormData(prev => ({
      ...prev,
      certificationDetails: [...prev.certificationDetails, {
        name: '',
        issuer: '',
        obtained_date: '',
        expiry_date: '',
      }]
    }));
  };

  // 資格削除
  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certificationDetails: prev.certificationDetails.filter((_, i) => i !== index)
    }));
  };

  // 資格更新
  const updateCertification = (index: number, field: keyof CertificationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      certificationDetails: prev.certificationDetails.map((cert, i) => 
        i === index ? { ...cert, [field]: value } : cert
      )
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <FaArrowLeft className="mr-2" />
              戻る
            </button>
            
            {/* API v2 切り替えコントロール */}
            <div className="flex items-center space-x-3 bg-white rounded-lg shadow px-4 py-2">
              <span className="text-sm text-gray-600">API v1</span>
              <button
                type="button"
                onClick={() => setUseV2API(!useV2API)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  useV2API ? 'bg-[#FF733E]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useV2API ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-600">API v2</span>
              {useV2API && (
                <span className="bg-orange-100 text-[#FF733E] text-xs px-2 py-1 rounded-full">
                  🧪 拡張機能
                </span>
              )}
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">新規履歴書作成</h1>
          <p className="mt-2 text-gray-600">
            {useV2API 
              ? 'API v2で職歴・学歴・資格を詳細に管理できます' 
              : 'あなたの経歴やスキルを詳しく記入してください'
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF733E] focus:border-[#FF733E]"
              placeholder="例: エンジニア向け履歴書"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              概要
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF733E] focus:border-[#FF733E]"
              placeholder="履歴書の概要を記入してください"
            />
          </div>

          {/* Objective */}
          <div>
            <label htmlFor="objective" className="block text-sm font-medium text-gray-700 mb-2">
              志望動機・目標
            </label>
            <textarea
              id="objective"
              name="objective"
              value={formData.objective}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF733E] focus:border-[#FF733E]"
              placeholder="あなたのキャリア目標や志望動機を記入してください"
            />
          </div>

          {/* Skills */}
          <div>
            <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
              スキル・技術
            </label>
            <textarea
              id="skills"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF733E] focus:border-[#FF733E]"
              placeholder="例: JavaScript, React, Node.js, Python, AWS"
            />
          </div>

          {/* Education */}
          <div>
            <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-2">
              学歴
            </label>
            <textarea
              id="education"
              name="education"
              value={formData.education}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF733E] focus:border-[#FF733E]"
              placeholder="最終学歴を記入してください"
            />
          </div>

          {/* Certifications */}
          <div>
            <label htmlFor="certifications" className="block text-sm font-medium text-gray-700 mb-2">
              資格・認定
            </label>
            <textarea
              id="certifications"
              name="certifications"
              value={formData.certifications}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF733E] focus:border-[#FF733E]"
              placeholder="保有資格を記入してください"
            />
          </div>

          {/* Languages */}
          <div>
            <label htmlFor="languages" className="block text-sm font-medium text-gray-700 mb-2">
              言語スキル
            </label>
            <input
              type="text"
              id="languages"
              name="languages"
              value={formData.languages}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF733E] focus:border-[#FF733E]"
              placeholder="例: 日本語（ネイティブ）、英語（ビジネスレベル）"
            />
          </div>

          {/* API v2 詳細フォーム */}
      {useV2API && (
        <>
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">職歴詳細</h3>
            <ResumeExperiencesForm ref={experiencesRef} value={experiences} onChange={handleExperiencesChange} />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">希望条件</h3>
            <ResumePreferencesForm ref={preferenceRef} value={preference} onChange={handlePreferenceChange} />
          </div>

          {/* 学歴詳細セクション */}          {/* 学歴詳細セクション */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">学歴詳細</h3>
                  <button
                    type="button"
                    onClick={addEducation}
                    className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                  >
                    <FaPlus className="mr-1" />
                    追加
                  </button>
                </div>
                
                {formData.educations.map((education, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-md mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-700">学歴 {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeEducation(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          学校名 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={education.school_name}
                          onChange={(e) => updateEducation(index, 'school_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF733E] focus:border-[#FF733E]"
                          placeholder="学校名を入力"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          学部・学科
                        </label>
                        <input
                          type="text"
                          value={education.faculty || ''}
                          onChange={(e) => updateEducation(index, 'faculty', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF733E] focus:border-[#FF733E]"
                          placeholder="学部・学科を入力"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          専攻
                        </label>
                        <input
                          type="text"
                          value={education.major || ''}
                          onChange={(e) => updateEducation(index, 'major', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF733E] focus:border-[#FF733E]"
                          placeholder="専攻を入力"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          卒業日
                        </label>
                        <input
                          type="date"
                          value={education.graduation_date || ''}
                          onChange={(e) => updateEducation(index, 'graduation_date', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF733E] focus:border-[#FF733E]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 資格詳細セクション */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">資格詳細</h3>
                  <button
                    type="button"
                    onClick={addCertification}
                    className="inline-flex items-center px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
                  >
                    <FaPlus className="mr-1" />
                    追加
                  </button>
                </div>
                
                {formData.certificationDetails.map((certification, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-md mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-700">資格 {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeCertification(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          資格名 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={certification.name}
                          onChange={(e) => updateCertification(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF733E] focus:border-[#FF733E]"
                          placeholder="資格名を入力"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          発行機関
                        </label>
                        <input
                          type="text"
                          value={certification.issuer || ''}
                          onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF733E] focus:border-[#FF733E]"
                          placeholder="発行機関を入力"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          取得日
                        </label>
                        <input
                          type="date"
                          value={certification.obtained_date || ''}
                          onChange={(e) => updateCertification(index, 'obtained_date', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF733E] focus:border-[#FF733E]"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          有効期限
                        </label>
                        <input
                          type="date"
                          value={certification.expiry_date || ''}
                          onChange={(e) => updateCertification(index, 'expiry_date', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF733E] focus:border-[#FF733E]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Hobbies */}
          <div>
            <label htmlFor="hobbies" className="block text-sm font-medium text-gray-700 mb-2">
              趣味・興味
            </label>
            <input
              type="text"
              id="hobbies"
              name="hobbies"
              value={formData.hobbies}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF733E] focus:border-[#FF733E]"
              placeholder="例: プログラミング、読書、スポーツ"
            />
          </div>

          {/* Is Active */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-[#FF733E] focus:ring-[#FF733E] border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
              この履歴書を有効にする（企業に公開）
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={useV2API ? createResumeV2.isPending : loading}
              className={`inline-flex items-center px-4 py-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
                useV2API 
                  ? 'bg-[#FF733E] hover:bg-[#FF8659]' 
                  : 'bg-[#FF733E] hover:bg-[#e9632e]'
              }`}
            >
              <FaSave className="mr-2" />
              {(useV2API ? createResumeV2.isPending : loading) 
                ? '作成中...' 
                : useV2API 
                  ? '作成する (DRF認証)' 
                  : '作成する'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
