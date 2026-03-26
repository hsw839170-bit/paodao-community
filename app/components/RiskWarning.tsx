import React from 'react';

interface RiskWarningProps {
  variant?: 'yellow' | 'red' | 'blue';
  className?: string;
}

export default function RiskWarning({ variant = 'yellow', className = '' }: RiskWarningProps) {
  const colors = {
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  };

  return (
    <div className={`rounded-xl p-4 border ${colors[variant]} ${className}`}>
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div className="text-sm">
          <p className="font-medium mb-1">⚠️ 线下交易风险提示</p>
          <p className="opacity-90">
            DeltaRun 目前仅提供<strong>信息撮合服务</strong>，不涉及资金托管。
            老板与跑手之间的资金交易（微信/支付宝转账等）请自行协商完成。
          </p>
          <p className="opacity-75 mt-2 text-xs">
            建议：首次交易选择小额订单，确认对方可信后再进行大额交易。
            如遇诈骗，请保留证据并报警，平台将配合提供相关信息。
          </p>
        </div>
      </div>
    </div>
  );
}
