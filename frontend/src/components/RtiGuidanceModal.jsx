import React from 'react';

export default function RtiGuidanceModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#121b2e]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#ffffff] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#c3c6d0] relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#c3c6d0]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#235eac] text-[24px]">menu_book</span>
            <h3 className="font-headline-md text-headline-md text-[#002548] font-bold">
              RTI Statutory Routing Guidance
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#737780] hover:text-[#121b2e] hover:bg-[#f1f3ff]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="py-4 space-y-4 font-body-md text-body-md text-[#43474f]">
          <div className="p-3 bg-[#e9edff] rounded-xl border border-[#c3c6d0]/40">
            <span className="font-label-sm text-label-sm uppercase font-bold text-[#002548] block mb-1">
              Section 6(1) — Proper Initial Filing
            </span>
            <p className="text-sm leading-relaxed text-[#121b2e]">
              An application must be submitted directly to the Public Information Officer (PIO) of the concerned public authority. Filing to an incorrect authority is the leading cause of statutory delay under the RTI Act.
            </p>
          </div>

          <div className="p-3 bg-[#fffbeb] rounded-xl border border-[#b7791f]/30">
            <span className="font-label-sm text-label-sm uppercase font-bold text-[#78350f] block mb-1">
              Section 6(3) — 5-Day Mandatory Transfer
            </span>
            <p className="text-sm leading-relaxed text-[#78350f]">
              If an application or part of it pertains to another public authority, the receiving PIO must transfer it to that authority within <strong>5 days</strong> and notify the applicant. However, in practice, inter-departmental transfers often take 30 to 180 days if disputed.
            </p>
          </div>

          <div>
            <h4 className="font-label-md text-label-md font-bold text-[#002548] mb-2">
              Best Practices for Clear Routing
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#43474f]">
              <li><strong>Be specific:</strong> Include work order numbers, location landmarks, and specific date ranges.</li>
              <li><strong>Identify administrative level:</strong> Distinguish between Municipal Corporation, State PWD, and National Highways.</li>
              <li><strong>Separate unrelated queries:</strong> Avoid bundling road maintenance and police complaints into a single application; file separate requests for distinct departments.</li>
              <li><strong>Review Ambiguous flags:</strong> If Event Horizon flags AMBIGUOUS, select the most relevant department or mention both with a Section 6(3) transfer caveat.</li>
            </ul>
          </div>
        </div>

        <div className="pt-4 border-t border-[#c3c6d0] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#123b66] hover:bg-[#002548] text-white font-label-md text-label-md font-bold rounded-lg shadow-xs transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
