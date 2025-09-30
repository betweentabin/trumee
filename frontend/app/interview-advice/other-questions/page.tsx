"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/app/redux/hooks";
import { buildApiUrl, getApiHeaders } from "@/config/api";
import toast from "react-hot-toast";
import { FaComments, FaMinus, FaPlus } from "react-icons/fa";

type ThreadMsg = { id: string; sender: string; text: string; created_at: string };

export default function OtherQuestionsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const authState = useAppSelector((s)=>s.auth);
  const [openGuide, setOpenGuide] = useState(true);
  const [question, setQuestion] = useState("");
  const [thread, setThread] = useState<ThreadMsg[]>([]);
  const [threadInput, setThreadInput] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const token = useMemo(()=> (typeof window!=='undefined' ? localStorage.getItem('drf_token_v2') || '' : ''), []);
  const me = useMemo(()=>{ if (typeof window==='undefined') return null as any; try { return JSON.parse(localStorage.getItem('current_user_v2')||'null'); } catch { return null as any; } }, []);

  useEffect(()=>{
    const hasStoredToken = typeof window !== 'undefined' && !!localStorage.getItem('drf_token_v2');
    if(!authState.isAuthenticated && !hasStoredToken) router.push('/auth/login');
  }, [authState.isAuthenticated, router]);

  // Preserve /users/:id prefix
  const userIdFromPath = useMemo(() => {
    if (!pathname) return null as string | null;
    const parts = pathname.split('/').filter(Boolean);
    if (parts[0] === 'users' && parts[1]) return parts[1];
    return null;
  }, [pathname]);
  const to = (p: string) => (userIdFromPath ? `/users/${userIdFromPath}${p}` : p);

  const parseContent = (c:any)=>{ try{ const o = JSON.parse(c); return o.message || o.draft || c; } catch { return String(c||''); } };
  const loadThread = async ()=>{
    try{
      const base = `${buildApiUrl('/advice/messages/')}?subject=advice`;
      const url = userIdFromPath ? `${base}&user_id=${encodeURIComponent(String(userIdFromPath))}` : base;
      const res = await fetch(url, { headers: getApiHeaders(token) });
      if(!res.ok) return; const list = await res.json();
      setThread((list||[]).map((m:any)=>({ id:String(m.id), sender:String(m.sender), text:parseContent(m.content), created_at:m.created_at })));
      endRef.current?.scrollIntoView({ behavior:'smooth' });
      await fetch(buildApiUrl('/advice/mark_read/'), { method:'POST', headers:getApiHeaders(token), body: JSON.stringify({ subject:'advice' }) }).catch(()=>{});
    }catch{}
  };
  useEffect(()=>{ loadThread(); }, [token]);
  const sendThread = async ()=>{
    const text = threadInput.trim(); if(!text) return;
    try{
      const body: any = { subject:'advice', content: JSON.stringify({ type:'other', message:text }) };
      if (userIdFromPath) body.user_id = String(userIdFromPath);
      const res = await fetch(buildApiUrl('/advice/messages/'), { method:'POST', headers:getApiHeaders(token), body: JSON.stringify(body) });
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
            <li className="hover:text-gray-700 cursor-pointer" onClick={()=>router.push(to('/interview-advice/applying-reasons'))}>面接に関するアドバイス</li>
            <li>›</li>
            <li className="text-gray-800">その他、質問</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              {navItems.map((t) => (
                <button key={t} onClick={()=>router.push(to(toPath(t)))} className={`w-full text-left px-4 py-3 border-b last:border-b-0 ${t==='その他、質問'?'bg-[#FFF7E6] font-semibold':'hover:bg-gray-50'}`}>{t}</button>
              ))}
            </div>
          </aside>

          <main className="lg:col-span-9 space-y-6">
            <div className="mb-2">
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3"><FaComments className="text-[#FF733E]"/> その他、質問</h1>
              <p className="text-gray-600 mt-2">自由にご相談いただけます。チャット形式でアドバイザーが回答します。</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
              <button onClick={()=>setOpenGuide(!openGuide)} className="w-full flex items-center justify-between px-4 py-3 font-semibold">相談のポイント {openGuide? <FaMinus/>:<FaPlus/>}</button>
              {openGuide && (
                <div className="px-4 pb-4 text-sm text-gray-700 space-y-2">
                  <p>相談の背景・目的・現状を添えていただくと、より的確なアドバイスが可能です。</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">質問・相談内容</label>
              <textarea value={question} onChange={(e)=>setQuestion(e.target.value)} rows={6} className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              <div className="mt-3 text-right">
                <button onClick={()=>{ if(!question.trim()){ toast.error('内容を入力してください'); return;} setThreadInput(question); sendThread(); setQuestion(''); }} className="px-4 py-2 bg-[#FF733E] text-white rounded-lg hover:bg-[#FF8659]">相談を送信</button>
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
