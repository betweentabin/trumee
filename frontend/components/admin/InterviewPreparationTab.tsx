import MessageBox from "@/components/pure/message-box";
import React from "react";
import QuestionBrowser from "@/components/interview/QuestionBrowser";

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
    <div className="w-full md:w-1/3 max-w-full md:max-w-[400px] bg-[#F5F5F5] border-b md:border-b-0 md:border-r border-black p-4 md:p-6 flex-shrink-0">
      <h2 className="mb-3 text-lg font-bold">質問一覧（送信可）</h2>
      <QuestionBrowser
        type="interview"
        showPersonalize={false}
        className="bg-transparent shadow-none"
        onPick={(q) => sendInterviewMessage({ message: q.text, type: 'interview' })}
        pickLabel="送信"
      />
      {interviewQuestions?.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-gray-500 mb-2">固定質問（参考）</div>
          <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto">
            {interviewQuestions.map((q, idx) => (
              <div key={idx} className="bg-white border border-gray-300 rounded-lg p-3 text-sm flex justify-between items-center">
                <span className="pr-2">{q}</span>
                <button className="btn-outline btn-outline-sm" onClick={() => sendInterviewMessage({ message: q, type: 'interview' })}>送信</button>
              </div>
            ))}
          </div>
        </div>
      )}
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
