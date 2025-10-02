"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { usePathname, useRouter } from 'next/navigation';
import useAuthV2 from '@/hooks/useAuthV2';
import { useAppSelector } from '@/app/redux/hooks';
import toast from 'react-hot-toast';

import { useMessageToUser } from "@/components/company/queries/mutation";

import {
  IndustryModal,
  JobTypesModal,
  PrefectureModal,
} from "@/components/modal";

import { CheckInputConditions, DefaultInput } from "@/components/pure/input";
import SeekerCard from "./_component/seeker_card";
import { DefaultSelect } from "@/components/pure/select";
import JobSeekerDetailModal from "@/components/modal/jobseeker-detail";
import apiV2Client from '@/lib/api-v2-client';
import type { JobPosting, JobTicketLedger } from '@/types/api-v2';
import search from "../api/api";
import { getPrefectureName } from '@/components/content/common/prefectures';
import { getIndustryNames, getFirstJobTypeName } from '@/components/helpers/jobTypeHelper';
import { anonymizeUserLabel } from '@/utils/anonymize';

export default function Search() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, currentUser, initializeAuth } = useAuthV2();
  const authState = useAppSelector(state => state.authV2);
  
  const [results, setResults] = useState<any[]>([]);
  // Bulk scout
  const [bulkMsg, setBulkMsg] = useState('');
  const [bulkSending, setBulkSending] = useState(false);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [jobTickets, setJobTickets] = useState<JobTicketLedger | null>(null);
  const [selectedSeekerId, setSelectedSeekerId] = useState<string>('');
  const [consumeInterviewDate, setConsumeInterviewDate] = useState('');
  const [consuming, setConsuming] = useState(false);
  const [slot1, setSlot1] = useState('');
  const [slot2, setSlot2] = useState('');
  const [slot3, setSlot3] = useState('');
  const [proposing, setProposing] = useState(false);
  const [isScouting, setIsScouting] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState(false);

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [sortKey, setSortKey] = useState<string | undefined>(undefined);

  const [showPrefectureModal, setShowPrefectureModal] = useState(false);
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [showJobTypeModal, setShowJobTypeModal] = useState(false);
  const [appliedCompanies, setAppliedCompanies] = useState<string[]>([]);

  const [selectedSeeker, setSelectedSeeker] = useState<any>();

  // 認証状態をチェックして初期化
  useEffect(() => {
    const initialize = async () => {
      await initializeAuth();
    };
    initialize();
  }, []);

  // 認証とロールチェック
  useEffect(() => {
    const hasStored = typeof window !== 'undefined' && !!localStorage.getItem('drf_token_v2');
    if (isAuthenticated === false && !hasStored) {
      // 認証されていない場合は企業ログインページにリダイレクト
      toast.error('ログインが必要です');
      router.push('/auth/login');
      return;
    }
    
    if (isAuthenticated && currentUser) {
      // 企業ロールチェック
      if (currentUser.role !== 'company') {
        toast.error('企業アカウントでログインしてください');
        router.push('/auth/login');
        return;
      }
      
      console.log('🏢 Company page: Authenticated company user', currentUser);
      // 認証されたユーザーの設定完了

      // /company に来たら /company/<userId> へリダイレクト
      if (pathname === '/company' && currentUser.id) {
        router.replace(`/company/${currentUser.id}`);
      }

      // 企業が過去に送ったスカウトを取得して重複送信を抑止
      (async () => {
        try {
          const scouts = await apiV2Client.getScouts();
          const seekerIds = (scouts || []).map((s: any) => s.seeker).filter(Boolean);
          setAppliedCompanies(Array.from(new Set(seekerIds)));
        } catch (e) {
          // 取得失敗は無視（UIの抑止機能が効かないだけ）
        }
        try {
          const list = await apiV2Client.getCompanyJobs();
          setJobs(list || []);
          if ((list || []).length > 0) {
            setSelectedJobId(String((list as any)[0].id));
          }
        } catch (e) {
          // ignore
        }
      })();
    }
  }, [isAuthenticated, currentUser, router, pathname]);

  // Fetch tickets for selected job
  useEffect(() => {
    if (!selectedJobId) { setJobTickets(null); return; }
    (async () => {
      try {
        const t = await apiV2Client.getJobTickets(selectedJobId);
        setJobTickets(t as any);
      } catch {
        setJobTickets(null);
      }
    })();
  }, [selectedJobId]);

  // Seeker ID helper（依存で使うため先に定義）
  const getSeekerId = useCallback((s: any) => (s?.user || s?.seeker?.id || s?.id), []);

  // ページ内の求職者（結果）からセレクト用オプション生成
  const pageSeekerOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { value: string; label: string }[] = [];
    (results || []).forEach((s: any) => {
      const sid = String(getSeekerId(s) || '');
      if (!sid || seen.has(sid)) return;
      seen.add(sid);
      // 匿名ラベル（IDベース）
      const anon = anonymizeUserLabel(sid);
      // 付加情報（職種/勤務地）
      const extra: string[] = [];
      if (s?.desired_job) extra.push(String(s.desired_job));
      if (s?.prefecture) extra.push(String(s.prefecture));
      const label = extra.length > 0 ? `${anon}（${extra.join(' / ')}）` : anon;
      opts.push({ value: sid, label });
    });
    return opts;
  }, [results, getSeekerId]);

  // 認証復元中はローディング表示
  const restoring = typeof window !== 'undefined' && !!localStorage.getItem('drf_token_v2') && isAuthenticated === false;
  if (restoring) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF733E]"></div>
      </div>
    );
  }

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      prefecture_ids: "",
      industry_ids: "",
      job_type_ids: "",
      keyword: "",
      from_salary: "",
      to_salary: "",
      age_20: false,
      age_30: false,
      age_40: false,
      age_50: false,
      exp_none: false,
      exp_1_5: false,
      exp_5_10: false,
      exp_10: false,
    },
  });
  const prefectureIds = watch("prefecture_ids");
  const industryIds = watch("industry_ids");
  const jobTypeIds = watch("job_type_ids");

  const onShowFilterModals = useCallback(
    (type: string) => () => {
      if (type == "location") setShowPrefectureModal(true);
      else if (type == "industry") {
        setShowIndustryModal(true);
      } else if (type == "job_type") {
        setShowJobTypeModal(true);
      }
    },
    []
  );
  const onTogglePrefectureModal = useCallback(() => {
    setShowPrefectureModal((old) => !old);
  }, []);
  const onToggleIndustryModal = useCallback(() => {
    setShowIndustryModal((old) => !old);
  }, []);
  const onToggleJobTypeModal = useCallback(() => {
    setShowJobTypeModal((old) => !old);
  }, []);
  const onToggleDetailModal = useCallback(() => {
    setSelectedSeeker(undefined);
  }, []);

  const onTogglePrefecture = useCallback(
    (_newId: string) => () => {
      const oldList = prefectureIds.split(",");
      const filtered = oldList.filter((_) => _ != _newId);
      const newList =
        filtered.length == oldList.length ? [...oldList, _newId] : filtered;
      setValue("prefecture_ids", newList.join(","));
    },
    [prefectureIds, setValue]
  );
  const onToggleIndustry = useCallback(
    (_newId: string) => () => {
      const oldList = industryIds.split(",");
      const filtered = oldList.filter((_) => _ != _newId);
      const newList =
        filtered.length == oldList.length ? [...oldList, _newId] : filtered;
      setValue("industry_ids", newList.join(","));
    },
    [industryIds, setValue]
  );
  const onToggleJobType = useCallback(
    (_newId: string) => () => {
      const oldList = jobTypeIds.split(",");
      const filtered = oldList.filter((_) => _ != _newId);
      const newList =
        filtered.length == oldList.length ? [...oldList, _newId] : filtered;
      setValue("job_type_ids", newList.join(","));
    },
    [jobTypeIds, setValue]
  );
  const onClearSearch = useCallback(() => {
    reset();
  }, [reset]);

  const onDetail = useCallback(async (_seeker: any) => {
    try {
      const seekerId = getSeekerId(_seeker);
      let list: any[] = [];
      try {
        list = await apiV2Client.getCompanyViewUserResumes(String(seekerId));
      } catch {
        list = await apiV2Client.getPublicUserResumes(String(seekerId)).catch(() => [] as any[]);
      }
      const resume = (list || []).find((r: any) => r.is_active) || (list || [])[0] || null;
      setSelectedSeeker(resume ? { ..._seeker, resume } : _seeker);
    } catch {
      setSelectedSeeker(_seeker);
    }
  }, [getSeekerId]);

  const { mutate: sendMessage, isPending: sendingMessage } = useMessageToUser();
  // 検索パラメータの構築（API v2 準拠）
  const buildSearchParams = useCallback((form: any) => {
    const params: any = {};
    if (form.keyword) params.keyword = form.keyword;
    if (form.prefecture_ids) {
      const ids = form.prefecture_ids.split(',').filter((x: string) => x);
      const names = ids.map((id: string) => getPrefectureName(id)).filter(Boolean);
      if (names.length > 0) {
        params.prefectures = names.join(',');
        // 希望勤務地でも検索（OR条件でサーバー側が評価）
        params.desired_locations = names.join(',');
      }
    }
    if (form.industry_ids) {
      const names = getIndustryNames(form.industry_ids);
      if (names) {
        params.industries = names;
        // 希望業界でも検索（OR条件でサーバー側が評価）
        params.desired_industries = names;
      }
    }
    if (form.job_type_ids) {
      // 職種は名称で曖昧検索する（API v2はdesired_jobをicontains）
      const jobName = getFirstJobTypeName(form.job_type_ids);
      if (jobName) params.desired_job = jobName;
    }
    // 経験年数（ラジオ相当）
    if (form.exp_none) {
      params.experience_years_min = 0;
      params.experience_years_max = 0;
    } else if (form.exp_1_5) {
      params.experience_years_min = 1;
      params.experience_years_max = 3;
    } else if (form.exp_5_10) {
      params.experience_years_min = 5;
      params.experience_years_max = 10;
    } else if (form.exp_10) {
      params.experience_years_min = 10;
    }
    // 年収（万表記を想定: 100 -> 100万円）
    const normalizeSalary = (v: string) => {
      if (!v) return undefined;
      const digits = (v.match(/\d+/g) || []).join('');
      if (!digits) return undefined;
      const n = parseInt(digits, 10);
      if (isNaN(n)) return undefined;
      return n * 10000; // 万円 → 円
    };
    const minSalary = normalizeSalary(form.from_salary);
    const maxSalary = normalizeSalary(form.to_salary);
    if (minSalary !== undefined) params.min_salary = minSalary;
    if (maxSalary !== undefined) params.max_salary = maxSalary;
    return params;
  }, []);

  const onSearch = useCallback(async (_data: any) => {
    console.log(_data, 'data');
    setShowPrefectureModal(false);
    setShowJobTypeModal(false);
    setShowIndustryModal(false);
    setIsSearching(true);
    try {
      const params = buildSearchParams(_data);
      const resp: any = await apiV2Client.searchSeekers({ ...params, page: currentPage });
      const list = Array.isArray(resp) ? resp : (resp?.results ?? []);
      const count = (resp?.count ?? (Array.isArray(resp) ? resp.length : 0)) as number;
      const pageSize = (resp?.page_size ?? (list?.length || 20)) as number;
      const pages = (resp?.total_pages ?? Math.max(1, Math.ceil(count / Math.max(1, pageSize)))) as number;

      // ソート（クライアント側）
      const sorted = (() => {
        if (!sortKey) return list;
        const arr = [...list];
        switch (sortKey) {
          case 'newest':
            return arr.sort((a: any, b: any) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime());
          case 'match_high':
            return arr.sort((a: any, b: any) => (b.match_score || 0) - (a.match_score || 0));
          case 'salary_high':
            return arr.sort((a: any, b: any) => (b.desired_salary || 0) - (a.desired_salary || 0));
          case 'salary_low':
            return arr.sort((a: any, b: any) => (a.desired_salary || 0) - (b.desired_salary || 0));
          default:
            return arr;
        }
      })();

      setResults(sorted);
      setTotalCount(count || sorted.length);
      setTotalPages(pages);
    } catch (e) {
      console.error('Search error', e);
      toast.error('検索に失敗しました');
    } finally {
      setIsSearching(false);
    }
  }, [buildSearchParams, currentPage, sortKey]);

  // 初期ロード: 空条件で検索（ページネーション初期化）
  useEffect(() => {
    handleSubmit(onSearch)();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ページ変更時に再検索
  useEffect(() => {
    handleSubmit(onSearch)();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, sortKey]);


  // v2: スカウト送信
  const sendScoutV2 = useCallback(async (message: string, seekerArg?: any) => {
    const target = seekerArg || selectedSeeker;
    if (!target) return;
    try {
      // 検索結果はSeekerProfileを返すため、userが本来のユーザーUUID
      const seekerId = getSeekerId(target);
      if (appliedCompanies.includes(seekerId)) {
        toast.error('既にこの求職者へスカウト済みです');
        return;
      }
      const res = await apiV2Client.createScout({
        seeker: seekerId,
        scout_message: message,
      });
      toast.success('スカウトを送信しました');
      setAppliedCompanies((prev) => [...new Set([...prev, seekerId])]);
    } catch (e: any) {
      console.error('Failed to send scout:', e?.response?.data || e);
      const status = e?.response?.status;
      const data = e?.response?.data || {};
      if (status === 402 && (data?.error === 'insufficient_credits')) {
        toast.error('スカウトの送信上限に達しました。追加100通（¥10,000）をご購入ください。');
        try { router.push('/companyinfo/payment'); } catch {}
      } else {
        const msg = data?.detail || data?.error || 'スカウト送信に失敗しました';
        toast.error(msg);
      }
    }
  }, [selectedSeeker, getSeekerId, appliedCompanies]);

  // 旧scoutフローは廃止（v2 APIに統一）


  return (
    <div className="w-full flex flex-col gap-6">
      <section className="px-12 text-primary-default flex flex-col gap-6 justify-start">
        <h2 className="text-[28px]">求職者の検索</h2>
        <p className="text-base">登録している求職者の検索が行えます。</p>
      </section>
      <section className="w-full">
        {/* Job tickets summary */}
        <div className="mb-6 bg-white border rounded-lg p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div>
              <div className="text-sm text-gray-700 mb-1">求人チケット状況</div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <select
                  className="w-full sm:w-auto border rounded px-3 py-2 text-sm"
                  value={selectedJobId}
                  onChange={(e)=>setSelectedJobId(e.target.value)}
                >
                  {(jobs || []).map((j) => (
                    <option key={String(j.id)} value={String(j.id)}>{j.title || String(j.id)}</option>
                  ))}
                </select>
                {jobTickets ? (
                  <div className="text-sm text-gray-900">
                    残: <span className="font-medium">{jobTickets.tickets_remaining}</span> / {jobTickets.tickets_total}（消費: {jobTickets.tickets_used}）
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">選択中の求人にチケットがありません</div>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-700 mb-1">面接確定（1チケット消費）</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                <select
                  className="w-full border rounded px-3 py-2 text-sm h-10"
                  value={selectedSeekerId}
                  onChange={(e)=>setSelectedSeekerId(e.target.value)}
                >
                  <option value="">候補者を選択</option>
                  {pageSeekerOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <input
                  className="w-full border rounded px-3 py-2 text-sm h-10"
                  placeholder="面接日（任意：2025-01-15）"
                  value={consumeInterviewDate}
                  onChange={(e)=>setConsumeInterviewDate(e.target.value)}
                />
                <button
                  className={`w-full h-10 px-4 rounded text-white ${consuming ? 'bg-gray-400' : 'bg-gray-800 hover:bg-gray-900'}`}
                  disabled={consuming || !selectedJobId || !selectedSeekerId}
                  onClick={async ()=>{
                    if (!selectedJobId) { toast.error('求人を選択してください'); return; }
                    if (!selectedSeekerId) { toast.error('候補者を選択してください'); return; }
                    setConsuming(true);
                    try {
                      const payload: any = { seeker: selectedSeekerId };
                      if (consumeInterviewDate.trim()) payload.interview_date = consumeInterviewDate.trim();
                      const updated = await apiV2Client.consumeJobTicket(selectedJobId, payload);
                      setJobTickets(updated as any);
                      toast.success('面接確定としてチケットを1消費しました');
                      setSelectedSeekerId('');
                      setConsumeInterviewDate('');
                    } catch (e: any) {
                      const status = e?.response?.status;
                      const data = e?.response?.data || {};
                      if (status === 409 && data?.error === 'no_tickets') {
                        toast.error('選択中の求人にチケット残がありません');
                      } else if (status === 409 && data?.error === 'already_consumed_for_seeker') {
                        toast.error('この求職者はすでに消費済みです');
                      } else {
                        toast.error(data?.detail || 'チケットの消費に失敗しました');
                      }
                    } finally {
                      setConsuming(false);
                    }
                  }}
                >
                  {consuming ? '処理中…' : '面接確定'}
                </button>
              </div>
              <div className="mt-3 text-sm text-gray-700">候補日をまとめて提案（任意）</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 mt-1">
                <input className="w-full border rounded px-3 py-2 text-sm h-10" placeholder="候補1（2025-01-15T10:00:00+09:00）" value={slot1} onChange={(e)=>setSlot1(e.target.value)} />
                <input className="w-full border rounded px-3 py-2 text-sm h-10" placeholder="候補2（任意）" value={slot2} onChange={(e)=>setSlot2(e.target.value)} />
                <input className="w-full border rounded px-3 py-2 text-sm h-10" placeholder="候補3（任意）" value={slot3} onChange={(e)=>setSlot3(e.target.value)} />
                <button
                  className={`w-full h-10 px-4 rounded text-white ${proposing ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                  disabled={proposing || !selectedJobId || !selectedSeekerId}
                  onClick={async ()=>{
                    if (!selectedJobId) { toast.error('求人を選択してください'); return; }
                    if (!selectedSeekerId) { toast.error('候補者を選択してください'); return; }
                    const vals = [slot1, slot2, slot3].map(s=>s.trim()).filter(Boolean);
                    if (vals.length === 0) { toast.error('候補日を1件以上入力してください'); return; }
                    setProposing(true);
                    try {
                      const slots = vals.map(v => ({ start: v, end: v }));
                      await apiV2Client.proposeInterviewSlots(selectedJobId, { seeker: selectedSeekerId, slots });
                      toast.success('候補日を提案しました');
                      setSlot1(''); setSlot2(''); setSlot3('');
                    } catch {
                      toast.error('候補日の提案に失敗しました');
                    } finally {
                      setProposing(false);
                    }
                  }}
                >
                  {proposing ? '送信中…' : '候補提案'}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full h-[50px] grid grid-cols-3 gap-3">
          {search_filters.map((_item) => (
            <div
              className="px-4 py-2 min-h-[50px] bg-gray-30 rounded-xl text-white border bg-[#4D433F] flex flex-col items-center justify-center cursor-pointer"
              key={`filter-condition-${_item.value}`}
              onClick={onShowFilterModals(_item.value)}
            >
              <span className="text-wrap text-center">{_item.label}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="w-full text-base text-primary-default flex flex-col justify-start gap-3">
        <div className="flex flex-row gap-2 items-center">
          <span className="w-1 h-4 bg-primary-active" />
          <span>フリーワード</span>
        </div>
        <Controller
          control={control}
          name="keyword"
          render={({ field: { value, onChange } }) => (
            <DefaultInput
              value={value}
              onChange={onChange}
              placeholder="キーワードを入力してください"
            />
          )}
        />
      </section>
      <section className="w-full text-base text-primary-default flex flex-col justify-start gap-3">
        <div className="flex flex-row gap-2 items-center">
          <span className="w-1 h-4 bg-primary-active" />
          <span>年収</span>
        </div>
        <div className="w-full flex flex-row items-center gap-2">
          <Controller
            control={control}
            name="from_salary"
            render={({ field: { value, onChange } }) => (
              <DefaultInput
                value={value}
                onChange={onChange}
                placeholder="100万円"
                className="flex-1"
              />
            )}
          />
          <span className="">～</span>
          <Controller
            control={control}
            name="to_salary"
            render={({ field: { value, onChange } }) => (
              <DefaultInput
                value={value}
                onChange={onChange}
                placeholder="1000万円"
                className="flex-1"
              />
            )}
          />
        </div>
      </section>
      <section className="w-full text-base text-primary-default flex flex-col justify-start gap-3">
        <div className="flex flex-row gap-2 items-center">
          <span className="w-1 h-4 bg-primary-active" />
          <span>経験年数</span>
        </div>
        <div className="grid grid-cols-2 gap-y-2">
          <Controller
            control={control}
            name="exp_none"
            render={({ field: { value, onChange } }) => (
              <CheckInputConditions
                checked={value}
                label={"未経験"}
                name="exp_none"
                onClick={() => onChange(!value)}
              />
            )}
          />
          <Controller
            control={control}
            name="exp_1_5"
            render={({ field: { value, onChange } }) => (
              <CheckInputConditions
                checked={value}
                label={"1～3年"}
                name="exp_1_5"
                onClick={() => onChange(!value)}
              />
            )}
          />
          <Controller
            control={control}
            name="exp_5_10"
            render={({ field: { value, onChange } }) => (
              <CheckInputConditions
                checked={value}
                label={"5～10年"}
                name="exp_5_10"
                onClick={() => onChange(!value)}
              />
            )}
          />
          <Controller
            control={control}
            name="exp_10"
            render={({ field: { value, onChange } }) => (
              <CheckInputConditions
                checked={value}
                label={"10年以上"}
                name="exp_10"
                onClick={() => onChange(!value)}
              />
            )}
          />
        </div>
      </section>
      <section className="w-full text-base text-primary-default flex flex-col justify-start gap-3">
        <div className="flex flex-row gap-2 items-center">
          <span className="w-1 h-4 bg-primary-active" />
          <span>年齢層</span>
        </div>
        <div className="grid grid-cols-2 gap-y-2">
          <Controller
            control={control}
            name="age_20"
            render={({ field: { value, onChange } }) => (
              <CheckInputConditions
                checked={value}
                label={"20代"}
                name="age_20"
                onClick={() => onChange(!value)}
              />
            )}
          />
          <Controller
            control={control}
            name="age_30"
            render={({ field: { value, onChange } }) => (
              <CheckInputConditions
                checked={value}
                label={"30代"}
                name="age_30"
                onClick={() => onChange(!value)}
              />
            )}
          />
          <Controller
            control={control}
            name="age_40"
            render={({ field: { value, onChange } }) => (
              <CheckInputConditions
                checked={value}
                label={"40代"}
                name="age_40"
                onClick={() => onChange(!value)}
              />
            )}
          />
          <Controller
            control={control}
            name="age_50"
            render={({ field: { value, onChange } }) => (
              <CheckInputConditions
                checked={value}
                label={"50代以上"}
                name="age_50"
                onClick={() => onChange(!value)}
              />
            )}
          />
        </div>
      </section>
      <section className="w-full grid grid-cols-2 gap-4">
        <button
          type="button"
          className="py-3 rounded-xl text-base bg-white text-primary-700 border border-primary-500 flex flex-row justify-center items-center cursor-pointer hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-300"
          onClick={onClearSearch}
        >
          <span>条件をクリアする</span>
        </button>
        <button
          className="py-3 bg-primary-600 rounded-xl text-base text-white flex flex-row justify-center items-center cursor-pointer hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-300"
          disabled={isSearching}
          onClick={handleSubmit(onSearch)}
        >
          <span>この条件で検索する</span>
        </button>
      </section>
      <div className="pt-4 pb-2 md:pt-8 md:pb-6 w-full flex flex-row justify-end">
        <div className="w-[213px]">
          <DefaultSelect
            instanceId="sort_by"
            options={sortOptions}
            value={sortOptions.find(o => o.value === sortKey)}
            placeholder="条件で並び替え"
            onChange={(opt: any) => {
              setSortKey(opt?.value);
            }}
          />
        </div>
      </div>
      {/* Bulk scout to all seekers on this page */}
      <div className="mb-6 bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-700">このページの対象: <span className="font-medium text-gray-900">{results.length}</span> 名</div>
          <div className="text-xs text-gray-500">既にスカウト済みの方は自動的に除外されます</div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-start">
          <textarea
            className="lg:col-span-2 w-full border rounded px-3 py-2 text-sm min-h-[70px]"
            placeholder="一括スカウトのメッセージを入力"
            value={bulkMsg}
            onChange={(e)=>setBulkMsg(e.target.value)}
          />
          <button
            className={`w-full h-10 px-4 rounded text-white ${bulkSending ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'}`}
            disabled={bulkSending || results.length === 0}
            onClick={async ()=>{
              const msg = (bulkMsg || '').trim();
              if (!msg) { toast.error('メッセージを入力してください'); return; }
              const ids: string[] = (results || []).map((r:any) => String(r.user || r.id)).filter(Boolean);
              const targets = ids.filter(id => !appliedCompanies.includes(id));
              if (targets.length === 0) { toast.error('送信対象がありません（全員スカウト済み）'); return; }
              setBulkSending(true);
              let ok = 0; let fail = 0; let stopped = false;
              for (const seekerId of targets) {
                try {
                  await apiV2Client.createScout({ seeker: seekerId, scout_message: msg });
                  ok += 1;
                  setAppliedCompanies(prev => [...new Set([...prev, seekerId])]);
                } catch (e:any) {
                  fail += 1;
                  const status = e?.response?.status;
                  const data = e?.response?.data || {};
                  if (status === 402 && data?.error === 'insufficient_credits') {
                    toast.error(`スカウト上限に達しました（成功 ${ok} 件）`);
                    stopped = true;
                    break;
                  }
                }
              }
              if (!stopped) {
                toast.success(`一括スカウト完了（成功 ${ok} 件 / 失敗 ${fail} 件）`);
              }
              setBulkSending(false);
            }}
          >
            {bulkSending ? '送信中…' : '一括送信'}
          </button>
        </div>
      </div>
      {results && results.length > 0
        ? results.map((_seeker: any) => (
            <SeekerCard
              detail={_seeker}
              onDetail={() => onDetail(_seeker)}
              onScout={() => setSelectedSeeker(_seeker)}
              isScouting={false}
              isScouted={appliedCompanies.includes(_seeker.user || _seeker.id)}
              key={`seeker-${_seeker.id}`}
            />
          ))
        : null}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-6">
          <button
            className="px-3 py-1 rounded border bg-white text-gray-800 border-gray-300 hover:bg-gray-50 disabled:opacity-60 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-300"
            disabled={currentPage <= 1 || isSearching}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }).slice(0, 10).map((_, i) => {
            const page = i + 1;
            return (
              <button
                key={`page-${page}`}
                className={`px-3 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-primary-300 ${
                  currentPage === page
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                }`}
                disabled={isSearching}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            );
          })}
          {totalPages > 10 && (
            <span className="px-2">…</span>
          )}
          <button
            className="px-3 py-1 rounded border bg-white text-gray-800 border-gray-300 hover:bg-gray-50 disabled:opacity-60 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-300"
            disabled={currentPage >= totalPages || isSearching}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            ›
          </button>
        </div>
      )}

      <Controller
        control={control}
        name="prefecture_ids"
        render={({ field: { value } }) => (
          <PrefectureModal
            isOpen={showPrefectureModal}
            idList={value.split(",")}
            onTogglePrefecture={onTogglePrefecture}
            onClose={onTogglePrefectureModal}
            onConfirm={handleSubmit(onSearch)}
          />
        )}
      />
      <Controller
        control={control}
        name="industry_ids"
        render={({ field: { value } }) => (
          <IndustryModal
            isOpen={showIndustryModal}
            idList={value.split(",")}
            onToggleIndustry={onToggleIndustry}
            onClose={onToggleIndustryModal}
            onConfirm={handleSubmit(onSearch)}
          />
        )}
      />
      <Controller
        control={control}
        name="job_type_ids"
        render={({ field: { value } }) => (
          <JobTypesModal
            isOpen={showJobTypeModal}
            idList={value.split(",")}
            onToggleJobType={onToggleJobType}
            onClose={onToggleJobTypeModal}
            onConfirm={handleSubmit(onSearch)}
          />
        )}
      />
      <JobSeekerDetailModal
        detail={selectedSeeker}
        isOpen={!!selectedSeeker}
        isSendingMessage={sendingMessage}
        closeLabel="閉じる"
        confirmLabel={"スカウトする"}
        onClose={onToggleDetailModal}
        sendMessage={sendMessage}
        onConfirm={() => { /* no-op: onScout で送信 */ }}
        onScout={async (msg: string) => {
          if (!msg || !msg.trim()) {
            toast.error('スカウトメッセージを入力してください');
            return;
          }
          try {
            await sendScoutV2(msg);
            onToggleDetailModal();
          } catch (e) {
            // エラー時はモーダルを開いたままにする
          }
        }}
      />
    </div>
  );
}

const search_filters = [
  {
    label: "勤務可能地を選ぶ",
    value: "location",
  },
  {
    label: "業種を選ぶ",
    value: "industry",
  },
  {
    label: "職種を選ぶ",
    value: "job_type",
  },
];

const sortOptions = [
  { value: "newest", label: "新着順" },
  { value: "match_high", label: "マッチ度が高い順" },
  { value: "salary_high", label: "希望年収が高い順" },
  { value: "salary_low", label: "希望年収が低い順" },
];

const experience_years = [
  {
    label: "未経験",
    value: "none",
  },
  {
    label: "1～3年",
    value: "1~3",
  },
  {
    label: "5～10年",
    value: "5~10",
  },
  {
    label: "10年以上",
    value: "10",
  },
];
