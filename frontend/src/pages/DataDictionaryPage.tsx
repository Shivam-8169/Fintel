import React, { useState } from 'react';
import {
  BookOpen,
  Database,
  Users,
  CreditCard,
  Layers,
  Edit3,
  ShieldAlert,
  Search,
  CheckCircle2,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { ComplianceTerm } from '../components/ComplianceTerm';

interface FieldSpec {
  name: string;
  type: string;
  whatItIs: string;
  whereItComesFrom: string;
  whyItMatters: string;
  example: string;
}

interface TableSpec {
  id: string;
  title: string;
  sourceFile: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: FieldSpec[];
}

export const DataDictionaryPage: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const tables: TableSpec[] = [
    {
      id: 'customers',
      title: 'Customers Directory',
      sourceFile: 'customers.csv',
      description: 'Master record of verified entity profiles, natural persons, and commercial corporations evaluated under KYC standards.',
      icon: Users,
      fields: [
        {
          name: 'customer_id',
          type: 'String (Primary Key)',
          whatItIs: 'A unique identifier assigned to every individual or corporate customer.',
          whereItComesFrom: 'Core Banking System (CBS) during formal customer onboarding.',
          whyItMatters: 'Serves as the root anchor linking multiple accounts, trade declarations, and beneficial ownership structures.',
          example: 'CUST-10492 or CUST-NORM-042'
        },
        {
          name: 'name',
          type: 'String',
          whatItIs: 'Legal full name of the individual or registered commercial business entity.',
          whereItComesFrom: 'Verified government KYC documents (e.g. PAN, Aadhaar, Certificate of Incorporation).',
          whyItMatters: 'Essential for screening against sanctions lists, PEP databases, and adverse media registries.',
          example: 'Rajesh Kumar or Apex Bullion Trade Pvt Ltd'
        },
        {
          name: 'country',
          type: 'String (ISO-3166-1 alpha-3)',
          whatItIs: 'Jurisdiction of legal incorporation or permanent tax residency.',
          whereItComesFrom: 'Customer proof-of-address documents and tax identification forms.',
          whyItMatters: 'Flags high-risk jurisdictions, FATF grey/black-list exposure, and offshore tax conduits.',
          example: 'IND (India), UAE, SGP (Singapore), MUS (Mauritius)'
        },
        {
          name: 'occupation',
          type: 'String',
          whatItIs: 'Declared economic vocation, trade sector, or line of commercial business.',
          whereItComesFrom: 'Customer account opening declaration and annual economic KYC reviews.',
          whyItMatters: 'Forms the baseline profile to determine if high-value transactions match reasonable commercial activity.',
          example: 'Merchant Exporter, Software Consultant, Retail Trader'
        },
        {
          name: 'risk_level',
          type: 'String (LOW | MEDIUM | HIGH)',
          whatItIs: 'Initial Customer Due Diligence (CDD) risk rating assigned at onboarding.',
          whereItComesFrom: 'Automated KYC onboarding risk-scoring engine.',
          whyItMatters: 'High-risk customers require enhanced ongoing surveillance and shorter alert review turnaround times.',
          example: 'LOW, MEDIUM, HIGH'
        }
      ]
    },
    {
      id: 'accounts',
      title: 'Accounts Registry',
      sourceFile: 'accounts.csv',
      description: 'Deposit, savings, current, and commercial accounts mapped to owning customers and counterparties.',
      icon: CreditCard,
      fields: [
        {
          name: 'account_id',
          type: 'String (Primary Key)',
          whatItIs: 'Unique bank account number used for settlement and ledger transactions.',
          whereItComesFrom: 'Core Banking System (CBS) general ledger account master.',
          whyItMatters: 'The fundamental node in the transaction graph. All funds enter, dwell, and leave through account nodes.',
          example: 'ACC-10234, ACC-30419'
        },
        {
          name: 'customer_id',
          type: 'String (Foreign Key)',
          whatItIs: 'Reference pointing to the customer entity that legally owns this account.',
          whereItComesFrom: 'Account opening mandate and customer relationship management ledger.',
          whyItMatters: 'Allows an investigator to see all sibling accounts controlled by the same legal entity.',
          example: 'CUST-10492'
        },
        {
          name: 'account_type',
          type: 'String (SAVINGS | CURRENT | BUSINESS)',
          whatItIs: 'Commercial classification and operating mandate of the account.',
          whereItComesFrom: 'Product catalog chosen during account origination.',
          whyItMatters: 'Helps detect misuse (e.g. personal savings account operating like an unregistered commercial money remitter).',
          example: 'CURRENT, SAVINGS, BUSINESS'
        },
        {
          name: 'created_at',
          type: 'DateTime (ISO-8601)',
          whatItIs: 'Exact date and time when the account was approved and activated.',
          whereItComesFrom: 'Core banking audit timestamp.',
          whyItMatters: 'Recently opened accounts that instantly receive and disperse massive funds fit classic mule profiles.',
          example: '2026-08-01 09:30:00'
        }
      ]
    },
    {
      id: 'transactions',
      title: 'Transaction Ledgers',
      sourceFile: 'transactions.csv',
      description: 'Directional transfer movements between originating senders and beneficiary receivers across payment rails.',
      icon: Layers,
      fields: [
        {
          name: 'transaction_id',
          type: 'String (Primary Key)',
          whatItIs: 'Unique global transaction reference number generated at settlement.',
          whereItComesFrom: 'Domestic and international payment switch engines (RTGS, NEFT, UPI, SWIFT).',
          whyItMatters: 'Provides immutable audit provenance. Cited as primary evidence in regulatory SAR reports.',
          example: 'TX-100234, TX-00636'
        },
        {
          name: 'sender_account',
          type: 'String (Foreign Key)',
          whatItIs: 'Account debited for this transfer.',
          whereItComesFrom: 'Payment switch debit authorization message.',
          whyItMatters: 'Represents the directed origin node (Source) in the network graph.',
          example: 'ACC-10234'
        },
        {
          name: 'receiver_account',
          type: 'String (Foreign Key)',
          whatItIs: 'Account credited with the transferred funds.',
          whereItComesFrom: 'Payment settlement credit notification message.',
          whyItMatters: 'Represents the directed destination node (Target) in the network graph.',
          example: 'ACC-30419'
        },
        {
          name: 'amount',
          type: 'Float (INR ₹)',
          whatItIs: 'Monetary volume transferred in Indian Rupees (₹).',
          whereItComesFrom: 'Core ledger settlement records.',
          whyItMatters: 'Evaluated against high-value thresholds (₹5,00,000+) and structuring boundaries (₹8,00,000–₹9,90,000).',
          example: '₹9,50,000 or ₹80,000'
        },
        {
          name: 'timestamp',
          type: 'DateTime (ISO-8601)',
          whatItIs: 'Precise timestamp when the transfer cleared.',
          whereItComesFrom: 'Payment switch cryptographic timestamp.',
          whyItMatters: 'Used to measure transaction velocity, rapid turnaround windows, and burst frequencies.',
          example: '2026-08-26 20:00:00'
        },
        {
          name: 'transaction_type',
          type: 'String',
          whatItIs: 'Payment rail or settlement mechanism utilized.',
          whereItComesFrom: 'Payment rail protocol header.',
          whyItMatters: 'Different payment rails (e.g. RTGS vs. instant UPI) indicate speed of layering and settlement finality.',
          example: 'WIRE_TRANSFER, RTGS, NEFT, UPI'
        }
      ]
    },
    {
      id: 'notes',
      title: 'Investigator Notes',
      sourceFile: 'investigator_notes.csv',
      description: 'Qualitative notes, team interview records, and forensic working hypotheses recorded during investigations.',
      icon: Edit3,
      fields: [
        {
          name: 'note_id',
          type: 'String (Primary Key)',
          whatItIs: 'Unique identifier for a case note entry.',
          whereItComesFrom: 'Fintel case management ledger.',
          whyItMatters: 'Ensures individual notes can be cited and referenced independently in audit reviews.',
          example: 'NOTE-1042'
        },
        {
          name: 'case_id',
          type: 'String (Foreign Key)',
          whatItIs: 'Investigation dossier associated with this note.',
          whereItComesFrom: 'Case creation workflow.',
          whyItMatters: 'Maintains chronological context within the specific case timeline.',
          example: 'CASE-069872'
        },
        {
          name: 'target_account',
          type: 'String',
          whatItIs: 'Subject account under review when the note was recorded.',
          whereItComesFrom: 'Assigned investigator workflow.',
          whyItMatters: 'Attaches qualitative context directly to the account profile.',
          example: 'ACC-10234'
        },
        {
          name: 'note_text',
          type: 'Text',
          whatItIs: 'Free-text qualitative observations, counterparty check results, or evidence requests.',
          whereItComesFrom: 'Manual entry by compliance officers and lead investigators.',
          whyItMatters: 'Captures investigator rationale, team determinations, and regulatory justification.',
          example: 'Requested trade contracts and tax filings from counterparty ACC-89102.'
        },
        {
          name: 'created_at',
          type: 'DateTime (ISO-8601)',
          whatItIs: 'Timestamp when the note was committed.',
          whereItComesFrom: 'System immutable audit clock.',
          whyItMatters: 'Proves timely investigator action for internal audit and regulatory inspections.',
          example: '2026-09-24 14:15:00'
        }
      ]
    }
  ];

  const typologies = [
    {
      title: 'Rapid Fund Movement (Pass-Through)',
      plainExplanation: 'An account receives a large inbound deposit and immediately transfers over 95% of the money back out within 3 hours, leaving minimal balance behind.',
      threshold: '95% balance depleted within < 3 hours'
    },
    {
      title: 'High-Value Outliers',
      plainExplanation: 'A single transaction is abnormally large compared to the historical account profile and exceeds institutional surveillance benchmarks.',
      threshold: 'Single transfer ≥ ₹5,00,000 (₹5 Lakh)'
    },
    {
      title: 'Structuring / Smurfing',
      plainExplanation: 'Multiple repeated transfers are deliberately sized just under the ₹10 Lakh mandatory threshold to avoid automated regulatory reporting.',
      threshold: 'Repeated transfers between ₹8,00,000 and ₹9,90,000'
    },
    {
      title: 'Mule Account Aggregation (Fan-In)',
      plainExplanation: 'Multiple unrelated third-party accounts funnel deposits into one central collector account, which then consolidates and moves the funds out.',
      threshold: '≥ 3 distinct senders depositing into 1 central collector'
    },
    {
      title: 'Fund Dispersion (Fan-Out)',
      plainExplanation: 'A single high deposit is quickly fragmented and sent to multiple recipient accounts to break up the money trail.',
      threshold: '1 deposit split into ≥ 3 outward transfers within 24 hours'
    },
    {
      title: 'High-Velocity Bursts',
      plainExplanation: 'An unusual burst of frequent transfers happens within a short window, far exceeding regular transaction velocity.',
      threshold: '≥ 8 transactions occurring within 2 hours'
    },
    {
      title: 'Circular Layering Loops',
      plainExplanation: 'Money moves in a closed chain through intermediary shell accounts (A → B → C → A) to disguise who actually owns and controls the funds.',
      threshold: 'Closed cycle topology detected in the transaction multigraph'
    }
  ];

  const filteredTables = tables.filter((t) => {
    if (selectedTable !== 'all' && t.id !== selectedTable) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-2 border-b border-[var(--border-default)]">
        <div>
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent)] mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Field Specifications & Schema Guide</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Data Dictionary & Compliance Reference
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-2xl leading-relaxed">
            Every data field explained in plain English: what it represents, where it originates, and why it is critical for AML/CFT detection and regulatory reporting.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 sm:p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSelectedTable('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedTable === 'all'
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            All Datasets
          </button>
          {tables.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTable(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                selectedTable === t.id
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>{t.title}</span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search fields or descriptions..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>
      </div>

      {/* Dataset Tables */}
      <div className="space-y-6">
        {filteredTables.map((table) => {
          const TableIcon = table.icon;
          const matchingFields = table.fields.filter((f) => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            return (
              f.name.toLowerCase().includes(term) ||
              f.whatItIs.toLowerCase().includes(term) ||
              f.whereItComesFrom.toLowerCase().includes(term) ||
              f.whyItMatters.toLowerCase().includes(term)
            );
          });

          if (matchingFields.length === 0) return null;

          return (
            <div
              key={table.id}
              className="p-5 sm:p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)]/20">
                    <TableIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-[var(--text-primary)]">{table.title}</h2>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-card-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                        {table.sourceFile}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{table.description}</p>
                  </div>
                </div>
              </div>

              {/* Fields Table */}
              <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
                <table className="w-full min-w-[750px] text-left text-xs">
                  <thead>
                    <tr className="bg-[var(--bg-card-subtle)] border-b border-[var(--border-default)] text-[10px] font-mono uppercase text-[var(--text-muted)] tracking-wider select-none">
                      <th className="py-2.5 px-3 w-40 whitespace-nowrap">Field & Type</th>
                      <th className="py-2.5 px-3">What It Is</th>
                      <th className="py-2.5 px-3">Where It Comes From</th>
                      <th className="py-2.5 px-3">Why It Matters for AML</th>
                      <th className="py-2.5 px-3 w-36">Example</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {matchingFields.map((f) => (
                      <tr key={f.name} className="hover:bg-[var(--bg-card-subtle)]/50 transition-colors">
                        <td className="py-3 px-3 align-top">
                          <span className="font-mono font-bold text-[var(--color-accent)] block">
                            {f.name}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono block mt-0.5">
                            {f.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 align-top text-[var(--text-primary)] leading-relaxed">
                          {f.whatItIs}
                        </td>
                        <td className="py-3 px-3 align-top text-[var(--text-secondary)] leading-relaxed">
                          {f.whereItComesFrom}
                        </td>
                        <td className="py-3 px-3 align-top text-[var(--text-secondary)] leading-relaxed">
                          {f.whyItMatters}
                        </td>
                        <td className="py-3 px-3 align-top font-mono text-[11px] text-[var(--text-muted)]">
                          {f.example}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* 7 Controlled Typologies Reference */}
      <div className="p-5 sm:p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-[var(--border-default)]">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              7 Benchmark AML/CFT Typologies (Ground Truth)
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Controlled behavioral patterns identified and scored across ledger transactions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {typologies.map((t, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-2 hover:border-[var(--border-strong)] transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <h3 className="text-xs font-bold text-[var(--text-primary)]">{t.title}</h3>
                </div>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{t.plainExplanation}</p>
              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)] font-mono">Detection Rule:</span>
                <span className="font-semibold text-rose-400">{t.threshold}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataDictionaryPage;
