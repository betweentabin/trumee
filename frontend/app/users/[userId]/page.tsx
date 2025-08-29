'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import useAuthV2 from '@/hooks/useAuthV2';
import toast from 'react-hot-toast';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaGlobe,
  FaGithub,
  FaLinkedin,
  FaEdit,
  FaLock,
  FaUnlock,
  FaBriefcase,
  FaFileAlt
} from 'react-icons/fa';

interface ProfileData {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: string;
  profile_extension?: {
    bio: string;
    headline: string;
    profile_image_url: string;
    location: string;
    website_url: string;
    github_url: string;
    linkedin_url: string;
    available_for_work: boolean;
  };
  privacy_settings?: {
    is_profile_public: boolean;
    show_email: boolean;
    show_phone: boolean;
    show_resumes: boolean;
  };
  resumes?: Array<{
    id: string;
    title: string;
    description: string;
    is_active: boolean;
    created_at: string;
  }>;
  seeker_profile?: {
    experience_years: number;
    prefecture: string;
    current_salary?: string;
    desired_salary?: string;
  };
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  
  const { isAuthenticated, currentUser } = useAuthV2();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    fetchProfile();
  }, [userId, isAuthenticated]);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.client.get(`/users/${userId}/`);
      setProfile(response.data);
      
      // 本人かどうかチェック
      if (isAuthenticated && currentUser?.id === userId) {
        setIsOwner(true);
      }
      
      setEditData({
        full_name: response.data.full_name || '',
        phone: response.data.phone || '',
        profile_extension: {
          bio: response.data.profile_extension?.bio || '',
          headline: response.data.profile_extension?.headline || '',
          location: response.data.profile_extension?.location || '',
          website_url: response.data.profile_extension?.website_url || '',
          github_url: response.data.profile_extension?.github_url || '',
          linkedin_url: response.data.profile_extension?.linkedin_url || '',
          available_for_work: response.data.profile_extension?.available_for_work ?? true,
        },
        privacy_settings: {
          is_profile_public: response.data.privacy_settings?.is_profile_public ?? false,
          show_email: response.data.privacy_settings?.show_email ?? false,
          show_phone: response.data.privacy_settings?.show_phone ?? false,
          show_resumes: response.data.privacy_settings?.show_resumes ?? true,
        }
      });
    } catch (error: any) {
      console.error('Failed to fetch profile:', error);
      if (error.response?.status === 403) {
        toast.error('このプロフィールは非公開です');
      } else if (error.response?.status === 404) {
        toast.error('ユーザーが見つかりません');
        router.push('/');
      } else {
        toast.error('プロフィールの取得に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await apiClient.client.patch(`/users/${userId}/`, editData);
      toast.success('プロフィールを更新しました');
      setIsEditing(false);
      fetchProfile(); // 最新データを再取得
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('プロフィールの更新に失敗しました');
    }
  };

  const handlePrivacyToggle = async (field: string) => {
    const newSettings = {
      ...editData.privacy_settings,
      [field]: !editData.privacy_settings[field]
    };
    
    try {
      await apiClient.client.put(`/users/${userId}/privacy/`, newSettings);
      setEditData({
        ...editData,
        privacy_settings: newSettings
      });
      toast.success('プライバシー設定を更新しました');
      
      // プロフィール公開設定を変更した場合は再取得
      if (field === 'is_profile_public') {
        fetchProfile();
      }
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      toast.error('プライバシー設定の更新に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF733E]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">プロフィールが見つかりません</h2>
          <button
            onClick={() => router.push('/')}
            className="text-[#FF733E] hover:underline"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              {/* プロフィール画像 */}
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                {profile.profile_extension?.profile_image_url ? (
                  <img 
                    src={profile.profile_extension.profile_image_url} 
                    alt={profile.full_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <FaUser className="w-12 h-12 text-gray-400" />
                )}
              </div>
              
              {/* 基本情報 */}
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.full_name}
                    onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                    className="text-2xl font-bold mb-2 px-2 py-1 border rounded"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
                )}
                
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.profile_extension.headline}
                    onChange={(e) => setEditData({
                      ...editData,
                      profile_extension: {...editData.profile_extension, headline: e.target.value}
                    })}
                    placeholder="キャッチフレーズ"
                    className="text-gray-600 mb-2 px-2 py-1 border rounded w-full"
                  />
                ) : (
                  profile.profile_extension?.headline && (
                    <p className="text-gray-600">{profile.profile_extension.headline}</p>
                  )
                )}
                
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  {profile.profile_extension?.location && (
                    <div className="flex items-center">
                      <FaMapMarkerAlt className="mr-1" />
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.profile_extension.location}
                          onChange={(e) => setEditData({
                            ...editData,
                            profile_extension: {...editData.profile_extension, location: e.target.value}
                          })}
                          className="px-2 py-1 border rounded"
                        />
                      ) : (
                        <span>{profile.profile_extension.location}</span>
                      )}
                    </div>
                  )}
                  
                  {profile.profile_extension?.available_for_work && (
                    <div className="flex items-center">
                      <FaBriefcase className="mr-1" />
                      <span className="text-green-600">仕事を探しています</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* 編集ボタン */}
            {isOwner && (
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-[#FF733E] text-white rounded-md hover:bg-[#e9632e]"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                  >
                    <FaEdit className="mr-2" />
                    編集
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* プライバシー設定（本人のみ） */}
        {isOwner && profile.privacy_settings && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">プライバシー設定</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {editData.privacy_settings.is_profile_public ? <FaUnlock className="mr-2" /> : <FaLock className="mr-2" />}
                  <span>プロフィールを公開</span>
                </div>
                <button
                  onClick={() => handlePrivacyToggle('is_profile_public')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editData.privacy_settings.is_profile_public ? 'bg-[#FF733E]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      editData.privacy_settings.is_profile_public ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span>メールアドレスを公開</span>
                <button
                  onClick={() => handlePrivacyToggle('show_email')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editData.privacy_settings.show_email ? 'bg-[#FF733E]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      editData.privacy_settings.show_email ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span>履歴書を公開</span>
                <button
                  onClick={() => handlePrivacyToggle('show_resumes')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editData.privacy_settings.show_resumes ? 'bg-[#FF733E]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      editData.privacy_settings.show_resumes ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 自己紹介 */}
        {(profile.profile_extension?.bio || isEditing) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">自己紹介</h2>
            {isEditing ? (
              <textarea
                value={editData.profile_extension.bio}
                onChange={(e) => setEditData({
                  ...editData,
                  profile_extension: {...editData.profile_extension, bio: e.target.value}
                })}
                rows={4}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="自己紹介を入力してください"
              />
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">{profile.profile_extension.bio}</p>
            )}
          </div>
        )}

        {/* 連絡先情報 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">連絡先</h2>
          <div className="space-y-3">
            {profile.email && (
              <div className="flex items-center">
                <FaEnvelope className="mr-3 text-gray-400" />
                <span>{profile.email}</span>
              </div>
            )}
            
            {profile.phone && (
              <div className="flex items-center">
                <FaPhone className="mr-3 text-gray-400" />
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({...editData, phone: e.target.value})}
                    className="px-2 py-1 border rounded"
                  />
                ) : (
                  <span>{profile.phone}</span>
                )}
              </div>
            )}
            
            {profile.profile_extension?.website_url && (
              <div className="flex items-center">
                <FaGlobe className="mr-3 text-gray-400" />
                <a 
                  href={profile.profile_extension.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FF733E] hover:underline"
                >
                  {profile.profile_extension.website_url}
                </a>
              </div>
            )}
            
            {profile.profile_extension?.github_url && (
              <div className="flex items-center">
                <FaGithub className="mr-3 text-gray-400" />
                <a 
                  href={profile.profile_extension.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FF733E] hover:underline"
                >
                  GitHub
                </a>
              </div>
            )}
            
            {profile.profile_extension?.linkedin_url && (
              <div className="flex items-center">
                <FaLinkedin className="mr-3 text-gray-400" />
                <a 
                  href={profile.profile_extension.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FF733E] hover:underline"
                >
                  LinkedIn
                </a>
              </div>
            )}
          </div>
        </div>

        {/* 履歴書一覧 */}
        {profile.resumes && profile.resumes.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">
              <FaFileAlt className="inline mr-2" />
              履歴書
            </h2>
            <div className="space-y-3">
              {profile.resumes.map((resume) => (
                <div 
                  key={resume.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/resumes/${resume.id}`)}
                >
                  <h3 className="font-medium text-gray-900">{resume.title}</h3>
                  {resume.description && (
                    <p className="text-sm text-gray-600 mt-1">{resume.description}</p>
                  )}
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    {resume.is_active && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full mr-2">
                        公開中
                      </span>
                    )}
                    <span>作成日: {new Date(resume.created_at).toLocaleDateString('ja-JP')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}