"use client"
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { useMemo } from 'react';

const Footer = () => {
    const router = useRouter()

    const register = () => {
        router.push('/auth/register')
    }
    const login = () => {
        router.push('/auth/login')
    }

    const uid = useMemo(() => {
        try {
            if (typeof window === 'undefined') return undefined;
            const raw = localStorage.getItem('current_user_v2');
            return raw ? JSON.parse(raw)?.id : undefined;
        } catch { return undefined; }
    }, []);

    const base = uid ? `/users/${uid}/myinfo` : '/users/myinfo';
    const scoutsHref = uid ? `/users/${uid}/scouts` : '/scouts';
    const applyingReasonsHref = uid ? `/users/${uid}/interview-advice/applying-reasons` : '/interview-advice/applying-reasons';
    // Deep-link to applying-reasons with focus parameters
    const resumeQuestionsHref = `${applyingReasonsHref}?focus=resume`;
    const prQuestionsHref = `${applyingReasonsHref}?focus=pr`;
    const prepareHref = uid ? `/users/${uid}/interview-advice/prepare-interview` : '/interview-advice/prepare-interview';

    return(
        <>
               <footer className="bg-[#FFF8F4] no-print text-[#4B4B4B] text-sm border-t border-gray-200">
                <div className="max-w-7xl flex flex-col mx-auto px-4 py-10">
                    {/* Logo + Left Nav */}
                    <div className="flex justify-between">
                        <div className="mb-4">                           
                            <Link href="/">
                                <img src="/logo/logo_mix.png" alt="Xrosspoint" className="h-6 mr-2 cursor-pointer" />  
                            </Link>                        
                        </div>
                        <div className="flex gap-4">
                        <button onClick={register} className="bg-[#FF733E] text-white px-4 py-2 rounded-full text-sm font-medium shadow hover:bg-[#e9632e] transition">
                        会員登録する
                        </button>
                        <button onClick={login} className="px-4 py-2 text-sm border border-gray-400 rounded-full text-black hover:bg-gray-100 transition">
                            ログイン
                        </button>
                        </div>
                    </div>

               

                    <div className="flex justify-between mt-10">
                            <div className="space-y-2">
                                <p className="font-bold">職務経歴書に関するアドバイス</p>
                                <ul className="ml-4 space-y-1">
                                <li><Link href="/career" className="hover:text-[#FF733E] transition-colors">職務経歴書の添削</Link></li>
                                <li><Link href="/career/print" className="hover:text-[#FF733E] transition-colors">印刷</Link></li>
                                </ul>
                            </div>

                            {/* 面接アドバイス */}
                            <div>
                            <p className="font-bold mb-2">面接に関するアドバイス</p>
                            <ul className="space-y-1">
                                <li><Link href={applyingReasonsHref} className="hover:text-[#FF733E] transition-colors">転職理由（志望理由）</Link></li>
                                <li><Link href={resumeQuestionsHref} className="hover:text-[#FF733E] transition-colors">職務経歴書に関する質問</Link></li>
                                <li><Link href={prQuestionsHref} className="hover:text-[#FF733E] transition-colors">自己PRに関係する質問</Link></li>
                                <li><Link href={prepareHref} className="hover:text-[#FF733E] transition-colors">面接対策</Link></li>
                            </ul>
                            </div>

                            {/* スカウト確認 */}
                            <div>
                            <p className="font-bold mb-2">企業からのスカウト確認</p>
                            <ul className="space-y-1">
                                <li><Link href={scoutsHref} className="hover:text-[#FF733E] transition-colors">企業からのスカウト状況</Link></li>
                                <li><Link href={applyingReasonsHref} className="hover:text-[#FF733E] transition-colors">スカウト企業への志望理由作成補助</Link></li>
                            </ul>
                            </div>

                            {/* マイページ */}
                            <div>
                            <p className="font-bold mb-2">マイページ</p>
                            <ul className="space-y-1">
                                <li><Link href={uid ? `/users/${uid}` : '/users'} className="hover:text-[#FF733E] transition-colors">TOP</Link></li>
                                <li><Link href={`${base}/registerdata`} className="hover:text-[#FF733E] transition-colors">基本情報の確認・変更</Link></li>
                                <li><Link href={`${base}/password`} className="hover:text-[#FF733E] transition-colors">パスワードの変更</Link></li>
                                <li><Link href={`${base}/payment`} className="hover:text-[#FF733E] transition-colors">支払い情報登録・変更</Link></li>
                                <li><Link href={`${base}/paidplans`} className="hover:text-[#FF733E] transition-colors">有料プラン</Link></li>
                            </ul>
                            </div>
                        

                        {/* 下部バー */}
                    </div>
            </div>
            <div className="bg-[#3E2E2B] text-white text-xs py-3">
                <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex space-x-4">
                    <a href="https://docs.google.com/document/d/1_IejVWnELrA8757p9SPh5LtFv1w-Z5DaCxAKjfJp9QA/view" target="_blank" rel="noopener noreferrer">
                        個人情報利用許諾
                    </a>
                    <Link href="/terms-of-use" className="hover:underline">利用規約</Link>
                     <Link href="/transaction-law" className="hover:underline">特定商取引法</Link>
                     <Link href="/contact-us" className="hover:underline">お問い合わせ</Link>
                </div>
                <div className="text-right ml-auto">
                    © 2025 Xrosspoint Inc. All rights reserved.
                </div>
                </div>
            </div>
        </footer>

        </>
    )
}

export default Footer;
