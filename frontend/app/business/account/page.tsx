'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaBuilding, FaUser, FaEnvelope, FaPhone, FaGlobe, FaIndustry, FaSave, FaUsers } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function BusinessAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('company');
  const [companyData, setCompanyData] = useState({
    companyName: '',
    industry: '',
    employeeCount: '',
    founded: '',
    website: '',
    description: '',
    address: '',
    postalCode: '',
    prefecture: '',
    city: ''
  });
  
  const [contactData, setContactData] = useState({
    contactName: '',
    department: '',
    position: '',
    email: '',
    phone: '',
    alternateEmail: ''
  });

  useEffect(() => {
    fetchAccountData();
  }, []);

  const fetchAccountData = async () => {
    try {
      // アカウントデータの取得シミュレーション
      const mockCompanyData = {
        companyName: '株式会社テックイノベーション',
        industry: 'IT・ソフトウェア',
        employeeCount: '100-500名',
        founded: '2010',
        website: 'https://techinnovation.example.com',
        description: 'AI技術を活用したサービス開発を行っています',
        address: '渋谷1-1-1',
        postalCode: '150-0001',
        prefecture: '東京都',
        city: '渋谷区'
      };
      
      const mockContactData = {
        contactName: '山田 太郎',
        department: '人事部',
        position: '採用担当',
        email: 'yamada@techinnovation.example.com',
        phone: '03-1234-5678',
        alternateEmail: 'hr@techinnovation.example.com'
      };
      
      setCompanyData(mockCompanyData);
      setContactData(mockContactData);
    } catch (error) {
      console.error('Error fetching account data:', error);
    }
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      setTimeout(() => {
        setLoading(false);
        toast.success('企業情報を更新しました');
      }, 1000);
    } catch (error) {
      setLoading(false);
      toast.error('更新に失敗しました');
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      setTimeout(() => {
        setLoading(false);
        toast.success('担当者情報を更新しました');
      }, 1000);
    } catch (error) {
      setLoading(false);
      toast.error('更新に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaBuilding className="text-blue-600" />
            企業アカウント管理
          </h1>
          <p className="text-gray-600 mt-2">企業情報と担当者情報を管理します</p>
        </div>

        {/* タブ */}
        <div className="bg-white rounded-t-lg shadow-md">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('company')}
              className={`flex-1 px-6 py-4 font-medium transition ${
                activeTab === 'company'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FaBuilding className="inline mr-2" />
              企業情報
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`flex-1 px-6 py-4 font-medium transition ${
                activeTab === 'contact'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FaUser className="inline mr-2" />
              担当者情報
            </button>
          </div>
        </div>

        {/* 企業情報タブ */}
        {activeTab === 'company' && (
          <form onSubmit={handleCompanySubmit} className="bg-white rounded-b-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaBuilding className="inline mr-2" />
                  企業名
                </label>
                <input
                  type="text"
                  value={companyData.companyName}
                  onChange={(e) => setCompanyData({...companyData, companyName: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaIndustry className="inline mr-2" />
                  業界
                </label>
                <select
                  value={companyData.industry}
                  onChange={(e) => setCompanyData({...companyData, industry: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">選択してください</option>
                  <option value="IT・ソフトウェア">IT・ソフトウェア</option>
                  <option value="製造業">製造業</option>
                  <option value="金融">金融</option>
                  <option value="医療・福祉">医療・福祉</option>
                  <option value="教育">教育</option>
                  <option value="小売・サービス">小売・サービス</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaUsers className="inline mr-2" />
                  従業員数
                </label>
                <select
                  value={companyData.employeeCount}
                  onChange={(e) => setCompanyData({...companyData, employeeCount: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  <option value="1-10名">1-10名</option>
                  <option value="11-50名">11-50名</option>
                  <option value="51-100名">51-100名</option>
                  <option value="100-500名">100-500名</option>
                  <option value="500名以上">500名以上</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  設立年
                </label>
                <input
                  type="text"
                  value={companyData.founded}
                  onChange={(e) => setCompanyData({...companyData, founded: e.target.value})}
                  placeholder="2010"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaGlobe className="inline mr-2" />
                  Webサイト
                </label>
                <input
                  type="url"
                  value={companyData.website}
                  onChange={(e) => setCompanyData({...companyData, website: e.target.value})}
                  placeholder="https://example.com"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  企業説明
                </label>
                <textarea
                  value={companyData.description}
                  onChange={(e) => setCompanyData({...companyData, description: e.target.value})}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">所在地</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    郵便番号
                  </label>
                  <input
                    type="text"
                    value={companyData.postalCode}
                    onChange={(e) => setCompanyData({...companyData, postalCode: e.target.value})}
                    placeholder="123-4567"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    都道府県
                  </label>
                  <input
                    type="text"
                    value={companyData.prefecture}
                    onChange={(e) => setCompanyData({...companyData, prefecture: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    市区町村
                  </label>
                  <input
                    type="text"
                    value={companyData.city}
                    onChange={(e) => setCompanyData({...companyData, city: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    番地・建物名
                  </label>
                  <input
                    type="text"
                    value={companyData.address}
                    onChange={(e) => setCompanyData({...companyData, address: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center gap-2"
              >
                <FaSave />
                {loading ? '保存中...' : '変更を保存'}
              </button>
            </div>
          </form>
        )}

        {/* 担当者情報タブ */}
        {activeTab === 'contact' && (
          <form onSubmit={handleContactSubmit} className="bg-white rounded-b-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaUser className="inline mr-2" />
                  担当者名
                </label>
                <input
                  type="text"
                  value={contactData.contactName}
                  onChange={(e) => setContactData({...contactData, contactName: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  部署
                </label>
                <input
                  type="text"
                  value={contactData.department}
                  onChange={(e) => setContactData({...contactData, department: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  役職
                </label>
                <input
                  type="text"
                  value={contactData.position}
                  onChange={(e) => setContactData({...contactData, position: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaPhone className="inline mr-2" />
                  電話番号
                </label>
                <input
                  type="tel"
                  value={contactData.phone}
                  onChange={(e) => setContactData({...contactData, phone: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  value={contactData.email}
                  onChange={(e) => setContactData({...contactData, email: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  予備メールアドレス
                </label>
                <input
                  type="email"
                  value={contactData.alternateEmail}
                  onChange={(e) => setContactData({...contactData, alternateEmail: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center gap-2"
              >
                <FaSave />
                {loading ? '保存中...' : '変更を保存'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}