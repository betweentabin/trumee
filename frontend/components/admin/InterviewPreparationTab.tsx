import MessageBox from "@/components/pure/message-box";
import React, { useRef } from "react";

const ADMIN_SENDER_ID = "admin"; // Adjust as needed or pass as prop

interface Message {
  id: string;
  senderId: string;
  content?: {
    message: string;
  };
  message?: string; // fallback if no content.message
  created_at?: string;
}

interface InterviewPreparationTabProps {
  control: any;
  errors: any;
  sendingInterview: boolean;
  handleSubmit: any;
  sendInterviewMessage: (data: { message: string; type: string }) => void;
  interviewQuestions: string[];
  interviewAnswers: Message[];
  currentUserIdInterview: string;
  reset: () => void;
  refetchInterview: () => void;
}

const InterviewPreparationTab: React.FC<InterviewPreparationTabProps> = ({
  control,
  errors,
  sendingInterview,
  handleSubmit,
  sendInterviewMessage,
  interviewQuestions,
  interviewAnswers,
  currentUserIdInterview,
  reset,
  refetchInterview,
}) => (
  <div className="flex flex-col md:flex-row h-full w-full bg-white">
    {/* Left: Questions panel */}
    <div className="w-full md:w-1/3 max-w-full md:max-w-[400px] bg-[#F5F5F5] border-b md:border-b-0 md:border-r border-black p-6 md:p-8 flex-shrink-0">
      <h2 className="mb-4 text-lg font-bold">質問内容</h2>
      <div className="flex flex-col gap-4 max-h-[40vh] md:max-h-[calc(100vh-100px)] overflow-y-auto">
        {interviewQuestions.map((q, idx) => (
          <div
            key={idx}
            className="bg-white border border-gray-300 rounded-lg p-4 text-base"
          >
            {q}
          </div>
        ))}
      </div>
    </div>

    {/* Right: Answers and MessageBox */}
    <div className="flex-1 flex flex-col bg-white p-6 md:p-8 min-h-[500px] md:min-h-[900px]">
      {/* Answers List */}
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
        {interviewAnswers.length === 0 && (
          <div className="text-gray-400 text-center py-8 text-sm">
            まだ回答がありません。
          </div>
        )}
        {interviewAnswers.map((a) => {
          const isAdmin = a.senderId === ADMIN_SENDER_ID;
          const messageText = a.content?.message ?? a.message ?? "";
          return (
            <div
              key={a.id}
              className={`rounded-lg p-4 text-base shadow-md max-w-[80%] break-words
                ${
                  isAdmin
                    ? "bg-[#F5F5F5] text-gray-900 self-start border border-gray-300"
                    : "bg-[#3A2F1C] text-white self-end"
                }
              `}
              style={{ alignSelf: isAdmin ? "flex-start" : "flex-end" }}
            >
              {messageText}
            </div>
          );
        })}
      </div>

      {/* Message Input */}
      <div className="mt-4 border-t border-gray-300 pt-4">
        <MessageBox
          control={control}
          errors={errors}
          isPending={sendingInterview}
          onSubmit={handleSubmit((data: any) =>
            sendInterviewMessage({ message: data.message, type: "interview" })
          )}
        />
      </div>
    </div>
  </div>
);

export default InterviewPreparationTab;
