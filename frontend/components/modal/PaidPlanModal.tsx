"use client";
import React from "react";
import LargeModal from "./large-modal";

export default function PaidPlanModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <LargeModal isOpen={isOpen} onClose={onClose}>
      <div className="w-full flex flex-col items-center">
        <h2 className="text-3xl md:text-4xl font-medium mb-8 mt-8">
          これより先は有料プラン限定になります。
        </h2>
        <p className="text-center text-lg mb-10">
          有料プランに加入することで「プロによる職務経歴書添削」や「面接アドバイス」など、
          <br />
          転職を成功させるための強力なサポートをご利用いただけます！
        </p>
        <div className="flex flex-row gap-8 mb-12">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-36 h-36 rounded-full bg-[#4B423C] flex items-center justify-center text-white text-xl font-medium"
            >
              プラン名
            </div>
          ))}
        </div>
        <div className="flex flex-row gap-8 w-full justify-center">
          <button
            className="w-80 h-20 rounded-xl bg-[#8B8686] text-white text-2xl font-medium"
            onClick={onClose}
          >
            キャンセル
          </button>
          <button className="w-80 h-20 rounded-xl border-2 border-[#FF7A2F] text-[#FF7A2F] text-2xl font-medium bg-white">
            詳しく見る
          </button>
          <button className="w-80 h-20 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-2xl font-medium">
            有料プランに加入する
          </button>
        </div>
      </div>
    </LargeModal>
  );
}
