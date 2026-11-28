import React from 'react';
import {
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { NavigationTab } from '../../types/soc';

interface ModulePlaceholderProps {
  tab: NavigationTab;
  onReturnToOverview: () => void;
}

interface PlaceholderInfo {
  title: string;
  stageNumber: number;
  stageLabel: string;
  description: string;
  plannedFeatures: string[];
}

const MODULE_DETAILS: Record<Exclude<NavigationTab, 'soc-overview'>, PlaceholderInfo> = {
  'security-alerts': {
    title: 'Security Alerts & Analyst Triage Queue',
    stageNumber: 2,
    stageLabel: 'Stage 2',
    description:
      'Dedicated alert management console for filtering, assigning, suppressing false positives, and escalating high-severity security detections.',
    plannedFeatures: [
      'Interactive alert triage workflow with status updates (New, Triage, Escalated)',
      'Severity-based filtering and alert grouping by host and signature',
      'Rule suppression and whitelist management for home lab false positives',
      'Contextual asset details and affected user account tracking',
    ],
  },
  'event-explorer': {
    title: 'Event Explorer & Log Investigation',
    stageNumber: 3,
    stageLabel: 'Stage 3',
    description:
      'Deep query engine and timeline inspector for cross-correlating Sysmon, firewall, and DNS events across home lab subnets.',
    plannedFeatures: [
      'Full-text and boolean key-value search across synthetic logs',
      'Time-series histogram brush zoom across specific attack intervals',
      'Field facet aggregations for Source IP, User, Process, and Port',
      'Raw log export and query bookmarking for repeatable investigations',
    ],
  },
  'threat-intel': {
    title: 'Threat Intelligence Feeds & IOC Matching',
    stageNumber: 4,
    stageLabel: 'Stage 4',
    description:
      'Aggregator for threat intelligence indicators (IPs, domains, hashes) cross-referenced against inbound and outbound home lab telemetry.',
    plannedFeatures: [
      'Simulated threat intelligence feed ingestion (AbuseIPDB, AlienVault OTX style feeds)',
      'Automated IOC enrichment for external IPs flagged in firewall logs',
      'Threat actor profiling and campaign attribution tags',
      'Confidence scoring and reputation lookup tooling',
    ],
  },
  'detection-rules': {
    title: 'Detection Rules & Sigma Engine',
    stageNumber: 5,
    stageLabel: 'Stage 5',
    description:
      'Rule repository and syntax validator for custom Sigma rules and home lab detection logic.',
    plannedFeatures: [
      'Sigma rule repository with YAML syntax highlighting',
      'Rule enablement toggle and execution frequency settings',
      'Test harness to validate rules against simulated log samples',
      'Mapping of detection rules to corresponding MITRE techniques',
    ],
  },
  'mitre-attack': {
    title: 'MITRE ATT&CK Matrix Navigator',
    stageNumber: 6,
    stageLabel: 'Stage 6',
    description:
      'Visual heat map displaying coverage of enterprise tactics and techniques across monitored home lab data sources.',
    plannedFeatures: [
      'Interactive MITRE ATT&CK Enterprise Matrix grid view',
      'Coverage density indicators (Initial Access, Execution, Persistence, etc.)',
      'Technique drill-down showing active rules defending against specific TTPs',
      'Gap analysis report highlighting unmonitored home lab attack surfaces',
    ],
  },
  'incident-response': {
    title: 'Incident Response & Containment Playbooks',
    stageNumber: 7,
    stageLabel: 'Stage 7',
    description:
      'Structured step-by-step containment playbooks modeled on the PICERL (Preparation, Identification, Containment, Eradication, Recovery, Lessons Learned) cycle.',
    plannedFeatures: [
      'Interactive response checklists for Ransomware, SSH brute force, and Data Exfiltration',
      'Simulated host isolation and network quarantine triggers',
      'Chain-of-custody logging and immutable artifact timestamps',
      'Analyst notes and handoff tracking across response stages',
    ],
  },
  'incident-reports': {
    title: 'Incident Reports & Post-Mortem Audits',
    stageNumber: 8,
    stageLabel: 'Stage 8',
    description:
      'Comprehensive reporting suite to generate formal post-incident summaries, executive briefings, and metrics for home lab exercises.',
    plannedFeatures: [
      'Formal executive incident report generator with timeline reconstructions',
      'Mean Time to Detect (MTTD) and Mean Time to Respond (MTTR) calculation',
      'Exportable markdown/PDF report templates',
      'Lessons-learned action item tracking',
    ],
  },
  'data-sources': {
    title: 'Data Sources & Sensor Configuration',
    stageNumber: 9,
    stageLabel: 'Stage 9',
    description:
      'Comprehensive administration interface for configuring log shippers, Syslog forwarders, Wazuh agents, and Zeek/Suricata taps.',
    plannedFeatures: [
      'Sensor agent onboarding wizard and configuration generators',
      'Log parsing pipeline debugger and field mapping verification',
      'Bandwidth and EPS throughput monitoring per sensor',
      'Heartbeat alerting and disconnected sensor alerts',
    ],
  },
  'settings': {
    title: 'Lab Settings & Simulation Controls',
    stageNumber: 10,
    stageLabel: 'Stage 10',
    description:
      'Global environment settings, mock telemetry generator controls, alert thresholds, and theme customization.',
    plannedFeatures: [
      'Telemetry simulation speed and attack scenario generator controls',
      'Alert notification webhook integrations',
      'Storage retention thresholds for simulated logs',
      'Theme and analyst workspace preference settings',
    ],
  },
};

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  tab,
  onReturnToOverview,
}) => {
  const info = MODULE_DETAILS[tab as keyof typeof MODULE_DETAILS] || {
    title: 'Module Under Construction',
    stageNumber: 2,
    stageLabel: 'Upcoming Stage',
    description: 'This module is scheduled for development in a subsequent stage.',
    plannedFeatures: [],
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      {/* Return back banner */}
      <button
        type="button"
        onClick={onReturnToOverview}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#A9492D] dark:text-[#E27A54] hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-[#A9492D] dark:focus:ring-[#E27A54] rounded px-2 py-1"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Return to SOC Command Center Overview</span>
      </button>

      {/* Main card */}
      <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#CDCFC2] dark:border-[#3A443A]/70 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#E1DED1] dark:bg-signal-950 px-2 py-0.5 text-xs font-mono font-semibold text-[#A9492D] dark:text-[#E27A54] border border-[#CDCFC2] dark:border-signal-800/40">
                {info.stageLabel}
              </span>
              <span className="rounded bg-[#E1DED1] dark:bg-[#252C24] px-2 py-0.5 text-xs font-mono text-[#58635A] dark:text-[#A8B09F] border border-[#CDCFC2] dark:border-[#3A443A]">
                Operational Module
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#1C241F] dark:text-white mt-1">
              {info.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] px-3 py-1 text-xs text-[#58635A] dark:text-[#A8B09F]">
            <Clock className="h-3.5 w-3.5 text-[#798074] dark:text-[#58635A]" />
            <span>Phase Status: Operational</span>
          </div>
        </div>

        {/* Notice */}
        <div className="mt-6 rounded-lg border border-signal-200 dark:border-signal-800/40 bg-signal-50/60 dark:bg-signal-950/30 p-4 text-xs text-signal-900 dark:text-signal-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-[#A9492D] dark:text-[#E27A54] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#A9492D] dark:text-[#E27A54]">
                CyberGuard SOC Module Architecture
              </p>
              <p className="mt-1 text-[#1C241F]/80 dark:text-signal-200/90 leading-relaxed">
                This module has been registered and verified within the CyberGuard SOC Lab system.
              </p>
            </div>
          </div>
        </div>

        {/* Scope and Roadmap */}
        <div className="mt-6 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#58635A] dark:text-[#A8B09F]">
              Module Purpose
            </h3>
            <p className="mt-1.5 text-sm text-[#1C241F] dark:text-[#F0EFE6] leading-relaxed">
              {info.description}
            </p>
          </div>

          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#58635A] dark:text-[#A8B09F] mb-2">
              Core Capabilities
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {info.plannedFeatures.map((feat, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2.5 rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] p-3 text-xs text-[#1C241F] dark:text-[#F0EFE6]"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 pt-6 border-t border-[#CDCFC2] dark:border-[#3A443A]/70 flex items-center justify-between">
          <span className="text-[11px] text-[#58635A] dark:text-[#A8B09F] font-mono">
            CyberGuard SOC Lab Architecture &bull; Stage {info.stageNumber}
          </span>
          <button
            type="button"
            onClick={onReturnToOverview}
            className="rounded-lg bg-[#A9492D] hover:bg-[#823B27] dark:bg-[#E27A54] dark:hover:bg-[#C3D579] text-white dark:text-[#111713] font-semibold text-xs px-4 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#A9492D] dark:focus:ring-[#E27A54] shadow-xs"
          >
            Go to Active Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
