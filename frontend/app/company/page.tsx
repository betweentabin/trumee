"use client";

import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { useMessageToUser,useScoutSeeker,useSearchSeekers  } from "@/components/company/queries/mutation";

import {
  IndustryModal,
  JobTypesModal,
  PrefectureModal,
} from "@/components/modal";

import { CheckInputConditions, DefaultInput } from "@/components/pure/input";
import SeekerCard from "./_component/seeker_card";
import { DefaultSelect } from "@/components/pure/select";
import JobSeekerDetailModal from "@/components/modal/jobseeker-detail";
import search, { applyScout, cancelScout } from "../api/api";

export default function Search() {
  const [resultList, setResultList] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [isScouting, setIsScouting] = useState<boolean>(false);

  const [showPrefectureModal, setShowPrefectureModal] = useState(false);
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [showJobTypeModal, setShowJobTypeModal] = useState(false);
  const [appliedCompanies, setAppliedCompanies] = useState<string[]>([]);

  const [currentUser, setCurrentUser] = useState<any>();

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
    setCurrentUser(undefined);
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
    setCurrentUser(_seeker);
  }, []);

  const { mutate: sendMessage, isPending: sendingMessage } = useMessageToUser();
  /**
   * * search handler
   */
  const onSearchResponse = useCallback((_data: any) => {
    console.log("search response", _data);
    try {
      const { list, count } = _data;
      setResultList(list);
    } catch (err) {
      console.log("Error", err);
    }
  }, []);

  const { isPending: isSearching, mutate: searchSeekers } =
    useSearchSeekers(onSearchResponse);
  const onSearch = useCallback(
    
    (_data: any) => {
      console.log(_data, 'data');
      setShowPrefectureModal(false);
      setShowJobTypeModal(false);
      setShowIndustryModal(false);
      searchSeekers(_data);
    },
    [searchSeekers]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await search(); // <-- get returned data
        console.log("Fetched data:", data);
        setResults(data);           // <-- store it in state if needed
      } catch (error) {
        console.error("Error fetching search data:", error);
      }
    };

    fetchData();
  }, []);

  /**
   * * scout handler
   */
  const onScoutResponse = useCallback((_data: any) => {
    const isUnscout = _data.isUnscout;
    const scoutData = _data.scout;
    setResultList((oldList: any[]) => {
      return oldList.map((_item: any) =>
        _item.userId == scoutData.receiverId
          ? {
              ..._item,
              scouts: isUnscout ? [] : [scoutData],
            }
          : _item
      );
    });
  }, []);
  
  const { mutate: scoutSeeker } =
    useScoutSeeker(onScoutResponse);
  const onScout = useCallback(
    (data: any) => () => {
      // console.log(data,'dat');
      
      scoutSeeker(data);
      setCurrentUser(undefined);
    },
    [scoutSeeker]
  );

  const scout = async(data: any) => {
    setIsScouting(true); // if global or per company loading state
  try {
    if (appliedCompanies.includes(data.id)) {
      // cancel application API call
      await cancelScout(data);
      console.log('1');
      
      setAppliedCompanies(prev => prev.filter(id => id !== data.id));
    } else {
      // apply API call
      
      await applyScout(data);
      
      setAppliedCompanies(prev => [...prev, data.id]);
    }
  } catch (error) {
    console.error(error);
  } finally {
    setIsScouting(false);
  }
  }


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
              onScout={() => scout(_seeker)}
              isScouting={false}
              isScouted={appliedCompanies.includes(_seeker.id)}
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
        detail={currentUser}
        isOpen={!!currentUser}
        isSendingMessage={sendingMessage}
        closeLabel="閉じる"
        confirmLabel={
          currentUser?.scouts?.length > 0 ? "スカウトを取り消す" : "スカウトする"
        }
        onClose={onToggleDetailModal}
        sendMessage={sendMessage}
        onConfirm={() => currentUser && scout(currentUser)}
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
