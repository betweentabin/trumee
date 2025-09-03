"use client";

import { useCallback, useEffect, useState } from "react";
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
import search from "../api/api";
import { getPrefectureName } from '@/components/content/common/prefectures';
import { getIndustryNames, getFirstJobTypeName } from '@/components/helpers/jobTypeHelper';

export default function Search() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, currentUser, initializeAuth } = useAuthV2();
  const authState = useAppSelector(state => state.authV2);
  
  const [results, setResults] = useState<any[]>([]);
  const [isScouting, setIsScouting] = useState<boolean>(false);

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
    if (isAuthenticated === false) {
      // 認証されていない場合は企業ログインページにリダイレクト
      toast.error('企業ログインが必要です');
      router.push('/auth/company/login');
      return;
    }
    
    if (isAuthenticated && currentUser) {
      // 企業ロールチェック
      if (currentUser.role !== 'company') {
        toast.error('企業アカウントでログインしてください');
        router.push('/auth/company/login');
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
      })();
    }
  }, [isAuthenticated, currentUser, router, pathname]);

  // 認証チェック中はローディング表示
  if (isAuthenticated === null) {
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

  const onDetail = useCallback((_seeker: any) => {
    setSelectedSeeker(_seeker);
  }, []);

  const getSeekerId = useCallback((s: any) => (s?.user || s?.seeker?.id || s?.id), []);

  const { mutate: sendMessage, isPending: sendingMessage } = useMessageToUser();
  // 検索パラメータの構築（API v2 準拠）
  const buildSearchParams = useCallback((form: any) => {
    const params: any = {};
    if (form.keyword) params.keyword = form.keyword;
    if (form.prefecture_ids) {
      const ids = form.prefecture_ids.split(',').filter((x: string) => x);
      const names = ids.map((id: string) => getPrefectureName(id)).filter(Boolean);
      if (names.length > 0) params.prefectures = names.join(',');
    }
    if (form.industry_ids) {
      const names = getIndustryNames(form.industry_ids);
      if (names) params.industries = names;
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

  const [isSearching, setIsSearching] = useState(false);
  const onSearch = useCallback(async (_data: any) => {
    console.log(_data, 'data');
    setShowPrefectureModal(false);
    setShowJobTypeModal(false);
    setShowIndustryModal(false);
    setIsSearching(true);
    try {
      const params = buildSearchParams(_data);
      const resp = await apiV2Client.searchSeekers(params);
      const arr = Array.isArray(resp) ? resp : (resp?.results ?? []);
      setResults(arr);
    } catch (e) {
      console.error('Search error', e);
      toast.error('検索に失敗しました');
    } finally {
      setIsSearching(false);
    }
  }, [buildSearchParams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await search(); // legacy helper
        console.log("Fetched data:", data);
        setResults(Array.isArray(data) ? data : (data?.results ?? []));
      } catch (error) {
        console.error("Error fetching search data:", error);
      }
    };

    fetchData();
  }, []);


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
      const msg = e?.response?.data?.detail || e?.response?.data?.error || 'スカウト送信に失敗しました';
      toast.error(msg);
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
        <div
          className="py-3 rounded-xl text-white text-base bg-[#868282] flex flex-row justify-center items-center cursor-pointer hover:bg-orange-70 active:bg-orange-60 hover:text-primary-active"
          onClick={onClearSearch}
        >
          <span>条件をクリアする</span>
        </div>
        <button
          className="py-3 bg-[#FF733E] rounded-xl text-base text-white flex flex-row justify-center items-center cursor-pointer hover:bg-orange-70 active:bg-orange-60 hover:text-primary-active"
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
            value={undefined}
            placeholder="条件で並び替え"
            onChange={(_value) => {
              // TODO: Implement sorting logic
              console.log('Sort by:', _value);
            }}
          />
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
