"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import { FaUsers, FaBars, FaTimes, FaSignOutAlt } from "react-icons/fa";
import { clearAuthData } from '@/utils/auth';

import AdminHeader from "@/components/admin/admin";
import useAuthV2 from '@/hooks/useAuthV2';

const queryClient = new QueryClient();

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { initializeAuth, requireAdmin, isAdmin } = useAuthV2();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // 認証・管理者チェック。非管理者はトップへ
    requireAdmin('/');
  }, [requireAdmin]);

  const handleLogout = () => {
    // Clear auth tokens or session storage as needed
    clearAuthData();
    // Optionally clear other stored data here

    // Redirect to login page or home
    router.push("/dashboard");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-full min-h-screen flex flex-col overflow-x-hidden">
        {/* Header */}
        <div className="w-full flex flex-col">
          <AdminHeader />
          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-primary-default"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>

        <div className="flex flex-1 relative">
          {/* Sidebar */}
          <aside
            className={`absolute md:static top-0 left-0 h-full md:h-auto w-[250px] bg-[#F2F2F2] z-50 transform transition-transform duration-300 ease-in-out
            ${menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
          >
            <nav className="flex flex-col gap-2 p-4 md:p-4">
              {AdminMenuOptions.map((_item) => (
                <Link
                  href={_item.url}
                  key={`admin-menu-option-${_item.label}`}
                  className={`py-3 px-3 flex flex-row items-center rounded-md cursor-pointer text-primary-default transition-colors
                    ${
                      pathname.includes(_item.url)
                        ? "bg-gray-300"
                        : "hover:bg-gray-200"
                    }`}
                  onClick={() => setMenuOpen(false)}
                >
                  <FaUsers className="w-[24px] h-[24px]" />
                  <span className="ml-4 text-base md:text-lg">{_item.label}</span>
                </Link>
              ))}

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="py-3 px-3 flex flex-row items-center rounded-md cursor-pointer text-black hover:bg-gray-200 transition-colors mt-4 w-full"
              >
                <FaSignOutAlt className="w-[24px] h-[24px]" />
                <span className="ml-4 text-base md:text-lg">ログアウト</span>
              </button>
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 px-4 py-4 md:px-[20px] md:py-[20px] overflow-x-hidden">
            {isAdmin() ? children : (
              <div className="p-6 text-center text-gray-700">権限がありません</div>
            )}
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}

const AdminMenuOptions = [
  {
    label: "求職者一覧",
    url: "/admin/seekers",
  },
  {
    label: "企業一覧",
    url: "/admin/companies",
  },
  {
    label: "分析",
    url: "/admin/analytics",
  },
];
