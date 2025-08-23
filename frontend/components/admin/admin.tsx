// import Link from "next/link";
import DownIcon from "@/assets/svg/down.svg";

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
                <DownIcon className="w-[12px] h-[11px] text-white" />
            </div>
        </header>
    );
}

export default AdminHeader;