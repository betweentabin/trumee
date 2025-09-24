import ResumePreview from "@/components/pure/resume/preview";
import MessageBox from "@/components/pure/message-box";
import React from "react";

const ResumeEditingTab = ({
  seeker,
  userName,
  jobhistoryList,
  formValues,
  control,
  errors,
  sendingMessage,
  handleSubmit,
  sendMessage,
  messages,
  currentUserId,
  messageEndRef,
  reset,
  refetch
}: any) => (
  <div className="flex flex-col md:flex-row h-full w-full">
    {/* Left panel: ResumePreview + Work Experience */}
    <div className="flex-1 flex flex-col items-start justify-center bg-white p-4 md:p-8 border-b md:border-b-0 md:border-r border-black min-h-[500px] md:min-h-[900px] overflow-y-auto">
      <ResumePreview
        userName={userName}
        jobhistoryList={jobhistoryList}
        formValues={formValues}
        // 追加情報（存在すれば描画）
        jobSummary={seeker?.resume?.extra_data?.jobSummary}
        selfPR={seeker?.resume?.self_pr}
        skills={seeker?.resume?.skills}
        education={Array.isArray(seeker?.resume?.extra_data?.education) ? seeker?.resume?.extra_data?.education : []}
        className="w-full max-w-3xl mx-auto mb-8"
      />
    </div>

    {/* Right panel: Chat panel */}
    <div className="w-full md:w-[400px] md:min-w-[400px] md:max-w-[400px] flex flex-col h-[400px] md:h-[900px] border-t md:border-t-0 md:border-l border-black bg-[#F5F5F5]">
      {/* Comments Header */}
      <div className="bg-[#4B3A2F] text-white px-4 md:px-6 py-3 md:py-4 text-base md:text-lg font-bold flex items-center justify-between border-b border-black">
        <span>職務内容について</span>
        <span className="text-lg md:text-xl">🔍</span>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-3 md:px-4 py-3 md:py-4 flex flex-col gap-3 bg-white border-b border-black">
        {messages.length === 0 && (
          <div className="text-gray-400 text-sm text-center py-8">
            追加内容が記載されます。
          </div>
        )}
        {messages.map((msg: any) => (
          <div
            key={msg.id}
            className={`rounded-lg px-3 md:px-4 py-2 md:py-3 text-sm md:text-base max-w-[85%] break-words shadow-sm ${
              msg.senderId === currentUserId
                ? "bg-[#4B3A2F] text-white self-end"
                : "bg-[#F5F5F5] text-gray-900 self-start border border-gray-200"
            }`}
            style={{
              alignSelf:
                msg.senderId === currentUserId ? "flex-end" : "flex-start",
            }}
          >
            {msg.message}
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-[#4B3A2F] text-white px-4 md:px-6 py-2 md:py-3 text-base md:text-lg font-bold border-b border-black">
        メッセージ入力
      </div>
      <div className="px-3 md:px-4 py-2 md:py-3 bg-white flex flex-col gap-2">
        <MessageBox
          control={control}
          errors={errors}
          isPending={sendingMessage}
          onSubmit={handleSubmit((data: any) =>
            sendMessage({ message: data.message, type: "conversation" })
          )}
        />
      </div>
    </div>
  </div>
);

export default ResumeEditingTab;
