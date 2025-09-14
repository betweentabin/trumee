"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/app/redux/hooks";
import { buildApiUrl, getApiHeaders } from "@/config/api";
import toast from "react-hot-toast";
import { FaMinus, FaPlus, FaTrophy } from "react-icons/fa";

type ThreadMsg = { id: string; sender: string; text: string; created_at: string };

export default function AchievementsPage() {
  const router = useRouter();
  const authState = useAppSelector((s) => s.auth);
  const [openGuide, setOpenGuide] = useState(true);
  const [result, setResult] = useState("");
  const [action, setAction] = useState("");
  const [metric, setMetric] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [thread, setThread] = useState<ThreadMsg[]>([]);
  const [threadInput, setThreadInput] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const token = useMemo(()=> (typeof window!=='undefined'? localStorage.getItem('drf_token_v2') || '' : ''), []);
  const me = useMemo(()=>{ if (typeof window==='undefined') return null as any; try { return JSON.parse(localStorage.getItem('current_user_v2')||'null'); } catch { return null as any; } }, []);

  useEffect(()=>{ if (!authState.isAuthenticated) router.push('/auth/login'); }, [authState, router]);

  const handleGenerate = () => {
    if (!result) return toast.error('成果（結果）を入力してください');
    setLoading(true);
    setTimeout(()=>{
      setDraft(`実績の整理\n\n【成果】\n${result}\n\n【行動】\n${action || '課題を特定し、関係者を巻き込んで改善に取り組みました。'}\n\n【指標】\n${metric || '売上/品質/工数などに定量的な改善が見られました。'}\n\n結果の背景と再現性が伝わるように記載します。`);
      setLoading(false);
      toast.success('草案を生成しました');
    }, 600);
  };

  const parseContent = (c:any)=>{ try{ const o=JSON.parse(c); return o.message||o.draft||c; }catch{return String(c||'');} };
  const loadThread = async ()=>{
    try{
      const res = await fetch(`${buildApiUrl('/advice/messages/')}?subject=advice`, { headers: getApiHeaders(token) });
      if(!res.ok) return; const list = await res.json();
      setThread((list||[]).map((m:any)=>({id:String(m.id), sender:String(m.sender), text:parseContent(m.content), created_at:m.created_at})));
      endRef.current?.scrollIntoView({behavior:'smooth'});
      await fetch(buildApiUrl('/advice/mark_read/'), { method:'POST', headers:getApiHeaders(token), body: JSON.stringify({subject:'advice'}) }).catch(()=>{});
    }catch{}
  };
  useEffect(()=>{ loadThread(); }, [token]);
  const sendThread = async ()=>{
    const text = threadInput.trim(); if(!text) return;
    try{
      const res = await fetch(buildApiUrl('/advice/messages/'), { method:'POST', headers:getApiHeaders(token), body: JSON.stringify({ subject:'advice', content: JSON.stringify({ type:'achievement', message:text }) }) });
      if(!res.ok) return toast.error('メッセージ送信に失敗しました');
      setThreadInput(''); await loadThread();
    }catch{ toast.error('メッセージ送信に失敗しました'); }
  };

  const navItems = ["転職理由(志望理由)", "退職理由", "将来やりたいこと", "職務経歴書に関する質問", "実績など", "面接対策", "志望理由", "その他、質問"]; 
  const toPath = (l: string) => l === '転職理由(志望理由)' || l === '志望理由' ? '/interview-advice/applying-reasons' : l === '退職理由' ? '/interview-advice/resignation-reasons' : l === '将来やりたいこと' ? '/interview-advice/future-plans' : l === '職務経歴書に関する質問' ? '/interview-advice/resume-questions' : l === '実績など' ? '/interview-advice/achievements' : l === '面接対策' ? '/interview-advice/prepare-interview' : '/interview-advice/other-questions';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <nav className="text-sm text-gray-500 mb-4" aria-label="breadcrumb">
          <ol className="flex items-center gap-2">
            <li className="hover:text-gray-700 cursor-pointer" onClick={()=>router.push('/')}>TOP</li>
            <li>›</li>
            <li className="hover:text-gray-700 cursor-pointer" onClick={()=>router.push('/interview-advice/applying-reasons')}>面接に関するアドバイス</li>
            <li>›</li>
            <li className="text-gray-800">実績など</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              {navItems.map((t) => (
                <button key={t} onClick={()=>router.push(toPath(t))} className={`w-full text-left px-4 py-3 border-b last:border-b-0 ${t==='実績など'?'bg-[#FFF7E6] font-semibold':'hover:bg-gray-50'}`}>{t}</button>
              ))}
            </div>
          </aside>

          <main className="lg:col-span-9 space-y-6">
            <div className="mb-2">
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3"><FaTrophy className="text-[#FF733E]"/> 実績など</h1>
              <p className="text-gray-600 mt-2">成果をSTAR（状況・課題・行動・結果）やAR（行動・結果）で簡潔にまとめます。</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
              <button onClick={()=>setOpenGuide(!openGuide)} className="w-full flex items-center justify-between px-4 py-3 font-semibold">まとめ方のポイント {openGuide? <FaMinus/>:<FaPlus/>}</button>
              {openGuide && (
                <div className="px-4 pb-4 text-sm text-gray-700 space-y-2">
                  <p>数値や比較などの指標を入れると説得力が増します。</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">入力</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">成果（結果）</label>
                    <textarea value={result} onChange={(e)=>setResult(e.target.value)} className="w-full h-24 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">取った行動（任意）</label>
                    <textarea value={action} onChange={(e)=>setAction(e.target.value)} className="w-full h-20 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">指標・数値（任意）</label>
                    <input value={metric} onChange={(e)=>setMetric(e.target.value)} className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                  </div>
                  <button onClick={handleGenerate} disabled={loading} className="w-full py-3 bg-[#FF733E] text-white rounded-lg hover:bg-[#FF8659] disabled:bg-gray-400">{loading?'生成中…':'草案を生成'}</button>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">生成結果</h2>
                {draft ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded max-h-96 overflow-y-auto"><pre className="whitespace-pre-wrap text-sm text-gray-700">{draft}</pre></div>
                  </div>
                ) : (
                  <div className="h-96 flex items-center justify-center text-gray-400">入力して草案を生成してください</div>
                )}
              </div>
            </div>

            <section className="bg-white rounded-lg shadow-md border">
              <div className="px-4 py-3 border-b font-semibold">相談スレッド</div>
              <div className="h-[300px] overflow-y-auto p-4 space-y-2 bg-gray-50">
                {thread.length===0 && <div className="text-center text-gray-400 text-sm py-10">メッセージはありません。</div>}
                {thread.map((m)=>{ const isMine = me && String(m.sender)===String(me.id); return (
                  <div key={m.id} className={`flex ${isMine ? 'justify-end':'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-md p-3 text-sm ${isMine?'bg-[#3A2F1C] text-white':'bg-white text-gray-900 border'}`}>
                      <div>{m.text}</div>
                      <div className="text-[10px] opacity-70 mt-1">{new Date(m.created_at).toLocaleString('ja-JP')}</div>
                    </div>
                  </div> );})}
                <div ref={endRef} />
              </div>
              <div className="p-4 border-t flex gap-2">
                <input value={threadInput} onChange={(e)=>setThreadInput(e.target.value)} placeholder="入力してください。" className="flex-1 rounded-md border px-3 py-2"/>
                <button onClick={sendThread} className="rounded-md bg-[#FF733E] text-white px-4 py-2">送信</button>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

