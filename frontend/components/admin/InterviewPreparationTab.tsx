import MessageBox from "@/components/pure/message-box";
import React, { useMemo, useState } from "react";
import QuestionBrowser from "@/components/interview/QuestionBrowser";
import { buildApiUrl, getApiHeaders } from "@/config/api";
import toast from "react-hot-toast";

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
}) => {
  // auth token for API calls
  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('drf_token_v2') || '' : ''), []);

  // New question form state
  const [refreshKey, setRefreshKey] = useState<string>(`${Date.now()}`);
  const [browserType, setBrowserType] = useState<'interview' | 'resume' | 'self_pr'>('interview');
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [qType, setQType] = useState<'interview' | 'self_pr' | 'resume' | 'motivation'>('interview');
  const [qCategory, setQCategory] = useState('');
  const [qDifficulty, setQDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [qText, setQText] = useState('');
  const [qGuide, setQGuide] = useState('');
  const [qTags, setQTags] = useState(''); // comma separated
  const [qActive, setQActive] = useState(true);

  const createQuestion = async () => {
    const text = qText.trim();
    if (!text) { toast.error('質問文を入力してください'); return; }
    try {
      setCreating(true);
      const res = await fetch(buildApiUrl('/interview/admin/questions/'), {
        method: 'POST',
        headers: getApiHeaders(token),
        body: JSON.stringify({
          type: qType,
          category: qCategory.trim(),
          difficulty: qDifficulty,
          text,
          answer_guide: qGuide.trim(),
          tags: qTags,
          is_active: qActive,
        })
      });
      if (!res.ok) {
        const t = await res.text();
        toast.error(`登録に失敗しました (${res.status})`);
        console.error('question create failed', res.status, t);
        return;
      }
      toast.success('質問を登録しました');
      // reset minimal and refresh browser
      setQText('');
      setQGuide('');
      setQTags('');
      setRefreshKey(`${Date.now()}`);
      // sync browser type to created type
      setBrowserType(qType as any);
      // auto-open browser on created category
      if (!showForm) setShowForm(true);
    } catch (e) {
      toast.error('登録に失敗しました');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-white">
      {/* Left: Questions panel */}
      <div className="w-full md:w-1/3 max-w-full md:max-w-[400px] bg-[#F5F5F5] border-b md:border-b-0 md:border-r border-black p-4 md:p-6 flex-shrink-0">
        <h2 className="mb-3 text-lg font-bold">質問一覧（送信可）</h2>

        {/* Admin quick-add form */}
        <div className="bg-white border border-gray-300 rounded-lg p-3 mb-4">
          <button className="text-sm font-semibold" onClick={() => setShowForm(!showForm)}>
            {showForm ? '新規質問の追加（閉じる）' : '新規質問の追加（管理者）'}
          </button>
          {showForm && (
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex gap-2 items-center">
                <label className="w-16 text-gray-600">種類</label>
                <select value={qType} onChange={e => setQType(e.target.value as any)} className="border rounded px-2 py-1">
                  <option value="interview">面接</option>
                  <option value="self_pr">自己PR</option>
                  <option value="resume">職務経歴書</option>
                  <option value="motivation">志望動機</option>
                </select>
                <label className="w-14 text-gray-600 ml-2">難易度</label>
                <select value={qDifficulty} onChange={e => setQDifficulty(e.target.value as any)} className="border rounded px-2 py-1">
                  <option value="easy">初級</option>
                  <option value="medium">中級</option>
                  <option value="hard">上級</option>
                </select>
              </div>
              <div className="flex gap-2 items-center">
                <label className="w-16 text-gray-600">カテゴリ</label>
                <input value={qCategory} onChange={e => setQCategory(e.target.value)} placeholder="例: basic / experience" className="flex-1 border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">質問文</label>
                <textarea value={qText} onChange={e => setQText(e.target.value)} rows={3} className="w-full border rounded px-2 py-1" placeholder="質問を入力してください" />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">回答ガイド（任意）</label>
                <textarea value={qGuide} onChange={e => setQGuide(e.target.value)} rows={2} className="w-full border rounded px-2 py-1" placeholder="回答のヒントなど" />
              </div>
              <div className="flex gap-2 items-center">
                <label className="w-16 text-gray-600">タグ</label>
                <input value={qTags} onChange={e => setQTags(e.target.value)} placeholder="例: 営業, リーダーシップ" className="flex-1 border rounded px-2 py-1" />
              </div>
              <div className="flex items-center gap-2">
                <input id="qActive" type="checkbox" checked={qActive} onChange={e => setQActive(e.target.checked)} />
                <label htmlFor="qActive" className="text-gray-700">有効にする</label>
              </div>
              <div className="flex justify-end">
                <button onClick={createQuestion} disabled={creating} className="px-4 py-2 rounded bg-[#FF733E] text-white disabled:opacity-60">
                  {creating ? '登録中…' : '追加する'}
                </button>
              </div>
            </div>
          )}
        </div>

        <QuestionBrowser
          key={refreshKey}
          type={browserType}
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
};

export default InterviewPreparationTab;
