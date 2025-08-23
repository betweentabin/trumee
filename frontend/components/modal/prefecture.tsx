/**
 * * Business modal
 */

import { useCallback, useState } from "react";
import { DefaultModal } from ".";
import { CheckInputConditions } from "../pure/input";
import DefaultButton from "../pure/button/default";

import { prefecturesByRegion, regions } from "../content/common/prefectures";

interface Props {
    isOpen: boolean;
    idList: string[]; // array of selected prefectures' ids
    onTogglePrefecture: (_prefectureId: string) => () => void;
    onClose: () => void;
    onConfirm: () => void;
}

const PrefectureModal = ({ isOpen, idList, onTogglePrefecture, onClose, onConfirm }: Props) => {
    const [activeRegion, setActiveRegion] = useState(1);
    const onRegionSelect = useCallback((regionId: number) => () => {
        setActiveRegion(regionId);
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl max-w-5xl w-full mx-8 shadow-xl">
                <div className="py-6 px-3 w-full flex flex-col items-center gap-4">
                    {/* Region Buttons */}
                    <div className="w-full grid grid-cols-4 lg:grid-cols-8 gap-3">
                        {regions.map((_region) => (
                            <div
                                className={`py-4 ${
                                    activeRegion === _region.id
                                        ? "bg-[#4D433F] text-white border border-primary-default"
                                        : "bg-gray-70 text-primary-default"
                                } text-base bg-[#868282] text-white cursor-pointer hover:opacity-80 text-center`}
                                onClick={onRegionSelect(_region.id)}
                                key={`region-${_region.id}`}
                            >
                                {_region.name}
                            </div>
                        ))}
                    </div>

                    {/* Prefecture Checkboxes */}
                    <div className="w-full grid grid-cols-2 lg:grid-cols-8 gap-3">
                        {prefecturesByRegion(activeRegion).map((_prefecture: any) => (
                            <CheckInputConditions
                                checked={idList.includes(_prefecture.id.toString())}
                                name={_prefecture.name}
                                label={_prefecture.name}
                                onClick={onTogglePrefecture(_prefecture.id.toString())}
                                key={`prefecture-select-${_prefecture.id}`}
                            />
                        ))}
                    </div>

                    {/* Buttons */}
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
            </div>
        </div>
    );
};

export default PrefectureModal;
