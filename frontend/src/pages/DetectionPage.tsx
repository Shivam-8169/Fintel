import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Play,
  CheckCircle2,
  Layers,
  ArrowRight,
  Sliders,
  RefreshCw,
  Search,
  Activity,
  Zap,
  RotateCw,
  Split,
  Merge
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatINRText } from '../utils/currency';
import { getNeutralAccountId, getIndicatorPlainTitle } from '../utils/complianceNaming';
import { ComplianceTerm } from '../components/ComplianceTerm';
import LABELS from '../constants/labels';

export const DetectionPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypology, setSelectedTypology] = useState<string>('ALL');
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchDetection();
  }, []);

  const fetchDetection = async () => {
    try {
      setLoading(true);
      const res = await api.getDetectionResults();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load detection results:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunDetection = async () => {
    try {
      setRunning(true);
      setActionMsg(null);
      const res = await api.triggerDetection();
      setActionMsg(`Scan completed: ${res.accounts_evaluated} accounts checked, ${res.suspicious_cases_flagged} cases flagged for review.`);
      await fetchDetection();
    } catch (err: any) {
      console.error('Detection run failed:', err);
      setActionMsg('Failed to trigger activity scan.');
    } finally {
      setRunning(false);
    }
  };

  const typologies = [
    {
      id: 'high_value_transfers',
      name: 'Unusually Large Transfer',
      description: 'Flags single large transactions exceeding ₹5,00,000 regulatory reporting benchmark.',
      icon: Zap,
      badgeColor: 'text-amber-500 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20'
    },
    {
      id: 'rapid_fund_movement',
      name: 'Fast Pass-Through (In & Quickly Out)',
      description: 'Flags substantial funds arriving and swiftly transferred out within 24 hours (retaining >70% capital value).',
      icon: Activity,
      badgeColor: 'text-blue-500 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20'
    },
    {
      id: 'structuring_smurfing',
      name: 'Structuring (Just Below Limit)',
      description: 'Flags multiple repeated deposits made deliberately just below the ₹10 Lakh statutory reporting limit.',
      icon: Sliders,
      badgeColor: 'text-rose-500 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20'
    },
    {
      id: 'many_to_one_aggregation',
      name: 'Money Funnel (Many-to-One)',
      description: 'Flags funds arriving from 4+ distinct accounts within 72 hours aggregating over ₹15 Lakhs.',
      icon: Merge,
      badgeColor: 'text-purple-500 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20'
    },
    {
      id: 'one_to_many_dispersion',
      name: 'Money Dispersion (One-to-Many)',
      description: 'Flags large sums split and immediately sent outward to 4+ accounts within 72 hours.',
      icon: Split,
      badgeColor: 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
    },
    {
      id: 'circular_chain_movement',
      name: 'Circular Money Flow (Round-Tripping)',
      description: 'Flags closed fund loops that route through 3+ intermediary accounts back to the origin to hide ownership.',
      icon: RotateCw,
      badgeColor: 'text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20'
    },
    {
      id: 'high_velocity_burst',
      name: 'High-Velocity Transfer Burst',
      description: 'Flags sudden bursts of 5+ rapid transfers within 12 hours that deviate from normal account activity.',
      icon: Zap,
      badgeColor: 'text-teal-500 dark:text-teal-400 bg-teal-500/10 border border-teal-500/20'
    }
  ];

  const filteredIndicators = (data?.indicators || []).filter((ind: any) => {
    const matchesSearch = ind.account_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ind.indicator_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ind.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ind.case_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTypology = selectedTypology === 'ALL' || ind.indicator_name === selectedTypology;
    return matchesSearch && matchesTypology;
  });

  return (
    <div className="space-y-6">
      {/* Brand Beacon Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="pulse-badge">
          <span className="pulse-beacon">
            <span className="pulse-beacon-ping bg-emerald-400"></span>
            <span className="pulse-beacon-dot bg-emerald-500"></span>
          </span>
          <span>Suspicious Activity Scanner • Pattern & Account Connections Screening</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <span className="font-mono">7 Suspicious Patterns Active</span>
          <span>•</span>
          <span className="text-emerald-500 dark:text-emerald-400 font-medium">Account Connections Map Active</span>
        </div>
      </div>

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
        <div>
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent)] mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span><ComplianceTerm term="AML" /> & <ComplianceTerm term="CFT" /> Activity Scanner</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Scanning for Suspicious Activity & Risk Level
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5 max-w-2xl leading-relaxed">
            Checks transactions against known financial crime patterns, transfer sizes, and abnormal flow speeds to flag accounts needing investigation.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0 self-start sm:self-auto">
          <button
            onClick={handleRunDetection}
            disabled={running}
            className="btn-primary"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${running ? 'animate-spin' : ''}`} />
            <span>{running ? 'Scanning Activity Patterns...' : 'Scan for Suspicious Activity'}</span>
          </button>
          <button
            onClick={fetchDetection}
            disabled={loading}
            className="btn-secondary"
            title="Refresh scan results"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[var(--text-muted)] ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15 flex items-center space-x-3 text-emerald-600 dark:text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium">{actionMsg}</span>
        </div>
      )}

      {/* Engine Thresholds */}
      <div className="pulse-card p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-[var(--text-primary)]">
            <Sliders className="w-4 h-4 text-[var(--color-accent)]" />
            <span>Activity Limits & Detection Thresholds</span>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] border border-[var(--color-accent-border)]">
            Clear Risk Rating Rules
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)] text-[11px] font-semibold">Case Creation Limit</span>
              <span className="text-xs font-bold text-[var(--color-accent-text)] font-mono">60.0 / 100</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">Risk Level ≥ 60.0 creates a case automatically for investigator review.</p>
          </div>

          <div className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)] text-[11px] font-semibold">Large Transfer Benchmark</span>
              <span className="text-xs font-bold text-amber-500 dark:text-amber-400 font-mono">₹5,00,000</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">Flags single transactions exceeding ₹5 Lakhs for immediate scrutiny.</p>
          </div>

          <div className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)] text-[11px] font-semibold">Structuring Limit</span>
              <span className="text-xs font-bold text-rose-500 dark:text-rose-400 font-mono">₹9,50,000</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">Flags deposits just under the statutory ₹10 Lakh reporting threshold.</p>
          </div>

          <div className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)] text-[11px] font-semibold">Pass-Through Window</span>
              <span className="text-xs font-bold text-purple-500 dark:text-purple-400 font-mono">24 Hours</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">Flags money routed outward within 24 hours retaining minimal balance.</p>
          </div>

          <div className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)] text-[11px] font-semibold">Fan-In / Fan-Out Window</span>
              <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 font-mono">72 Hours</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">Detects money arriving from or dispersing to 4+ accounts.</p>
          </div>

          <div className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)] text-[11px] font-semibold">Circular Flow Steps</span>
              <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 font-mono">2 – 5 Steps</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">Traces circular money paths that return funds back to the originator.</p>
          </div>
        </div>
      </div>

      {/* 7 Typology Showcase */}
      <div>
        <h2 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-3 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-[var(--color-accent)]" />
          <span>Suspicious Activity Patterns Checked</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {typologies.map((t) => {
            const Icon = t.icon;
            const count = data?.typology_breakdown?.[t.id] ?? 0;
            const isSelected = selectedTypology === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTypology(isSelected ? 'ALL' : t.id)}
                className={`pulse-card p-4.5 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[var(--color-accent)] shadow-md ring-2 ring-[var(--color-accent-glow)]'
                    : 'hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="p-2 rounded-xl bg-[var(--bg-card-subtle)] text-[var(--color-accent)] border border-[var(--border-subtle)]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[var(--bg-card-subtle)] text-[var(--text-primary)] border border-[var(--border-default)]">
                    {count} Flagged
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">{t.name}</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{t.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Flagged Indicators Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Flagged Account Indicators ({filteredIndicators.length})
            </h2>
            <p className="text-xs text-[var(--text-muted)]">Verified activity signals contributing to account risk levels.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search account, case ID..."
                className="w-full sm:w-56 pl-8.5 pr-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder:[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] shadow-2xs"
              />
            </div>
            {selectedTypology !== 'ALL' && (
              <button
                onClick={() => setSelectedTypology('ALL')}
                className="btn-secondary text-[11px]"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        <div className="pulse-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-xs table-fixed">
              <colgroup>
                <col className="w-[130px]" />
                <col className="w-[130px]" />
                <col className="w-[200px]" />
                <col className="w-[120px]" />
                <col className="w-[220px]" />
                <col className="w-[120px]" />
              </colgroup>
              <thead className="bg-[var(--bg-card-subtle)] border-b border-[var(--border-default)] text-[var(--text-muted)] uppercase text-[10px] font-semibold tracking-wider select-none">
                <tr>
                  <th className="py-3 px-4 align-middle whitespace-nowrap">Case ID</th>
                  <th className="py-3 px-4 align-middle whitespace-nowrap">Account</th>
                  <th className="py-3 px-4 align-middle whitespace-nowrap">Suspicious Activity Type</th>
                  <th className="py-3 px-4 text-right align-middle whitespace-nowrap">Points Added</th>
                  <th className="py-3 px-4 align-middle">Plain Language Explanation</th>
                  <th className="py-3 px-4 text-right align-middle whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filteredIndicators.map((ind: any) => (
                  <tr key={ind.detection_id} className="hover:bg-[var(--bg-card-hover)] transition-colors align-middle">
                    <td className="py-3 px-4 font-mono font-bold text-[var(--color-accent-text)] align-middle whitespace-nowrap">
                      <Link to={`/cases/${ind.case_id}`} className="hover:underline">
                        {ind.case_id}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-mono text-[var(--text-primary)] font-medium align-middle whitespace-nowrap">
                      {getNeutralAccountId(ind.account_id)}
                    </td>
                    <td className="py-3 px-4 align-middle">
                      <span className="inline-block truncate max-w-[190px] px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-[var(--bg-card-subtle)] text-[var(--text-primary)] border border-[var(--border-default)] align-middle" title={getIndicatorPlainTitle(ind.indicator_name)}>
                        {getIndicatorPlainTitle(ind.indicator_name)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right align-middle whitespace-nowrap">
                      <span className="text-rose-600 dark:text-rose-400 font-mono font-bold">+{ind.score} pts</span>
                    </td>
                    <td className="py-3 px-4 text-[var(--text-secondary)] align-middle">
                      <span className="block truncate max-w-[210px]" title={ind.explanation}>
                        {formatINRText(ind.explanation)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right align-middle whitespace-nowrap">
                      <Link
                        to={`/cases/${ind.case_id}`}
                        className="h-8 px-3 inline-flex items-center justify-center gap-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] text-xs font-medium shadow-xs transition-all cursor-pointer whitespace-nowrap"
                      >
                        <span>Open Case</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredIndicators.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                      No indicators match your search or filter. Try selecting &apos;All&apos; or clearing your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DetectionPage;
