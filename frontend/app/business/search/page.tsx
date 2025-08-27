'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch, FaFilter, FaUser, FaBriefcase, FaMapMarkerAlt, FaGraduationCap, FaStar } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface Seeker {
  id: string;
  name: string;
  age: number;
  experience: string;
  skills: string[];
  education: string;
  location: string;
  desiredSalary: string;
  availability: string;
  matchScore: number;
}

export default function BusinessSearchPage() {
  const router = useRouter();
  const [seekers, setSeekers] = useState<Seeker[]>([]);
  const [filteredSeekers, setFilteredSeekers] = useState<Seeker[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    keyword: '',
    location: '',
    experience: '',
    skills: '',
    minSalary: '',
    maxSalary: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchSeekers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, seekers]);

  const fetchSeekers = async () => {
    try {
      // 求職者データの取得シミュレーション
      setTimeout(() => {
        const mockSeekers: Seeker[] = [
          {
            id: '1',
            name: '田中 太郎',
            age: 28,
            experience: 'Webエンジニア 5年',
            skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
            education: '情報工学部卒',
            location: '東京都',
            desiredSalary: '500-700万円',
            availability: '即日可能',
            matchScore: 95
          },
          {
            id: '2',
            name: '佐藤 花子',
            age: 32,
            experience: 'プロジェクトマネージャー 8年',
            skills: ['プロジェクト管理', 'アジャイル', 'リーダーシップ'],
            education: '経営学部卒',
            location: '神奈川県',
            desiredSalary: '700-900万円',
            availability: '1ヶ月後',
            matchScore: 88
          },
          {
            id: '3',
            name: '鈴木 次郎',
            age: 25,
            experience: 'フロントエンドエンジニア 3年',
            skills: ['Vue.js', 'JavaScript', 'CSS', 'UI/UX'],
            education: 'デザイン学部卒',
            location: '大阪府',
            desiredSalary: '400-550万円',
            availability: '2週間後',
            matchScore: 82
          }
        ];
        setSeekers(mockSeekers);
        setFilteredSeekers(mockSeekers);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching seekers:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...seekers];

    if (filters.keyword) {
      filtered = filtered.filter(seeker => 
        seeker.name.includes(filters.keyword) ||
        seeker.experience.includes(filters.keyword) ||
        seeker.skills.some(skill => skill.includes(filters.keyword))
      );
    }

    if (filters.location) {
      filtered = filtered.filter(seeker => 
        seeker.location.includes(filters.location)
      );
    }

    if (filters.experience) {
      filtered = filtered.filter(seeker => 
        seeker.experience.includes(filters.experience)
      );
    }

    if (filters.skills) {
      filtered = filtered.filter(seeker => 
        seeker.skills.some(skill => 
          skill.toLowerCase().includes(filters.skills.toLowerCase())
        )
      );
    }

    setFilteredSeekers(filtered);
  };

  const handleScout = (seekerId: string) => {
    toast.success('スカウトメッセージ画面へ移動します');
    router.push(`/business/scout/${seekerId}`);
  };

  const handleViewDetails = (seekerId: string) => {
    router.push(`/business/seeker/${seekerId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaSearch className="text-blue-600" />
            求職者の検索
          </h1>
          <p className="text-gray-600 mt-2">条件に合う求職者を見つけてスカウトしましょう</p>
        </div>

        {/* 検索バー */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="キーワードで検索（スキル、職種など）"
                value={filters.keyword}
                onChange={(e) => setFilters({...filters, keyword: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
            >
              <FaFilter />
              詳細検索
            </button>
            <button
              onClick={applyFilters}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <FaSearch />
              検索
            </button>
          </div>

          {/* 詳細フィルター */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    勤務地
                  </label>
                  <input
                    type="text"
                    placeholder="東京都"
                    value={filters.location}
                    onChange={(e) => setFilters({...filters, location: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    経験
                  </label>
                  <input
                    type="text"
                    placeholder="エンジニア"
                    value={filters.experience}
                    onChange={(e) => setFilters({...filters, experience: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    スキル
                  </label>
                  <input
                    type="text"
                    placeholder="React"
                    value={filters.skills}
                    onChange={(e) => setFilters({...filters, skills: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 検索結果 */}
        <div className="mb-4 flex justify-between items-center">
          <p className="text-gray-600">
            {filteredSeekers.length}件の求職者が見つかりました
          </p>
          <select className="p-2 border border-gray-300 rounded-lg">
            <option>マッチ度順</option>
            <option>登録日順</option>
            <option>更新日順</option>
          </select>
        </div>

        {/* 求職者カード */}
        <div className="space-y-4">
          {filteredSeekers.map((seeker) => (
            <div key={seeker.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                    <FaUser className="text-gray-400 text-3xl" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{seeker.name}</h3>
                      <span className="text-gray-600">{seeker.age}歳</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        {seeker.availability}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-gray-600">
                      <p className="flex items-center gap-2">
                        <FaBriefcase className="text-gray-400" />
                        {seeker.experience}
                      </p>
                      <p className="flex items-center gap-2">
                        <FaGraduationCap className="text-gray-400" />
                        {seeker.education}
                      </p>
                      <p className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-gray-400" />
                        {seeker.location}
                      </p>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">スキル:</p>
                      <div className="flex flex-wrap gap-2">
                        {seeker.skills.map((skill, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-gray-600">
                        希望年収: <span className="font-medium">{seeker.desiredSalary}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="mb-3">
                    <div className="text-3xl font-bold text-blue-600">{seeker.matchScore}%</div>
                    <p className="text-sm text-gray-600">マッチ度</p>
                    <div className="flex justify-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={i < Math.floor(seeker.matchScore / 20) 
                            ? 'text-yellow-400' 
                            : 'text-gray-300'}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => handleViewDetails(seeker.id)}
                      className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                    >
                      詳細を見る
                    </button>
                    <button
                      onClick={() => handleScout(seeker.id)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      スカウトする
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}