/**
 * * Seeker plans select modal
 */

import { useCallback, useMemo, useState, useEffect } from "react";

import { LargeModal } from ".";
import { CheckInputConditions } from "../pure/input";
import DefaultButton from "../pure/button/default";
import { SEEKER_PLANS } from "../content/common/plans";

interface Props {
  isOpen: boolean;
  isConfirming?: boolean;
  currentPlanIdList: number[];
  onClose: () => void;
  onConfirm: (planIdList: number[]) => void;
}

const free_plans = SEEKER_PLANS.filter((_item) => _item.price == 0);

const SeekerPlansModal = ({
  isOpen,
  currentPlanIdList,
  onClose,
  onConfirm,
  isConfirming,
}: Props) => {
  const [planIdList, setPlanIdList] = useState<number[]>([]);

  // Initialize planIdList with current user's subscribed plans when modal opens
  useEffect(() => {
    if (isOpen) {
      setPlanIdList(currentPlanIdList);
    }
  }, [isOpen, currentPlanIdList]);

  const onPlanToggle = useCallback(
    (planId: number) => () => {
      setPlanIdList((oldIdList) => {
        if (oldIdList.includes(planId)) {
          let filterIdList = [planId];
          const _plan = SEEKER_PLANS.find((_item) => _item.id == planId);
          const _parentPlanList = SEEKER_PLANS.filter((_item) => {
            if (_item.feature.length == 0) return false;
            const _featureIdList = _item.feature.map((_subItem) => _subItem.id);
            return _featureIdList.includes(planId);
          }).map((_item) => _item.id);
          if (_plan?.feature && _plan.feature.length > 0) {
            filterIdList = [
              ...filterIdList,
              ..._plan.feature.map((_item) => _item.id),
            ];
          }
          if (_parentPlanList.length > 0) {
            filterIdList = [...filterIdList, ..._parentPlanList];
          }

          const newIdList = oldIdList.filter(
            (_id) => !filterIdList.includes(_id)
          );

          return newIdList;
        } else {
          let newIdList = [...oldIdList, planId];
          const _plan = SEEKER_PLANS.find((_item) => _item.id == planId);
          const _parentPlanList = SEEKER_PLANS.filter((_item) => {
            if (_item.feature.length == 0) return false;
            const _featureIdList = _item.feature.map((_subItem) => _subItem.id);
            let included = true;

            for (let i = 0; i < _featureIdList.length; i++) {
              if (!newIdList.includes(_featureIdList[i])) {
                included = false;
                break;
              }
            }
            return included;
          }).map((_item) => _item.id);

          if (_plan?.feature && _plan.feature.length > 0) {
            const filterIdList = _plan.feature.map((_item) => _item.id);
            const _idList = newIdList.filter(
              (_id) => !filterIdList.includes(_id)
            );

            newIdList = [..._idList, ...filterIdList];
          }

          return [...newIdList, ..._parentPlanList];
        }
      });
    },
    []
  );

  const currentPlans = useMemo(() => {
    return SEEKER_PLANS.filter((_item) => currentPlanIdList.includes(_item.id));
  }, [currentPlanIdList]);
  const onOK = useCallback(() => {
    const _parentList = SEEKER_PLANS.filter((_item) => {
      if (_item.feature.length == 0) return false;

      let isIncluded = true;
      for (let i = 0; i < _item.feature.length; i++) {
        if (!planIdList.includes(_item.id)) {
          isIncluded = false;
          break;
        }
      }
      return isIncluded;
    });
    const _parentIdList = _parentList.map((_item) => _item.id);
    const _childIdList = _parentList.reduce((acc: number[], plan: any) => {
      if (plan.feature.length == 0) return acc;
      const idsFromFeatures = plan.feature.map((item: any) => item.id);
      return [...acc, ...idsFromFeatures];
    }, []);
    const filteredIdList = planIdList.filter(
      (_id) => !_parentIdList.includes(_id) && !_childIdList.includes(_id)
    );
    const realPlanIds = [...filteredIdList, ..._parentIdList];
    onConfirm(realPlanIds);
  }, [planIdList, onConfirm]);

  return (
    <LargeModal isOpen={isOpen} onClose={onClose}>
      <div className="py-6 px-3 w-full flex flex-col items-center gap-4">
        <div className="w-full flex flex-col md:flex-row md:justify-between gap-6">
          <div className="w-full md:w-1/3 flex flex-col gap-2">
            <div className="text-xl flex flex-col gap-4">
              <span className="">現在のプラン：</span>
              <span className="">
                {currentPlanIdList.length == 0
                  ? free_plans.map((_item) => _item.label).join(",")
                  : currentPlans.map((_item) => _item.label).join(",")}
              </span>
            </div>
            {currentPlanIdList.length == 1
              ? currentPlans[0].feature.length > 0
                ? currentPlans[0].feature.map((_item) => (
                    <span
                      className="text-base"
                      key={`current-plan-feature-${_item.id}`}
                    >
                      {_item.label}
                    </span>
                  ))
                : null
              : currentPlanIdList.length > 1
                ? currentPlans.map((_item) => (
                    <span
                      className="text-base"
                      key={`current-plan-feature-${_item.id}`}
                    >
                      {_item.label}
                    </span>
                  ))
                : null}
          </div>
          <div className="w-full md:w-2/3 flex flex-col gap-4 overflow-y-auto">
            {SEEKER_PLANS.map((_plan) => (
              <CheckInputConditions
                checked={_plan.price == 0 || planIdList.includes(_plan.id)}
                name={_plan.value}
                disabled={_plan.price == 0}
                label={`${_plan.label}${_plan.featureLabel ? `（${_plan.featureLabel}）` : ""}...${_plan.priceStr}`}
                onClick={onPlanToggle(_plan.id)}
                key={`seeker_plan_${_plan.id}`}
              />
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-col-reverse md:grid md:grid-cols-2 gap-4 md:gap-8">
        <button
                        className={`px-8 py-2 border-border-default bg-[#868282] text-lg text-white flex items-center justify-center gap-x-2 rounded-lg  relative active:bg-[#332a20]`}
                        onClick={onClose}
                    >
            キャンセル
          </button>
          <DefaultButton
            onClick={onOK}
            label="登録する"
            disabled={isConfirming ?? false}
            variant="primary"
            rounded={false}
            className="text-lg"
          />
        </div>
      </div>
    </LargeModal>
  );
};

export default SeekerPlansModal;
