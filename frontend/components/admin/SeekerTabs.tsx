"use client";

import { useState, useEffect, useRef } from "react";
import ResumeEditingTab from "./ResumeEditingTab";
import InterviewPreparationTab from "./InterviewPreparationTab";
import AdviceScreenTab from "./AdviceScreenTab";
import MemberInformationTab from "./MemberInformationTab";
import { useForm } from "react-hook-form";
import { useMessages, useScoutBusinesses } from "../queries/query";
import { useMessage } from "../queries/mutation";
import axios from "axios";
import { getAuthHeaders } from "@/utils/auth";

interface Message {
  id: string;
  senderId: string;
  content: {
    type: string;
    message: string;
  };
  created_at: string;
  // Add any other fields your message may have
}

const tabList = [
  { key: "profile", label: "職務経歴書の添削" },
  { key: "interview", label: "面接対策" },
  { key: "advice", label: "アドバイス画面" },
  { key: "member", label: "会員情報" },
];

const interviewQuestions = [
  "あなたの強みと弱みを教えてください。",
  "あなたの志望動機を教えてください。",
  "前職を退職した理由を具体的に教えてください。",
];

const adviceTabs = [
  {
    key: "reason_for_changing",
    label: "なぜこの業界を進むのか?",
    type: "reason_for_changing",
    isGroup: false,
  },
  {
    key: "resume",
    label: "職務経歴書に関する質問",
    type: "advice_resume",
    isGroup: true,
    subTabs: [
      {
        key: "reason_for_resigning",
        label: "入社後にやりたいこと・目標は？",
        type: "reason_for_resigning",
      },
    ],
  },
  {
    key: "future_todo",
    label: "企業のどの点に共感できるか？",
    type: "future_todo",
    isGroup: false,
  },
];

export default function SeekerTabs({
  seeker,
  userData,
  onClose,
}: {
  seeker: any;
  userData: any;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState(tabList[0].key);
  const [selectedAdviceTab, setSelectedAdviceTab] = useState(adviceTabs[0].key);
  const [selectedAdviceSubTab, setSelectedAdviceSubTab] = useState<string | null>(null);
  const [message, setMessage] = useState<Message[]>([]);
  const [interviewmessage, setInterviewmessage] = useState<Message[]>([]); // changed to array

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { message: "" } });

  const messageEndRef = useRef<HTMLDivElement>(null);

  const jobhistoryList = seeker.experiences || [];
  const userName = seeker.profile?.profile || "名無しのユーザー";

  const formValues = {
    summary: seeker.profile?.profile || "",
    skills: seeker.skill?.skill || "",
    self_pr: "",
    ...seeker,
  };

  // Messages
  const receiverId = seeker.email;
  const { data: messagesData, refetch } = useMessages("conversation", receiverId);
  const messages = messagesData?.list || [];
  const currentUserId = messagesData?.userId;
  const { mutate: sendMessage, isPending: sendingMessage } = useMessage(receiverId, () => {
    reset();
    refetch();
  });

  // Interview
  const { data: interviewData, refetch: refetchInterview } = useMessages("interview", receiverId);
  const interviewAnswers = interviewData?.list || [];
  const currentUserIdInterview = interviewData?.userId;
  const { mutate: sendInterviewMessage, isPending: sendingInterview } = useMessage(receiverId, () => {
    reset();
    refetchInterview();
  });

  // Advice
  const selectedAdvice = adviceTabs.find((tab) => tab.key === selectedAdviceTab) || adviceTabs[0];
  const selectedAdviceType =
    selectedAdvice.isGroup && selectedAdviceSubTab
      ? selectedAdvice.subTabs?.find((st) => st.key === selectedAdviceSubTab)?.type || selectedAdvice.type
      : selectedAdvice.type;

  const { data: adviceData, refetch: refetchAdvice } = useMessages(selectedAdviceType, receiverId);
  const adviceMessages = adviceData?.list || [];
  const currentUserIdAdvice = adviceData?.userId;

  const { mutate: sendAdviceMessage, isPending: sendingAdvice } = useMessage(receiverId, () => {
    reset();
    refetchAdvice();
  });

  const { data: scoutBusinessesData } = useScoutBusinesses();

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const res = await axios.get<Message[]>("http://85.131.248.214:9000/api/get_all_message/", {
          headers: getAuthHeaders(),
        });

        const messages = res.data || [];
        // Sort messages by created_at ascending
        const sortedMessages = [...messages].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        // Filter messages where content.type is interview
        const interview = sortedMessages.filter((e) => e.content.type === "interview");

        setMessage(sortedMessages);
        setInterviewmessage(interview);
        console.log(sortedMessages, "sorted messages");
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessage();
  }, []);

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Header with name & tabs */}
      <div className="flex flex-col border-b border-gray-300 bg-white">
        <div className="flex flex-wrap items-center px-4 py-2 gap-2">
          <span className="text-xl md:text-3xl font-bold">{userName}</span>
          <div className="flex flex-1 overflow-x-auto no-scrollbar">
            {tabList.map((tab) => (
              <button
                key={tab.key}
                className={`flex-shrink-0 px-4 py-2 text-sm md:text-base font-semibold rounded-t-lg transition-colors
                  ${
                    activeTab === tab.key
                      ? "bg-[#4B3A2F] text-white"
                      : "bg-[#F5F5F5] text-[#4B3A2F] hover:bg-[#E0E0E0]"
                  }
                `}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-800 text-2xl">
            ×
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-auto">
        <div className="flex-1 p-2 md:p-4 bg-white">
          {activeTab === "profile" && (
            <ResumeEditingTab
              seeker={seeker}
              userName={userName}
              jobhistoryList={jobhistoryList}
              formValues={formValues}
              control={control}
              errors={errors}
              sendingMessage={sendingMessage}
              handleSubmit={handleSubmit}
              sendMessage={sendMessage}
              messages={messages}
              currentUserId={currentUserId}
              messageEndRef={messageEndRef}
              reset={reset}
              refetch={refetch}
            />
          )}
          {activeTab === "interview" && (
            <InterviewPreparationTab
              control={control}
              errors={errors}
              sendingInterview={sendingInterview}
              handleSubmit={handleSubmit}
              sendInterviewMessage={sendInterviewMessage}
              interviewQuestions={interviewQuestions}
              interviewAnswers={interviewmessage} // note: now array of messages
              currentUserIdInterview={currentUserIdInterview}
              reset={reset}
              refetchInterview={refetchInterview}
            />
          )}
          {activeTab === "advice" && (
            <AdviceScreenTab
              adviceTabs={adviceTabs}
              selectedAdviceTab={selectedAdviceTab}
              setSelectedAdviceTab={setSelectedAdviceTab}
              selectedAdviceSubTab={selectedAdviceSubTab}
              setSelectedAdviceSubTab={setSelectedAdviceSubTab}
              adviceMessages={message}
              currentUserIdAdvice={currentUserIdAdvice}
              sendingAdvice={sendingAdvice}
              handleSubmit={handleSubmit}
              sendAdviceMessage={sendAdviceMessage}
              messageEndRef={messageEndRef}
              reset={reset}
              refetchAdvice={refetchAdvice}
              control={control}
              errors={errors}
            />
          )}
          {activeTab === "member" && (
            <MemberInformationTab
              seeker={seeker}
              userData={userData}
              scoutBusinessesData={scoutBusinessesData}
            />
          )}
        </div>
      </div>
    </div>
  );
}
