'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { useCreateResume } from '@/hooks/useApiV2';
import useAuthV2 from '@/hooks/useAuthV2';
import { CreateResumeRequest, ExperienceFormData, EducationFormData, CertificationFormData } from '@/types/api-v2';
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
  // API v2用の詳細データ
  experiences: ExperienceFormData[];
  educations: EducationFormData[];
  certificationDetails: CertificationFormData[];
}

export default function NewResumePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [useV2API, setUseV2API] = useState(true); // API v2をデフォルトに設定
  const { isAuthenticated, initializeAuth } = useAuthV2();
  
  // localStorageにAPI v2設定を保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('useV2Api', 'true');
    }
  }, []);

  // 認証チェック
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // より堅牢な認証チェック
    const checkAuth = () => {
      // localStorageにトークンがあるか確認
      const hasStoredToken = typeof window !== 'undefined' && 
        localStorage.getItem('auth_token_v2') && 
        localStorage.getItem('drf_token_v2');
      
      if (!hasStoredToken && !isAuthenticated) {
        console.log('未認証のため、ログインページにリダイレクト');
        router.push('/auth/login');
      }
    };

    // 少し遅延して認証チェック
    const timer = setTimeout(checkAuth, 500);
    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  const createResumeV2 = useCreateResume();

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
    // API v2用の詳細データ
    experiences: [],
    educations: [],
    certificationDetails: [],
  });

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
      // API v2を使用
      const resumeData: CreateResumeRequest = {
        title: formData.title,
        description: formData.description,
        objective: formData.objective,
        skills: formData.skills,
        experiences: formData.experiences.map((exp, index) => ({
          ...exp,
          order: index,  // インデックスをorderとして設定
        })),
        educations: formData.educations.map((edu, index) => ({
          ...edu,
          order: index,  // インデックスをorderとして設定
        })),
        certifications: formData.certificationDetails.map((cert, index) => ({
          ...cert,
          order: index,  // インデックスをorderとして設定
        })),
      };

      createResumeV2.mutate(resumeData, {
        onSuccess: (response) => {
          toast.success('履歴書を作成しました (API v2)');
          router.push(`/resumes/${response.id}`);
        },
        onError: (error) => {
          console.error('Failed to create resume (v2):', error);
          toast.error('履歴書の作成に失敗しました (API v2)');
        }
      });
    } else {
      // 従来のAPIを使用
      setLoading(true);
      try {
        const response = await apiClient.createResume(formData);
        toast.success('履歴書を作成しました');
        router.push(`/resumes/${response.id}`);
      } catch (error) {
        console.error('Failed to create resume:', error);
        toast.error('履歴書の作成に失敗しました');
      } finally {
        setLoading(false);
      }
    }
  };

  // 職歴追加
  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experiences: [...prev.experiences, {
        company: '',
        period_from: '',
        period_to: '',
        employment_type: 'fulltime',
        tasks: '',
        position: '',
        business: '',
        achievements: '',
        technologies_used: [],
      }]
    }));
  };

  // 職歴削除
  const removeExperience = (index: number) => {
    setFormData(prev => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index)
    }));
  };

  // 職歴更新
  const updateExperience = (index: number, field: keyof ExperienceFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      experiences: prev.experiences.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
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
                  useV2API ? 'bg-blue-600' : 'bg-gray-300'
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
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
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
              {/* 職歴詳細セクション */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">職歴詳細</h3>
                  <button
                    type="button"
                    onClick={addExperience}
                    className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    <FaPlus className="mr-1" />
                    追加
                  </button>
                </div>
                
                {formData.experiences.map((experience, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-md mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-700">職歴 {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeExperience(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          会社名 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={experience.company}
                          onChange={(e) => updateExperience(index, 'company', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="会社名を入力"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          役職
                        </label>
                        <input
                          type="text"
                          value={experience.position || ''}
                          onChange={(e) => updateExperience(index, 'position', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="役職を入力"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          開始日
                        </label>
                        <input
                          type="date"
                          value={experience.period_from}
                          onChange={(e) => updateExperience(index, 'period_from', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          終了日
                        </label>
                        <input
                          type="date"
                          value={experience.period_to || ''}
                          onChange={(e) => updateExperience(index, 'period_to', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        業務内容
                      </label>
                      <textarea
                        value={experience.tasks}
                        onChange={(e) => updateExperience(index, 'tasks', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="担当した業務内容を記入してください"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* 学歴詳細セクション */}
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-[#FF733E] hover:bg-[#e9632e]'
              }`}
            >
              <FaSave className="mr-2" />
              {(useV2API ? createResumeV2.isPending : loading) 
                ? '作成中...' 
                : useV2API 
                  ? '作成する (API v2)' 
                  : '作成する'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}