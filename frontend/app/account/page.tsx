'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/app/redux/hooks';
import { FaUser, FaEnvelope, FaPhone, FaBirthdayCake, FaMapMarkerAlt, FaSave } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function AccountPage() {
  const router = useRouter();
  const authState = useAppSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
    postalCode: '',
    prefecture: '',
    city: '',
    address: '',
    gender: '',
    currentEmployment: ''
  });

  useEffect(() => {
    if (!authState.isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchUserData();
  }, [authState, router]);

  const fetchUserData = async () => {
    try {
      // ユーザーデータの取得
      const mockData = {
        fullName: '山田 太郎',
        email: 'yamada@example.com',
        phone: '090-1234-5678',
        birthDate: '1990-01-01',
        postalCode: '100-0001',
        prefecture: '東京都',
        city: '千代田区',
        address: '千代田1-1-1',
        gender: 'male',
        currentEmployment: 'employed'
      };
      setFormData(mockData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // API呼び出しのシミュレーション
      setTimeout(() => {
        setLoading(false);
        toast.success('基本情報を更新しました');
      }, 1000);
    } catch (error) {
      setLoading(false);
      toast.error('更新に失敗しました');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaUser className="text-[#FF733E]" />
            基本情報の確認・変更
          </h1>
          <p className="text-gray-600 mt-2">アカウント情報を確認・更新できます</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaUser className="inline mr-2" />
                氏名
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaEnvelope className="inline mr-2" />
                メールアドレス
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaPhone className="inline mr-2" />
                電話番号
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaBirthdayCake className="inline mr-2" />
                生年月日
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                性別
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E]"
              >
                <option value="">選択してください</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">その他</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                現在の就業状況
              </label>
              <select
                name="currentEmployment"
                value={formData.currentEmployment}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E]"
              >
                <option value="">選択してください</option>
                <option value="employed">在職中</option>
                <option value="unemployed">離職中</option>
                <option value="student">学生</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaMapMarkerAlt className="text-gray-600" />
              住所情報
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  郵便番号
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="123-4567"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  都道府県
                </label>
                <input
                  type="text"
                  name="prefecture"
                  value={formData.prefecture}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  市区町村
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  番地・建物名
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E]"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#FF733E] text-white rounded-lg hover:bg-[#FF8659] transition disabled:bg-gray-400 flex items-center gap-2"
            >
              <FaSave />
              {loading ? '保存中...' : '変更を保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}