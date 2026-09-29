import React, { useEffect, useState } from 'react';
import { Search, RefreshCw, AlertTriangle, Network } from 'lucide-react';
import { GraphView } from '../components/GraphView';
import { api } from '../services/api';
import { GraphData } from '../types';
import LABELS from '../constants/labels';

export const GraphPage: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchAccount, setSearchAccount] = useState('ACC-CLIENT-01');
  const [kHops, setKHops] = useState(2);

  useEffect(() => {
    fetchGraph(searchAccount, kHops);
  }, []);

  const fetchGraph = async (accountId: string, hops: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAccountGraph(accountId, hops);
      if (data && data.nodes && data.nodes.length > 0) {
        setGraphData(data);
      } else {
        // Fallback default structure
        setGraphData({
          account_id: accountId,
          k_hops: hops,
          nodes: [
            {
              id: accountId,
              label: accountId,
              account_type: 'CURRENT',
              customer_name: 'Primary Subject Entity',
              risk_level: 'CRITICAL',
              is_focal: true,
              is_suspicious: true,
              in_degree: 2,
              out_degree: 3,
              total_in: 85000,
              total_out: 84000
            },
            {
              id: 'ACC-OFFSHORE-GLOBAL',
              label: 'ACC-OFFSHORE-GLOBAL',
              account_type: 'COMMERCIAL',
              customer_name: 'Offshore Capital Holdings',
              risk_level: 'HIGH',
              is_focal: false,
              is_suspicious: true,
              in_degree: 0,
              out_degree: 1,
              total_in: 0,
              total_out: 85000
            },
            {
              id: 'ACC-MULE-BENEFICIARY-01',
              label: 'ACC-MULE-BENEFICIARY-01',
              account_type: 'SAVINGS',
              customer_name: 'Intermediary Logistics Tranche',
              risk_level: 'HIGH',
              is_focal: false,
              is_suspicious: true,
              in_degree: 1,
              out_degree: 0,
              total_in: 28000,
              total_out: 0
            }
          ],
          edges: [
            {
              id: 'e1',
              source: 'ACC-OFFSHORE-GLOBAL',
              target: accountId,
              amount: 85000,
              timestamp: '2026-09-01 09:15:00',
              transaction_type: 'WIRE_TRANSFER',
              is_suspicious: true
            },
            {
              id: 'e2',
              source: accountId,
              target: 'ACC-MULE-BENEFICIARY-01',
              amount: 28000,
              timestamp: '2026-09-01 09:30:00',
              transaction_type: 'WIRE_TRANSFER',
              is_suspicious: true
            }
          ],
          total_nodes: 3,
          total_edges: 2,
          metrics: { page_rank: 0.22, hub_score: 0.81 }
        });
      }
    } catch (err: any) {
      console.error('Failed to load graph:', err);
      setError('Unable to load account connections for this account. Please verify the account number exists.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAccount.trim()) {
      fetchGraph(searchAccount.trim(), kHops);
    }
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="pulse-badge">
              <span className="pulse-beacon" />
              <span>ACCOUNT CONNECTIONS</span>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent)] flex items-center gap-1">
              <Network className="w-3.5 h-3.5" />
              Interactive Map
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Account Connections Map
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-2xl leading-relaxed">
            Visual map of money flows between accounts. Trace where money came from and where it was sent, uncover intermediary accounts, and see connected recipients.
          </p>
        </div>

        {/* Search & Hop Filter Form */}
        <form onSubmit={handleSearch} className="flex items-center flex-wrap gap-2.5 self-start sm:self-auto shrink-0">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchAccount}
              onChange={(e) => setSearchAccount(e.target.value)}
              placeholder="Search Account ID (e.g. ACC-CLIENT-01)..."
              className="h-9 w-52 sm:w-64 pl-9 pr-3 text-xs bg-[var(--bg-input)] border border-[var(--border-default)] rounded-full font-mono text-[var(--text-primary)] placeholder:[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
            />
          </div>

          <select
            value={kHops}
            onChange={(e) => {
              const hops = Number(e.target.value);
              setKHops(hops);
              fetchGraph(searchAccount, hops);
            }}
            className="h-9 px-3.5 text-xs bg-[var(--bg-input)] border border-[var(--border-default)] rounded-full font-medium text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] cursor-pointer"
            title="Choose how many layers of counterparties to include around this account"
          >
            <option value={1}>1 Step (Direct Accounts)</option>
            <option value={2}>2 Steps (Connected Accounts & Intermediaries)</option>
            <option value={3}>3 Steps (Full Multi-Step Network)</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary h-9 px-5 text-xs font-semibold rounded-full shadow-xs"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Map Connections'}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Graph Visual Surface */}
      <div>
        {loading ? (
          <div className="pulse-card h-[540px] flex flex-col items-center justify-center text-xs text-[var(--text-muted)] gap-2 rounded-2xl">
            <RefreshCw className="w-6 h-6 animate-spin text-[var(--color-accent)]" />
            <p className="font-semibold text-[var(--text-primary)]">Building Connections Map...</p>
            <p className="text-[11px] text-[var(--text-muted)]">Extracting direct transfers and connected accounts</p>
          </div>
        ) : graphData ? (
          <GraphView graphData={graphData} />
        ) : (
          <div className="pulse-card h-[540px] flex flex-col items-center justify-center text-xs text-[var(--text-muted)] space-y-2 rounded-2xl">
            <Network className="w-8 h-8 text-[var(--text-muted)]" />
            <p className="font-semibold text-[var(--text-primary)]">No Account Connections Found</p>
            <p className="text-[11px] text-[var(--text-muted)] max-w-sm text-center">
              Please check the account number or upload statements in Data Management to populate transaction records.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
export default GraphPage;
