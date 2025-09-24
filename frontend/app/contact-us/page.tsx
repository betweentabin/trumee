'use client';

import { useState } from 'react';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaQuestionCircle, FaPaperPlane } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function ContactUsPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // お問い合わせ送信のシミュレーション
      setTimeout(() => {
        setLoading(false);
        toast.success('お問い合わせを送信しました。2営業日以内にご連絡いたします。');
        setFormData({
          name: '',
          email: '',
          phone: '',
          category: '',
          subject: '',
          message: ''
        });
      }, 1500);
    } catch (error) {
      setLoading(false);
      toast.error('送信に失敗しました。もう一度お試しください。');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">お問い合わせ</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            サービスに関するご質問、ご要望、不具合のご報告など、お気軽にお問い合わせください。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* お問い合わせフォーム */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold mb-6">お問い合わせフォーム</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      お名前 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      メールアドレス <span className="text-red-500">*</span>
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
                      電話番号
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="090-1234-5678"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      お問い合わせ種別 <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E]"
                      required
                    >
                      <option value="">選択してください</option>
                      <option value="service">サービスについて</option>
                      <option value="account">アカウントについて</option>
                      <option value="payment">お支払いについて</option>
                      <option value="bug">不具合の報告</option>
                      <option value="feature">機能のリクエスト</option>
                      <option value="other">その他</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      件名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      お問い合わせ内容 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#FF733E]"
                      required
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto px-8 py-3 bg-[#FF733E] text-white rounded-lg hover:bg-[#FF8659] transition disabled:bg-gray-400 flex items-center justify-center gap-2"
                  >
                    <FaPaperPlane />
                    {loading ? '送信中...' : '送信する'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* サイドバー情報 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 連絡先情報 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">お問い合わせ先</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FaEnvelope className="text-[#FF733E] mt-1" />
                  <div>
                    <p className="font-medium">メール</p>
                    <p className="text-gray-600 text-sm">support@trumeee.com</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FaPhone className="text-[#FF733E] mt-1" />
                  <div>
                    <p className="font-medium">電話</p>
                    <p className="text-gray-600 text-sm">03-1234-5678</p>
                    <p className="text-gray-500 text-xs">平日 9:00-18:00</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FaMapMarkerAlt className="text-[#FF733E] mt-1" />
                  <div>
                    <p className="font-medium">所在地</p>
                    <p className="text-gray-600 text-sm">
                      〒100-0001<br />
                      東京都千代田区千代田1-1-1
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* よくある質問 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaQuestionCircle className="text-[#FF733E]" />
                よくある質問
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-gray-800">Q: 返信までどのくらいかかりますか？</p>
                  <p className="text-sm text-gray-600 mt-1">
                    A: 通常2営業日以内にご返信いたします。
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Q: 電話での問い合わせは可能ですか？</p>
                  <p className="text-sm text-gray-600 mt-1">
                    A: 平日9:00-18:00の間で承っております。
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Q: 営業時間外の対応は？</p>
                  <p className="text-sm text-gray-600 mt-1">
                    A: フォームからのお問い合わせは24時間受け付けております。
                  </p>
                </div>
              </div>
            </div>

            {/* 注意事項 */}
            <div className="bg-orange-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">ご注意事項</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• 必須項目は必ずご入力ください</li>
                <li>• 返信は入力されたメールアドレスに送信されます</li>
                <li>• 営業メールはご遠慮ください</li>
                <li>• 個人情報は適切に管理いたします</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
