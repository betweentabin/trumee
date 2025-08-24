'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';
import { FaSave, FaArrowLeft } from 'react-icons/fa';

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
}

export default function NewResumePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <FaArrowLeft className="mr-2" />
            戻る
          </button>
          <h1 className="text-3xl font-bold text-gray-900">新規履歴書作成</h1>
          <p className="mt-2 text-gray-600">
            あなたの経歴やスキルを詳しく記入してください
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
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-[#FF733E] text-white rounded-md hover:bg-[#e9632e] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaSave className="mr-2" />
              {loading ? '作成中...' : '作成する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}