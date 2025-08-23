import React from "react";
import { getJobTypeNames } from "../helpers/jobTypeHelper";
import dayjs from "dayjs";

const MemberInformationTab = ({ seeker, userData, scoutBusinessesData }: any) => (
  <div className="w-full min-h-full flex flex-col items-center bg-white p-4 sm:p-6 md:p-8">
    {/* Top: Member Summary Card */}
    <div className="w-full max-w-7xl bg-white rounded-xl border border-gray-300 shadow p-6 sm:p-8 mb-8">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
        {/* Profile Icon */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-3xl font-bold text-white mb-2">
            {userData?.first_name?.[0] || "?"}
          </div>
          <div className="text-xs text-center sm:text-left text-gray-500 whitespace-pre-line">
            最終ログイン日
            <br />
            ・
            {userData?.created_At
              ? new Date(userData?.created_At).toLocaleDateString("ja-JP")
              : "-"}
          </div>
        </div>
        {/* Member Info */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 w-full text-center sm:text-left">
          <div className="col-span-1 sm:col-span-2 text-2xl font-bold mb-1 truncate">
            {userData?.first_name || ""} {userData?.last_name || ""}
          </div>
          <div className="text-base">
            {userData?.birthday
              ? `${dayjs().diff(dayjs(userData.birthday), "year")}歳`
              : "-"}
            男性/在職中
          </div>
          {/* Uncomment if needed */}
          {/* <div className="text-base">
            職業:{" "}
            <span className="font-bold">
              {getJobTypeNames(seeker.occupation) || "-"}
            </span>
          </div>
          <div className="text-base">
            希望職種:{" "}
            <span className="font-bold">
              {getJobTypeNames(seeker.desired_occupation) || "-"}
            </span>
          </div> */}
          <div className="text-base">
            登録日:{" "}
            <span className="font-bold">
              {userData?.created_At
                ? new Date(userData.created_At).toLocaleDateString("ja-JP")
                : "-"}
            </span>
          </div>
          {/* <div className="text-base">
            最終ログイン:{" "}
            <span className="font-bold">
              {seeker.user?.loginAt
                ? new Date(seeker.user.loginAt).toLocaleDateString("ja-JP")
                : "-"}
            </span>
          </div> */}
          <div className="text-base col-span-1 sm:col-span-2 font-semibold">
            {userData.status === true ? "対応済" : "未対応"}
          </div>
        </div>
      </div>
    </div>

    {/* Middle: Approached Companies Table */}
    <div className="w-full max-w-7xl bg-white rounded-xl border border-gray-300 shadow p-4 sm:p-6 mb-8 overflow-x-auto">
      <div className="font-bold mb-4 text-lg">アプローチされた会社名</div>
      <table className="w-full text-base border-collapse min-w-[600px] sm:min-w-full">
        <thead>
          <tr className="bg-[#F5F5F5]">
            <th className="border border-gray-300 px-3 py-2 text-left">会社名</th>
            <th className="border border-gray-300 px-3 py-2 text-center">スカウト</th>
            <th className="border border-gray-300 px-3 py-2 text-left">スカウト内容</th>
            <th className="border border-gray-300 px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {(scoutBusinessesData?.list || []).map((company: any, idx: number) => (
            <tr key={company.id || idx} className="text-center hover:bg-gray-50">
              <td className="border border-gray-300 px-3 py-2 text-left whitespace-nowrap">
                {company.user?.companyName || "会社名"}
              </td>
              <td className="border border-gray-300 px-3 py-2">{company.scouts?.length ? "●" : "×"}</td>
              <td className="border border-gray-300 px-3 py-2 text-left whitespace-normal">
                スカウト状況が記載されます
              </td>
              <td className="border border-gray-300 px-3 py-2 text-right whitespace-nowrap cursor-pointer select-none">
                <span className="inline-block w-6 h-6 text-xl">→</span>
              </td>
            </tr>
          ))}
          {(!scoutBusinessesData?.list || scoutBusinessesData.list.length === 0) && (
            <tr>
              <td className="border border-gray-300 px-3 py-2 text-center" colSpan={4}>
                データがありません
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {/* Bottom: Company Message Table */}
    <div className="w-full max-w-7xl bg-white rounded-xl border border-gray-300 shadow p-4 sm:p-6 overflow-x-auto">
      <table className="w-full text-base border-collapse min-w-[600px] sm:min-w-full">
        <tbody>
          <tr className="bg-[#F5F5F5]">
            <th className="border border-gray-300 px-3 py-2 text-left">会社名</th>
            <th className="border border-gray-300 px-3 py-2 text-left">会社名が入ります。</th>
          </tr>
          <tr>
            <td className="border border-gray-300 px-3 py-2 text-left">タイトル</td>
            <td className="border border-gray-300 px-3 py-2 text-left">タイトルが入ります。</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-3 py-2 text-left">メッセージ</td>
            <td className="border border-gray-300 px-3 py-2 text-left">メッセージが入ります。</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

export default MemberInformationTab;
