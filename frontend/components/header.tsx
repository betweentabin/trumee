"use client"
import React from "react";
import LogoMix from '@/logo/logo_mix.png';
import Logo from '@/logo/logo.png';
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
<header className="w-full bg-white shadow-md max-[768px]:hidden">
  <div
    className="
      flex items-center justify-between 
      h-20 
      px-6 md:px-8 lg:px-12 xl:px-16 
      transition-all duration-300
    "
  >
    {/* Left Logo */}
    <div
      className="
        flex items-center 
        gap-1 max-[1330px]:gap-2 md:gap-3 
        min-w-0
      "
    >
      <img
        src={LogoMix.src}
        alt="Logo"
        className="
          h-6 max-[1330px]:h-8 md:h-10 
          w-auto 
          transition-all duration-300
          flex-shrink-0
        "
      />

    </div>

    {/* Center Nav (hide under 768px) */}
    <nav className="flex gap-6 text-sm font-medium text-gray-700 max-[768px]:hidden">
      <a href="#about-us" className="whitespace-nowrap">私たちについて</a>
      <a href="#service-flow" className="whitespace-nowrap">サービスの流れ</a>
      <a href="#success-stories" className="whitespace-nowrap">転職成功事例</a>
      <a href="#fee-structure" className="whitespace-nowrap">料金体系</a>
      <a href="#FAQ" className="whitespace-nowrap">FAQ</a>
    </nav>

    {/* Right Buttons */}
    <div className="flex items-center gap-3 md:gap-4">
      {/* Logo hidden under 1330px */}
      <img
        src={Logo.src}
        alt="Logo"
        className="h-8 md:h-10 w-auto mr-1 md:mr-2 max-[1330px]:hidden transition-all duration-300"
      />
      <button
        onClick={register}
        className="bg-[#FF733E] text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium shadow hover:bg-[#e9632e] transition max-[960px]:hidden"
      >
        添削サービスに申し込む
      </button>
      <button
        onClick={login}
        className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm border border-gray-400 rounded-full text-black hover:bg-gray-100 transition max-[1330px]:text-xs max-[1330px]:px-2 max-[1330px]:py-1"
      >
        ログイン
      </button>
    </div>
  </div>
</header>



    );
  };
  
  export default Header;
  
