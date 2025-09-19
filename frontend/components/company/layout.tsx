"use client";

import { useEffect, useMemo, useState } from "react";
import Leftpage from "./page";
import Footer from "./footer";
import Header from "./header";
import Headertitle from "./headertitle";
import LegalComplianceModal from "./legal-compliance-modal";
import useAuthV2 from "@/hooks/useAuthV2";

const MODAL_ACK_VERSION = "20250418";

const buildAckKey = (userId: number | string) => `company_legal_ack_${MODAL_ACK_VERSION}_${userId}`;

export default function Layout({
  children
}: {
  children: React.ReactNode, headertitle: string
}) {
  const { currentUser } = useAuthV2();
  const [showLegalModal, setShowLegalModal] = useState(false);

  const ackKey = useMemo(() => {
    if (!currentUser?.id) return undefined;
    return buildAckKey(currentUser.id);
  }, [currentUser?.id]);

  useEffect(() => {
    if (!ackKey) return;
    if (typeof window === 'undefined') return;
    const alreadyAcknowledged = window.localStorage.getItem(ackKey);
    if (!alreadyAcknowledged && currentUser?.role === 'company') {
      setShowLegalModal(true);
    }
  }, [ackKey, currentUser?.role]);

  const handleAcknowledge = () => {
    if (ackKey && typeof window !== 'undefined') {
      window.localStorage.setItem(ackKey, new Date().toISOString());
    }
    setShowLegalModal(false);
  };

  return (
    <div>
      <Header />
      <Headertitle />
      <div className='bg-white flex p-9'>
      
        <div className="flex flex-col md:flex-row max-w-[1440px] w-full gap-5 mx-auto px-5">
              {/* Left side: Full width on mobile, 1/3 on md+ */}
              <div className="w-full md:w-1/3">
                <Leftpage />
              </div>
        
              {/* Right side: Full width on mobile, 2/3 on md+ */}
              <div className="w-full md:w-2/3">
                {children}
              </div>
            </div>
      
      </div>
      <Footer />
      <LegalComplianceModal isOpen={showLegalModal} onAcknowledge={handleAcknowledge} />
      {/* <FooterBar /> */}
    </div>
  )
}
