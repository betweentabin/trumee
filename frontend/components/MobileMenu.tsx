'use client';

import { useMemo, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector } from '@/app/redux/hooks';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter()
  const uid = useMemo(() => {
    try {
      if (typeof window === 'undefined') return undefined;
      const raw = localStorage.getItem('current_user_v2');
      return raw ? JSON.parse(raw)?.id : undefined;
    } catch { return undefined; }
  }, []);
  const scoutsHref = uid ? `/users/${uid}/scouts` : '/scouts';
  const applyingReasonsHref = uid ? `/users/${uid}/interview-advice/applying-reasons` : '/interview-advice/applying-reasons';
  const isAuthenticated = useAppSelector(state => state.authV2.isAuthenticated);
  const close = () => setIsOpen(false);
  const go = (href: string) => { router.push(href); close(); };
  const login = () => go('/auth/login');
  const register = () => go('/auth/register');
  const goMyPage = () => go('/users');
  return (
    <>
      {/* Bottom Fixed Bar */}
      <div className="fixed bottom-0 left-0 flex w-[100%] max-w-[768px] items-center md:hidden z-50">
        <button onClick={() => setIsOpen(true)} className="text-white h-[60px] w-[60px]  px-4 py-3 bg-[#4D433F]">
          <Menu size={24} />
        </button>
        <span className="text-white font-semibold w-[100%] h-[60px] pl-4 flex justify-center items-center bg-[#FF733E]">
          Webで簡単！添削サービスに申し込む
        </span>
      </div>

      {/* Slide Menu Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-end p-4">
          <button onClick={close}>
            <X size={24} />
          </button>
        </div>
        <nav className="flex flex-col gap-4 px-6 text-gray-800">
          <Link href="#about-us" onClick={close}>私たちについて</Link>
          <Link href="#service-flow" onClick={close}>サービスの流れ</Link>
          <Link href="#success-stories" onClick={close}>転職成功事例</Link>
          <Link href="#fee-structure" onClick={close}>料金体系</Link>
          <Link href="#FAQ" onClick={close}>FAQ</Link>

          <div className="h-px bg-gray-200 my-2" />

          {/* ワイヤーフレーム主要導線 */}
          <Link href={scoutsHref} onClick={close} className="hover:text-[#FF733E]">企業からのスカウト状況</Link>
          <Link href={applyingReasonsHref} onClick={close} className="hover:text-[#FF733E]">スカウト企業への志望理由作成補助</Link>
          <Link href="/career" onClick={close} className="hover:text-[#FF733E]">職務経歴書の添削</Link>
          <Link href="/career/print" onClick={close} className="hover:text-[#FF733E]">印刷</Link>
          <Link href="/interview-advice/prepare-interview" onClick={close} className="hover:text-[#FF733E]">面接対策</Link>

          <button onClick={register} className="bg-[#FF733E] text-white py-2 rounded-full mt-4 hover:bg-orange-70 active:bg-orange-60">
            添削サービスに申し込む
          </button>
          {isAuthenticated ? (
            <button onClick={goMyPage} className="border border-gray-500 text-gray-700 py-2 rounded-full mt-2">
              マイページ
            </button>
          ) : (
            <button onClick={login} className="border border-gray-500 text-gray-700 py-2 rounded-full mt-2">
              ログイン
            </button>
          )}
        </nav>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
