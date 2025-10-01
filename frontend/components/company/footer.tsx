'use client'
import { useRouter } from "next/navigation";
import Link from 'next/link';

const Footer = () => {

    const router = useRouter()
    const register = () => {
        router.push('/auth/register')
    }
    const login = () => {
        router.push('/auth/login')
    }
    return(
        <>
             <footer className="bg-[#FFF8F4] no-print text-[#4B4B4B] text-sm border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col gap-10">
        {/* Top Section: Logo and Buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div className="mb-6 sm:mb-0 flex items-center">
            <Link href="/">
              <img src="/logo/logo_mix.png" alt="TruMee" className="h-6 mr-2 cursor-pointer" />
            </Link>
          </div>

          <div className="flex gap-4 justify-center sm:justify-start">
            <button
              onClick={register}
              className="bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow hover:bg-primary-700 transition"
            >
              会員登録する
            </button>
            <button
              onClick={login}
              className="px-4 py-2 text-sm rounded-full bg-secondary-900 hover:bg-secondary-800 text-white transition"
            >
              ログイン
            </button>
          </div>
        </div>

        {/* Company Links Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* 採用メニュー */}
          <div>
            <p className="font-bold mb-2">採用メニュー</p>
            <ul className="ml-4 space-y-1 list-disc">
              <li>
                <Link href="/company" className="hover:text-primary-600 transition-colors">求職者の検索</Link>
              </li>
            </ul>
          </div>

          {/* マイページ */}
          <div>
            <p className="font-bold mb-2">マイページ</p>
            <ul className="space-y-1 list-disc ml-4">
              <li><Link href="/companyinfo" className="hover:text-primary-600 transition-colors">登録情報の管理設定</Link></li>
              <li><Link href="/companyinfo/payment" className="hover:text-primary-600 transition-colors">支払い・プランの管理設定</Link></li>
              <li><Link href="/companyinfo/repassword" className="hover:text-primary-600 transition-colors">パスワードの変更</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-[#3E2E2B] text-white text-xs py-3">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap gap-4">
            <Link href="/account/personal-info-license" className="hover:underline">
              個人情報利用許諾
            </Link>
            <Link href="/terms-of-use" className="hover:underline">
              利用規約
            </Link>
            <Link href="/transaction-law" className="hover:underline">
              特定商取引法
            </Link>
            <Link href="/contact-us" className="hover:underline">
              お問い合わせ
            </Link>
          </div>
          <div className="text-right ml-auto w-full sm:w-auto">
            © 2025 Xrosspoint Inc. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
        </>
    )
}

export default Footer;
