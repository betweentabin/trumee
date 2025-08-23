/**
 * * Business modal
 */

import { DefaultModal } from ".";
import { CheckInputConditions } from "../pure/input";
import DefaultButton from "../pure/button/default";

import { industriesByCategory, industryCategories } from "../content/common/industry";

interface Props {
  isOpen: boolean;
  idList: string[]; // array of selected industry ids
  onToggleIndustry: (_industryId: string) => () => void;
  onClose: () => void;
  onConfirm: () => void;
}

const IndustryModal = ({
  isOpen,
  idList,
  onToggleIndustry,
  onClose,
  onConfirm,
}: Props) => {
  return (
    <DefaultModal isOpen={isOpen} onClose={onClose}>
      <div className="py-6 px-3 w-full flex flex-col items-center gap-4 max-h-[90vh] overflow-y-auto">
        <div className="w-full flex flex-col gap-4">
          {industryCategories.map((_category) => (
            <div
              className="w-full flex flex-col gap-4"
              key={`industry-category-${_category.id}`}
            >
              <CheckInputConditions
                checked={false}
                name={_category.name}
                label={_category.name}
                onClick={() => {}}
              />
              <div className="pl-4 w-full flex flex-col gap-4 lg:grid lg:grid-cols-2">
                {industriesByCategory(_category.id).map((_item: any) => (
                  <CheckInputConditions
                    checked={idList.includes(_item.id.toString())}
                    name={_item.name}
                    label={_item.name}
                    onClick={onToggleIndustry(_item.id.toString())}
                    key={`industry-${_item.id}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 md:gap-8">
          <button
            className="px-8 py-2 border border-border-default bg-[#868282] text-lg text-white flex items-center justify-center gap-x-2 rounded-lg active:bg-[#332a20]"
            onClick={onClose}
          >
            キャンセル
          </button>
          <DefaultButton
            onClick={onConfirm}
            variant="primary"
            className="text-lg"
          >
            この条件で検索する
          </DefaultButton>
        </div>
      </div>
    </DefaultModal>
  );
};

export default IndustryModal;
