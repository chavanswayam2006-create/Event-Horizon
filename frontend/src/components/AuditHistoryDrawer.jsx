import React from 'react';

export default function AuditHistoryDrawer({
  isOpen,
  onClose,
  history = [],
  onSelectHistoryItem,
  onClearHistory
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#121b2e]/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-[#ffffff] h-full shadow-2xl flex flex-col border-l border-[#c3c6d0]">
        {/* Header */}
        <div className="p-4 border-b border-[#c3c6d0] flex items-center justify-between bg-[#f9f9ff]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#235eac] text-[22px]">history</span>
            <div>
              <h3 className="font-headline-md text-headline-md text-[#002548] font-bold">
                Session Audit History
              </h3>
              <p className="font-body-sm text-body-sm text-[#43474f]">
                {history.length} {history.length === 1 ? 'analysis' : 'analyses'} recorded this session
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737780] hover:text-[#121b2e] hover:bg-[#e9edff]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#737780]">
              <span className="material-symbols-outlined text-[40px] text-[#c3c6d0] mb-2">find_in_page</span>
              <p className="font-body-md text-body-md font-medium text-[#121b2e]">No inquiries analyzed yet</p>
              <p className="font-body-sm text-body-sm mt-1">Run an analysis to inspect jurisdiction audit logs and decisions.</p>
            </div>
          ) : (
            history.map((item, idx) => {
              const badgeClass =
                item.result.decision === 'CLEAR'
                  ? 'bg-[#dcfce7] text-[#15803d] border-[#15803d]/30'
                  : item.result.decision === 'AMBIGUOUS'
                  ? 'bg-[#fef3c7] text-[#b7791f] border-[#b7791f]/30'
                  : 'bg-[#d6e3ff] text-[#235eac] border-[#235eac]/30';

              return (
                <div
                  key={idx}
                  onClick={() => {
                    onSelectHistoryItem(item);
                    onClose();
                  }}
                  className="p-3.5 rounded-xl border border-[#c3c6d0] bg-[#f9f9ff] hover:bg-[#f1f3ff] hover:border-[#235eac]/50 cursor-pointer transition-all shadow-xs group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${badgeClass}`}>
                      ● {item.result.decision}
                    </span>
                    <span className="text-[11px] text-[#737780] font-mono">
                      {item.timestamp || 'Just now'}
                    </span>
                  </div>

                  <p className="font-body-sm text-body-sm text-[#121b2e] font-medium line-clamp-2 mb-2">
                    {item.text}
                  </p>

                  <div className="flex items-center justify-between text-xs text-[#43474f] pt-1.5 border-t border-[#c3c6d0]/40">
                    <span>
                      Confidence: <strong className="text-[#121b2e]">{(item.result.confidence * 100).toFixed(0)}%</strong>
                    </span>
                    <span className="text-[#235eac] group-hover:underline flex items-center gap-0.5">
                      View details →
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-[#c3c6d0] bg-[#f9f9ff] flex items-center justify-between">
            <button
              type="button"
              onClick={onClearHistory}
              className="text-xs text-[#ba1a1a] hover:underline font-semibold"
            >
              Clear Session History
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-[#e9edff] hover:bg-[#d9e2fc] text-[#002548] font-label-sm text-label-sm font-bold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
