/**
 * * Business modal
 */
import { forwardRef, useCallback, useRef, useMemo } from "react";
import dayjs from "dayjs";

import { DefaultModal } from ".";
import DefaultButton from "../pure/button/default";
import ResumePreview from "../pure/resume/preview";


import { prefecturesJa } from "@/app/content/prefectures";
import { sex_options } from "../content/common/sex";
import { getJobTypeNames } from "../helpers/jobTypeHelper";

interface Props {
  detail: any;
  isOpen: boolean;
  closeLabel: string;
  confirmLabel: string;
  isSendingMessage: boolean;
  onClose: () => void;
  sendMessage: (_message: any) => void;
  onConfirm: () => void;
  onScout?: (message: string) => void; // 追加: スカウト送信用（v2）
}

const JobSeekerDetailModal = ({
  detail,
  isOpen,
  closeLabel,
  confirmLabel,
  isSendingMessage,
  onClose,
  sendMessage,
  onConfirm,
  onScout,
}: Props) => {
  const messageRef = useRef<HTMLTextAreaElement | null>(null);

  const onMessage = useCallback(() => {
    if (!messageRef.current) return;
    const message = messageRef.current.value;
    if (!message) return;

    sendMessage({
      message,
      detail
    });
    onClose();
    messageRef.current.value = "";
  }, [sendMessage, detail, onClose]);

  // Transform resume data for ResumePreview component
  const resumeData = useMemo(() => {
    if (!detail?.resume) return { jobhistoryList: [], formValues: {} };

    const resume = detail.resume as any;
    let histories = Array.isArray(resume.histories) ? resume.histories : [];
    // Fallback: build histories from extra_data.workExperiences when histories is absent
    if ((!histories || histories.length === 0) && Array.isArray(resume.extra_data?.workExperiences)) {
      histories = (resume.extra_data.workExperiences as any[]).map((w, i) => ({
        companyName: w.company,
        workActivity: w.description || w.tasks || '',
        startDate: w.startDate || w.period_from || w.since,
        endDate: w.endDate || w.period_to || w.to,
        memberCount: w.teamSize || w.people,
        duty: w.position || w.duty,
        employmentType: w.employmentType || '正社員',
      }));
    }

    const jobhistoryList = histories.map(
      (_: any, index: number) => `job${index + 1}`
    );

    const formValues: any = {
      summary: resume.summary || resume.extra_data?.jobSummary || "",
      skills: resume.skillset || resume.skills || "",
      self_pr: resume.selfPR || resume.self_pr || "",
    };

    // Add job history data
    histories.forEach((history: any, index: number) => {
      const prefix = `job${index + 1}`;
      formValues[prefix] = {
        company: history.companyName || "",
        capital: history.capital || 0,
        work_content: history.workActivity || "",
        since: history.startDate
          ? dayjs(history.startDate).format("YYYY/MM")
          : "",
        to: history.endDate ? dayjs(history.endDate).format("YYYY/MM") : "現在",
        people: history.memberCount || 0,
        duty: history.duty || "",
        employment_type: history.employmentType || "正社員",
      };
    });

    return { jobhistoryList, formValues };
  }, [detail]);

  const userName =
    detail?.user?.firstName && detail?.user?.lastName
      ? `${detail.user.firstName} ${detail.user.lastName}`
      : "";

  return (
    <DefaultModal isOpen={isOpen} onClose={onClose}>
      <div className="py-4 md:py-6 px-3 md:px-4 w-full max-w-4xl max-h-[90vh] md:max-h-[85vh] flex flex-col">
        {/* Header with basic info */}
        <div className="mb-4 md:mb-6 w-full flex flex-col gap-3 md:gap-4 text-left">
          <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-primary-default">
            求職者詳細情報
          </h3>
          {detail && (
            <div className="w-full flex flex-col gap-2 md:gap-3 p-3 md:p-4 bg-gray-50 rounded-lg">
              <div className="flex flex-row gap-2 items-center">
                <span className="text-base md:text-lg font-semibold">
                  {/* 匿名表示（ID終端で識別） */}
                  {`匿名ユーザー${detail?.id ? ` #${String(detail.id).slice(-4)}` : ''}`}
                </span>
              </div>
              {/* 企業画面ではメール等の個人情報は非表示 */}
              {detail.desired_job && (
                <div className="flex flex-col md:flex-row gap-1 md:gap-2">
                  <span className="w-16 md:w-20 font-medium text-sm md:text-base">
                    希望職種
                  </span>
                  :
                  <span className="text-sm md:text-base">
                    {detail.desired_job}
                  </span>
                </div>
              )}
              {detail.prefecture && (
                <div className="flex flex-col md:flex-row gap-1 md:gap-2">
                  <span className="w-16 md:w-20 font-medium text-sm md:text-base">
                    希望勤務地
                  </span>
                  :
                  <span className="text-sm md:text-base">
                    {detail.prefecture}
                  </span>
                </div>
              )}
              {detail.desired_salary && (
                <div className="flex flex-col md:flex-row gap-1 md:gap-2">
                  <span className="w-16 md:w-20 font-medium text-sm md:text-base">
                    希望年収
                  </span>
                  :
                  <span className="text-sm md:text-base">
                    {(detail.desired_salary / 10000).toFixed(0)}万円
                  </span>
                </div>
              )}
              {detail.skills && (
                <div className="flex flex-col md:flex-row gap-1 md:gap-2">
                  <span className="w-16 md:w-20 font-medium text-sm md:text-base">
                    スキル
                  </span>
                  :
                  <span className="text-sm md:text-base">
                    {detail.skills}
                  </span>
                </div>
              )}
              {detail.user?.messagesSent &&
                detail.user.messagesSent.length > 0 && (
                  <div className="flex flex-col md:flex-row gap-1 md:gap-2">
                    <span className="w-16 md:w-20 font-medium text-sm md:text-base">
                      メッセージ
                    </span>
                    :
                    <span className="text-xs md:text-sm text-gray-600">
                      {
                        detail.user.messagesSent[
                          detail.user.messagesSent.length - 1
                        ].message
                      }
                    </span>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Resume Preview */}
        {detail?.resume ? (
          <div className="flex-1 w-full border border-border-default rounded-lg overflow-hidden">
            <div className="py-2 px-3 md:px-4 bg-primary-default text-white text-center text-base md:text-lg font-medium">
              職務経歴書
            </div>
            <div className="max-h-[300px] md:max-h-[400px] overflow-y-auto">
              <ResumePreview
                userName={userName}
                jobhistoryList={resumeData.jobhistoryList}
                formValues={resumeData.formValues}
                jobSummary={(detail?.resume as any)?.extra_data?.jobSummary}
                selfPR={(detail?.resume as any)?.self_pr}
                skills={(detail?.resume as any)?.skills}
                education={Array.isArray((detail?.resume as any)?.extra_data?.education) ? (detail?.resume as any)?.extra_data?.education : []}
                className="p-2 md:p-4"
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 w-full border border-border-default rounded-lg overflow-hidden">
            <div className="py-2 px-3 md:px-4 bg-gray-100 text-gray-600 text-center text-base md:text-lg font-medium">
              職務経歴書
            </div>
            <div className="p-4 md:p-8 text-center text-gray-500">
              <p className="text-base md:text-lg mb-2">
                職務経歴書が登録されていません
              </p>
              <p className="text-xs md:text-sm">
                この求職者はまだ職務経歴書を作成していないか、公開していません。
              </p>
            </div>
          </div>
        )}

        {/* Message Section */}
        <div className="mt-4 md:mt-6 px-2 md:px-4 w-full flex flex-col justify-start gap-2 md:gap-3">
          <span className="text-left font-medium text-sm md:text-base">
            メッセージを送る
          </span>
          <MessageboxTextarea
            ref={messageRef}
            placeholder="メッセージを入力してください"
            onSendMessage={onMessage}
            isSendingMessage={isSendingMessage}
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-4 md:mt-6 grid grid-cols-2 gap-3 md:gap-4">
          <button
            className="px-4 md:px-8 py-2 md:py-3 bg-white text-sm md:text-lg text-gray-800 flex items-center justify-center gap-x-2 rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-300 transition-colors"
            onClick={onClose}
          >
            {closeLabel}
          </button>
          <DefaultButton
            onClick={() => {
              if (typeof onScout === 'function') {
                const msg = messageRef.current?.value || '';
                onScout(msg);
              } else {
                onConfirm();
              }
            }}
            variant="primary"
            className="text-sm md:text-lg"
          >
            {confirmLabel}
          </DefaultButton>
        </div>
      </div>
    </DefaultModal>
  );
};

export default JobSeekerDetailModal;

JobSeekerDetailModal.displayName = "JobSeekerDetailModal";

interface InputProps {
  placeholder: string;
  type?: string;
  hasError?: boolean;
  rows?: number;
  className?: string;
  isSendingMessage: boolean;
  onSendMessage: () => void;
}

const MessageboxTextarea = forwardRef<HTMLTextAreaElement, InputProps>(
  (
    { placeholder, hasError, rows, className, isSendingMessage, onSendMessage },
    ref
  ) => {
    return (
      <div className="w-full relative">
        <textarea
          ref={ref}
          placeholder={placeholder}
          rows={rows ?? 4}
          className={`px-4 py-3 w-full border border-border-default rounded-lg focus:outline-none focus:border-primary-active resize-none ${hasError && "border-red-20"} ${className ?? ""}`}
        ></textarea>
        <button
          className="hover:text-orange-30 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSendingMessage}
          onClick={onSendMessage}
        >
          <svg className="absolute right-3 bottom-3 w-6 h-6 cursor-pointer" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </div>
    );
  }
);

MessageboxTextarea.displayName = "MessageboxTextarea";
