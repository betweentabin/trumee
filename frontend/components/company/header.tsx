"use client"
import React from "react";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { clearAuthData } from '@/utils/auth';


const Header = () => {

  const router = useRouter();
  const mypage = () => {
    router.push('/companyinfo');
  }
  const logout = () => {
    clearAuthData(); // Clear all auth data
    router.push('/dashboard');        // Redirect to dashboard or login page
  };
  const search = () => {
    router.push('/company');        // Redirect to dashboard or login page

  }

    return (
      <header className="w-full bg-white shadow-md hide-under-756">
        <div className="flex items-center justify-between h-20 px-6 md:px-12 lg:px-16">
          {/* Left Logo */}
          <div className="flex items-center">
          
              <img src="/logo/logo_top.png" alt="Logo" className="h-10 w-[210px] mr-3 cursor-pointer" />
          
        </div>
      
          {/* Right Buttons */}
          <div className="flex items-center gap-4">
            <button onClick={search}>
            求職者の検索
            </button>
            <button onClick={mypage}>
            マイページ
            </button>
            <button onClick={logout} className="px-4 py-2 text-sm border border-gray-400 rounded-full text-black hover:bg-gray-100 transition">
            ログアウト
            </button>
          </div>
        </div>
      </header>
    );
  };
  
  export default Header;
  