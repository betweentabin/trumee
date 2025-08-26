'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/app/redux/hooks';
import { updateStepData, markStepCompleted } from '@/app/redux/formSlice';
import { useUpdateProfile, useUserProfile } from '@/hooks/useApi';
import StepNavigation from '../components/StepNavigation';
import StepLayout from '../components/StepLayout';
import toast from 'react-hot-toast';

const prefectures = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

export default function Step1ProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const formState = useAppSelector(state => state.form);
  const authState = useAppSelector(state => state.auth);
  const { data: userProfile } = useUserProfile();
  const updateProfileMutation = useUpdateProfile();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    firstNameKana: '',
    lastNameKana: '',
    birthday: '',
    gender: '',
    phone: '',
    prefecture: '',
  });

  // 認証チェック
  useEffect(() => {
    if (!authState.isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authState.isAuthenticated, router]);

  // Load saved data on mount
  useEffect(() => {
    // Redux formStateから読み込み
    if (formState.stepData.profile) {
      setFormData(prev => ({
        ...prev,
        ...formState.stepData.profile,
      }));
    }
  }, [formState.stepData.profile]);

  // Load user profile from API
  useEffect(() => {
    // APIから取得したプロフィールデータを反映
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        email: userProfile.email || prev.email,
        // APIのフィールド名に合わせて調整が必要
      }));
    }
  }, [userProfile]);

  // Set initial email from auth
  useEffect(() => {
    // 認証情報から初期値設定
    if (authState.user?.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: authState.user.email }));
    }
  }, [authState.user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) newErrors.email = 'メールアドレスを入力してください';
    if (!formData.firstName) newErrors.firstName = '名を入力してください';
    if (!formData.lastName) newErrors.lastName = '姓を入力してください';
    if (!formData.firstNameKana) newErrors.firstNameKana = 'メイを入力してください';
    if (!formData.lastNameKana) newErrors.lastNameKana = 'セイを入力してください';
    if (!formData.birthday) newErrors.birthday = '生年月日を選択してください';
    if (!formData.gender) newErrors.gender = '性別を選択してください';
    if (!formData.phone) newErrors.phone = '電話番号を入力してください';
    if (!formData.prefecture) newErrors.prefecture = '都道府県を選択してください';

    // Validate kana
    if (formData.firstNameKana && !/^[ァ-ヶー　]+$/.test(formData.firstNameKana)) {
      newErrors.firstNameKana = 'カタカナで入力してください';
    }
    if (formData.lastNameKana && !/^[ァ-ヶー　]+$/.test(formData.lastNameKana)) {
      newErrors.lastNameKana = 'カタカナで入力してください';
    }

    // Validate phone
    if (formData.phone && !/^[0-9-]+$/.test(formData.phone)) {
      newErrors.phone = '有効な電話番号を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const saveToBackend = async () => {
    try {
      // APIフィールド名に変換
      const apiData = {
        full_name: `${formData.lastName} ${formData.firstName}`,
        kana: `${formData.lastNameKana} ${formData.firstNameKana}`,
        phone: formData.phone,
        gender: formData.gender === '男性' ? 'male' : formData.gender === '女性' ? 'female' : 'other',
        // SeekerProfileモデル用のデータは別途作成する必要があるかも
      };
      
      await updateProfileMutation.mutateAsync(apiData);
      return true;
    } catch (error) {
      console.error('Failed to save profile:', error);
      return false;
    }
  };

  const handleNext = async () => {
    if (validateForm()) {
      // Reduxに保存
      dispatch(updateStepData({ step: 'profile', data: formData }));
      dispatch(markStepCompleted(1));
      
      // バックエンドに保存
      const saved = await saveToBackend();
      if (saved) {
        toast.success('プロフィール情報を保存しました');
        router.push('/auth/step/step2-education');
      }
    }
  };

  const handleSave = async () => {
    if (validateForm()) {
      // Reduxに保存
      dispatch(updateStepData({ step: 'profile', data: formData }));
      
      // バックエンドに保存
      const saved = await saveToBackend();
      if (saved) {
        toast.success('プロフィール情報を保存しました');
      }
    }
  };

  return (
    <StepLayout currentStep={1} title="基本情報">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            基本情報を入力してください
          </h2>

          <div className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="example@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  姓 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.lastName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="山田"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>

              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="太郎"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>
            </div>

            {/* Kana Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="lastNameKana" className="block text-sm font-medium text-gray-700 mb-2">
                  セイ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastNameKana"
                  name="lastNameKana"
                  value={formData.lastNameKana}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.lastNameKana ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="ヤマダ"
                />
                {errors.lastNameKana && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastNameKana}</p>
                )}
              </div>

              <div>
                <label htmlFor="firstNameKana" className="block text-sm font-medium text-gray-700 mb-2">
                  メイ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstNameKana"
                  name="firstNameKana"
                  value={formData.firstNameKana}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.firstNameKana ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="タロウ"
                />
                {errors.firstNameKana && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstNameKana}</p>
                )}
              </div>
            </div>

            {/* Birthday and Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-2">
                  生年月日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="birthday"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.birthday ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.birthday && (
                  <p className="mt-1 text-sm text-red-600">{errors.birthday}</p>
                )}
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                  性別 <span className="text-red-500">*</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.gender ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">選択してください</option>
                  <option value="男性">男性</option>
                  <option value="女性">女性</option>
                  <option value="その他">その他</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                )}
              </div>
            </div>

            {/* Phone and Prefecture */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  電話番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="090-1234-5678"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="prefecture" className="block text-sm font-medium text-gray-700 mb-2">
                  都道府県 <span className="text-red-500">*</span>
                </label>
                <select
                  id="prefecture"
                  name="prefecture"
                  value={formData.prefecture}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.prefecture ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">選択してください</option>
                  {prefectures.map(pref => (
                    <option key={pref} value={pref}>{pref}</option>
                  ))}
                </select>
                {errors.prefecture && (
                  <p className="mt-1 text-sm text-red-600">{errors.prefecture}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-between">
            <button
              onClick={handleSave}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              保存
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              次へ進む
            </button>
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <StepNavigation currentStep={1} />
    </StepLayout>
  );
}