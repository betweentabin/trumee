import Image from 'next/image';
import logoMix from '@/public/logo/logo_mix.png';

const Footer = () => {

    return(
        <>
            <div className="flex p-8 flex-col justify-center items-center">
                <div className="flex items-center">
                    <Image src={logoMix} alt="Logo" className="h-10 w-10 mr-3" />
                </div>
                <div className="flex flex-col md:flex-row gap-9 mt-6 text-[14px]">
                    <a href="">マイページ</a>
                    <a href="">利用規約</a>
                    <a href="">お問い合わせ</a>
                </div>
                <div className="flex gap-9 mt-6 text-[10px]">
                <a href="https://docs.google.com/document/d/1_IejVWnELrA8757p9SPh5LtFv1w-Z5DaCxAKjfJp9QA/view" target="_blank" rel="noopener noreferrer">
                    個人情報利用許諾
                </a> 
                <a href="">特定商取引法</a>
                </div>
            </div>
            <div className="flex w-full bg-[#32291F] items-center justify-center pt-[17px] pb-[15px] ">
              <p className="text-[12px] m-0,auto text-white">© 2025 Xrosspoint Inc. All rights reserved.</p>
            </div>

        </>
    )
}

export default Footer;
