// import Link from "next/link";


const AdminHeader = () => {
    return (
        <header className="py-3 px-[20px] bg-[#FF733E] text-white relative flex flex-row justify-between items-center">
            <div className="text-xl md:text-[30px]">
                WEBアプリ管理画面
            </div>
            <div className="text-base md:text-xl flex flex-row gap-4 items-center">
                <span>
                    管理者名
                </span>
                <svg className="w-[12px] h-[11px] text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </div>
        </header>
    );
}

export default AdminHeader;