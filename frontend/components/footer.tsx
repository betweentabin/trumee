import Link from 'next/link';

const Footer = () => {

    return(
        <>
            <div className="flex p-8 flex-col justify-center items-center">
                <div className="flex items-center">
                    <Link href="/">
                        <img src="/logo/logo_mix.png" alt="Logo" className="h-10 w-10 mr-3 cursor-pointer" />
                    </Link>
                </div>
                <div className="flex flex-col md:flex-row gap-9 mt-6 text-[14px]">
                    <Link href="/users" className="hover:text-primary-600 transition-colors">マイページ</Link>
                    <Link href="/terms-of-use" className="hover:text-primary-600 transition-colors">利用規約</Link>
                    <Link href="/contact-us" className="hover:text-primary-600 transition-colors">お問い合わせ</Link>
                </div>
                <div className="flex gap-9 mt-6 text-[10px]">
                <Link href="/account/personal-info-license" className="hover:text-primary-600 transition-colors">
                    個人情報利用許諾
                </Link> 
                <Link href="/transaction-law" className="hover:text-primary-600 transition-colors">特定商取引法</Link>
                </div>
            </div>
            <div className="flex w-full bg-[#32291F] items-center justify-center pt-[17px] pb-[15px] ">
              <p className="text-[12px] m-0,auto text-white">© 2025 Xrosspoint Inc. All rights reserved.</p>
            </div>

        </>
    )
}

export default Footer;
