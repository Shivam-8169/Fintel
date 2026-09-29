import React from 'react';
import { ShieldAlert, ExternalLink } from 'lucide-react';

interface CitationChipProps {
  evidenceId: string;
  txId?: string;
  onClick?: () => void;
}

export const CitationChip: React.FC<CitationChipProps> = ({ evidenceId, txId, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Click to inspect underlying transaction evidence (${evidenceId})`}
      className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 my-0.5 rounded-md bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-mono text-[11px] font-bold transition-all shadow-sm active:scale-95 group"
    >
      <ShieldAlert className="w-3 h-3 text-cyan-400 group-hover:scale-110 transition-transform" />
      <span>{evidenceId}</span>
      {txId && <span className="text-slate-400 text-[10px]">({txId})</span>}
      <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
    </button>
  );
};
