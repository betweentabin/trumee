"use client"
import React from "react";
import { useRouter } from 'next/navigation';


const Header = () => {

  const router = useRouter();
  const login = () => {
    router.push('/auth/login');
  }
  const register = () => {
    router.push('/auth/register');
  }

    return (
      <header className="w-full bg-white shadow-md hide-under-756">
        <div className="flex items-center justify-between h-20 px-6 md:px-12 lg:px-16">
          {/* Left Logo */}
          <div className="flex items-center">
            <img src="/logo/logo_top.png" alt="Logo" className="h-10 w-[210px] mr-3" />
            {/* <p className="text-2xl font-semibold">Trumee</p> */}
          </div>
  
          {/* Right Logo and Buttons */}
          <div className="flex items-center gap-4">
            {/* Right Logo */}
            <div className="flex items-center">
              <img src="/logo/logo_mix.png" alt="Trumee Logo" className="h-8 w-auto mr-3" />
            </div>
            
            {/* Buttons */}
            <button onClick={login} className="px-4 py-2 text-sm rounded-full bg-secondary-900 hover:bg-secondary-800 text-white transition">
              ログイン
            </button>
            <button onClick={register} className="bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow hover:bg-primary-700 transition">
              登録する
            </button>
          </div>
        </div>
      </header>
    );
  };
  
  export default Header;
  
