"use client";
import { useState, useEffect } from "react";
import PaidPlanModal from "./PaidPlanModal";

export default function ClientPaidPlanModal({
  showModal,
}: {
  showModal: boolean;
}) {
  const [open, setOpen] = useState(showModal);

  useEffect(() => {
    setOpen(showModal);
  }, [showModal]);

  return <PaidPlanModal isOpen={open} onClose={() => setOpen(false)} />;
}
