import MessageBox from "@/components/pure/message-box";
import React, { useMemo } from "react";

const AdviceScreenTab = ({
  adviceTabs,
  selectedAdviceTab,
  setSelectedAdviceTab,
  selectedAdviceSubTab,
  setSelectedAdviceSubTab,
  adviceMessages,
  currentUserIdAdvice,
  sendingAdvice,
  handleSubmit,
  sendAdviceMessage,
  messageEndRef,
  reset,
  refetchAdvice,
  CircleMinus,
  CircleArrow,
  control,
  errors,
}: any) => {
  const getTypeKey = (tab: any, subKey?: string | null) => {
    if (!tab) return null;
    if (tab.isGroup) {
      if (!subKey) return null;
      const subTab = tab.subTabs?.find((s: any) => s.key === subKey);
      return subTab?.type || subTab?.key || tab.type || tab.key;
    }
    return tab.type || tab.key;
  };

  const currentTab = useMemo(
    () => adviceTabs.find((tab: any) => tab.key === selectedAdviceTab),
    [adviceTabs, selectedAdviceTab]
  );

  const resolvedAdviceType = useMemo(() => {
    const typeFromTab = getTypeKey(currentTab, selectedAdviceSubTab);
    if (typeFromTab) return typeFromTab;
    if (selectedAdviceTab === 'all') return 'all';
    // フォールバックとして key を返す
    return selectedAdviceSubTab || currentTab?.key || selectedAdviceTab;
  }, [currentTab, selectedAdviceTab, selectedAdviceSubTab]);

  // Filter messages according to selected tab/subTab
  const filteredMessages = useMemo(() => {
    if (!selectedAdviceTab) return adviceMessages || [];

    // 'all' タブは全件表示
    if (selectedAdviceTab === 'all') return adviceMessages || [];

    if (!currentTab) return adviceMessages || [];

    const typeKey = getTypeKey(currentTab, selectedAdviceSubTab);

    const matchesCategory = (msg: any) => {
      const messageType = msg.content?.type || msg.content?.topic;
      if (!typeKey) {
        // グループタブで未選択の場合はグループ key で比較
        const fallbackKey = selectedAdviceSubTab || currentTab.key;
        return messageType === fallbackKey;
      }
      if (messageType === typeKey) return true;
      if (selectedAdviceSubTab && messageType === selectedAdviceSubTab) return true;
      if (messageType === currentTab.key) return true;
      const messageTopic = msg.content?.topic;
      return messageTopic === typeKey || messageTopic === selectedAdviceSubTab;
    };

    if (currentTab.isGroup && !selectedAdviceSubTab) {
      // サブタブ未選択時は全件
      return adviceMessages || [];
    }

    return (adviceMessages || []).filter((msg: any) => matchesCategory(msg));
  
  }, [adviceMessages, currentTab, selectedAdviceSubTab, selectedAdviceTab]);


  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-white">
      {/* Left: Tabs */}
      <div className="w-full md:w-1/3 max-w-full md:max-w-[400px] bg-transparent border-b md:border-b-0 md:border-r border-black p-4 md:p-8 flex-shrink-0 overflow-auto">
        <div className="bg-white rounded-xl shadow border border-gray-200 p-4 flex flex-col gap-4 min-h-[150px] md:min-h-[calc(100vh-64px)]">
          {adviceTabs.map((tab: any, idx: number) => (
            <div key={tab.key} className="mb-2 last:mb-0">
              {tab.isGroup ? (
                <>
                  <div className="bg-[#F5F5F5] text-[#3A2F1C] font-bold px-4 py-2 rounded-t-lg border-b border-gray-200 text-base">
                    {tab.label}
                  </div>
                  <div className="flex flex-col">
                    {tab.subTabs?.map((sub: any, subIdx: number) => (
                      <button
                        key={sub.key}
                        className={`w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 text-base transition-colors duration-150
                          ${
                            selectedAdviceTab === tab.key && selectedAdviceSubTab === sub.key
                              ? "bg-[#FFF7E6] text-[#3A2F1C] font-bold"
                              : "bg-white text-[#3A2F1C] hover:bg-[#FFF7E6]"
                          }
                        `}
                        style={{
                          borderRadius:
                            subIdx === 0
                              ? "0 0 0 0"
                              : subIdx === tab.subTabs!.length - 1
                              ? "0 0 8px 8px"
                              : "0",
                        }}
                        onClick={() => {
                          setSelectedAdviceTab(tab.key);
                          setSelectedAdviceSubTab(sub.key);
                        }}
                      >
                        <span>{sub.label}</span>
                        <span className="ml-2 flex items-center">
                          {selectedAdviceTab === tab.key && selectedAdviceSubTab === sub.key
                            ? CircleMinus
                            : CircleArrow}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <button
                  className={`w-full flex items-center px-4 py-3 rounded-lg border border-gray-200 text-base transition-colors duration-150
                    ${
                      selectedAdviceTab === tab.key
                        ? "bg-[#FFF7E6] text-[#3A2F1C] font-bold"
                        : "bg-white text-[#3A2F1C] hover:bg-[#FFF7E6]"
                    }
                  `}
                  onClick={() => {
                    setSelectedAdviceTab(tab.key);
                    setSelectedAdviceSubTab(null);
                  }}
                >
                  <span>{tab.label}</span>
                  <span className="ml-2 flex items-center">
                    {selectedAdviceTab === tab.key ? CircleMinus : CircleArrow}
                  </span>
                </button>
              )}
              {idx !== adviceTabs.length - 1 && <div className="h-2" />}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Messages + Input */}
      <div className="flex-1 flex flex-col bg-white p-4 md:p-8 min-h-[500px] md:min-h-[900px]">
        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
          {filteredMessages.length === 0 && (
            <div className="text-gray-400 text-center py-8 text-sm">
              まだメッセージがありません。
            </div>
          )}
          {filteredMessages.map((msg: any) => {
            // 送信者が対象ユーザー（求職者）でなければ管理者とみなす
            const isAdmin = msg.senderId && currentUserIdAdvice
              ? String(msg.senderId) !== String(currentUserIdAdvice)
              : true;

            return (
              <div
                key={msg.id}
                className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`rounded-lg p-4 text-base shadow-md border border-gray-200 max-w-[80%] break-words
                    ${
                      isAdmin
                        ? "bg-gray-200 text-gray-900 rounded-l-none"
                        : "bg-[#4B3A2F] text-white rounded-r-none"
                    }
                  `}
                >
                  <div>{msg.content.message}</div>
                  <div className="text-xs text-gray-500 mb-1">
                    {new Date(msg.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messageEndRef} />
        </div>
        <div className="mt-4 border-t border-gray-300 pt-4">
          <MessageBox
            control={control}
            errors={errors}
            isPending={sendingAdvice}
            onSubmit={handleSubmit((data: any) => {
              const typeKey = resolvedAdviceType === 'all' ? null : resolvedAdviceType;
              if (!typeKey) return;
              sendAdviceMessage({ message: data.message, type: typeKey });
            })}
          />
        </div>
      </div>
    </div>
  );
};

export default AdviceScreenTab;
