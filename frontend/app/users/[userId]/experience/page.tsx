"use client";

// Redirect wrapper so that /users/:id/experience shows the same as /users/:id/career
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import CareerPage from "@/app/career/page";

export default function UserExperienceByIdPage() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const parts = (pathname || "").split("/").filter(Boolean);
      if (parts[0] === 'users' && parts[1]) {
        router.replace(`/users/${parts[1]}/career`);
      } else {
        router.replace('/career');
      }
    } catch {
      // Fallback: render career page in-place
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render the same content as career while redirecting
  return <CareerPage />;
}
