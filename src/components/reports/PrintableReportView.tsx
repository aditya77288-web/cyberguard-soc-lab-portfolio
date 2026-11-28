import React from 'react';
import {
  IncidentReport,
  SecurityIncident,
} from '../../types/soc';
import {
  Printer,
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Calendar,
  User,
  Hash,
  Server,
  Layers,
  Activity,
  Crosshair,
  ListTodo,
} from 'lucide-react';

interface PrintableReportViewProps {
  report: IncidentReport;
  sourceIncident?: SecurityIncident;
  onClose: () => void;
}

export const PrintableReportView: React.FC<PrintableReportViewProps> = ({
  report,
  sourceIncident,
  onClose,
}) => {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#111713]/90 dark:bg-[#111713]/95 backdrop-blur-sm overflow-y-auto flex flex-col items-center p-4 sm:p-6 print:p-0 print:bg-[#F2F0E6] print:text-black">
      {/* Top Action Toolbar (Hidden in print) */}
      <div className="w-full max-w-5xl mb-4 flex items-center justify-between bg-[#F2F0E6] dark:bg-[#0D120F] border border-[#CDCFC2] dark:border-[#3A443A] rounded-xl p-3 shadow-lg print:hidden">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#CDCFC2] dark:border-slate-700 bg-[#F0EFE6] dark:bg-slate-800 text-xs font-medium text-[#354037] dark:text-slate-300 hover:text-[#1C241F] dark:hover:text-white hover:bg-[#E1DED1] dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Reports</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#58635A] dark:text-slate-400 font-mono hidden sm:inline-block">
            {report.id} • {report.reportType}
          </span>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-signal-600 hover:bg-signal-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Document Container */}
      <div
        id="printable-soc-report"
        className="w-full max-w-5xl bg-[#F2F0E6] dark:bg-[#1A211B] border border-[#CDCFC2] dark:border-[#3A443A] rounded-2xl p-6 sm:p-10 shadow-2xl print:shadow-none print:border-none print:p-0 print:max-w-none print:bg-[#F2F0E6] print:text-slate-900"
      >
        {/* Document Header & Cover */}
        <header className="border-b-2 border-[#CDCFC2] dark:border-slate-700 print:border-slate-300 pb-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-signal-50 dark:bg-signal-950 border border-signal-200 dark:border-signal-800 rounded-xl text-signal-600 dark:text-signal-400 print:bg-slate-100 print:border-slate-400 print:text-slate-900">
                <Shield className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C241F] dark:text-white print:text-black">
                    CyberGuard SOC Lab
                  </h1>
                  <span className="px-2 py-0.5 rounded bg-signal-50 dark:bg-signal-950 text-signal-700 dark:text-signal-300 border border-signal-200 dark:border-signal-800 text-[10px] font-mono font-semibold print:bg-slate-100 print:text-slate-800 print:border-slate-300">
                    INVESTIGATION REPORT
                  </span>
                </div>
                <p className="text-xs text-[#58635A] dark:text-slate-400 print:text-slate-600 font-medium">
                  Incident Response &amp; Forensics Documentation
                </p>
              </div>
            </div>

            <div className="text-right sm:text-right w-full sm:w-auto font-mono text-xs text-[#354037] dark:text-slate-300 print:text-slate-700 space-y-1">
              <div>
                <strong className="text-[#58635A] dark:text-slate-400 print:text-slate-600">Report ID:</strong> {report.id}
              </div>
              <div>
                <strong className="text-[#58635A] dark:text-slate-400 print:text-slate-600">Incident ID:</strong> {report.incidentId}
              </div>
              <div>
                <strong className="text-[#58635A] dark:text-slate-400 print:text-slate-600">Generated:</strong>{' '}
                {new Date(report.createdAt).toUTCString()}
              </div>
              <div>
                <strong className="text-[#58635A] dark:text-slate-400 print:text-slate-600">Status:</strong>{' '}
                <span className="font-semibold uppercase text-signal-600 dark:text-signal-400 print:text-black">{report.status}</span>
              </div>
            </div>
          </div>

          {/* Classification & Simulation Notice */}
          <div className="mt-6 rounded-lg border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 print:bg-amber-50 print:border-amber-300 p-3.5 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400 print:text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 print:text-amber-900 leading-relaxed">
              <strong className="font-semibold">Classification: {report.classificationLabel}</strong> — This document contains synthetic cybersecurity demonstration records generated within the CyberGuard SOC training environment. Observables, logs, and simulated response actions do not represent real-world compromised production assets or live cyber threats.
            </div>
          </div>
        </header>

        {/* Report Title & Metadata Table */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-[#1C241F] dark:text-white print:text-black mb-3">
            {report.title}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F0EFE6] dark:bg-slate-950/60 print:bg-slate-50 border border-[#CDCFC2] dark:border-slate-800 print:border-slate-300 rounded-xl p-4 text-xs">
            <div>
              <span className="text-[#58635A] dark:text-slate-400 print:text-slate-600 block mb-0.5">Report Type</span>
              <span className="font-semibold text-[#1C241F] dark:text-white print:text-black">{report.reportType}</span>
            </div>
            <div>
              <span className="text-[#58635A] dark:text-slate-400 print:text-slate-600 block mb-0.5">Prepared By</span>
              <span className="font-semibold text-[#1C241F] dark:text-white print:text-black">{report.preparedBy}</span>
            </div>
            <div>
              <span className="text-[#58635A] dark:text-slate-400 print:text-slate-600 block mb-0.5">Affected Target Host</span>
              <span className="font-mono font-semibold text-signal-600 dark:text-signal-400 print:text-slate-900">
                {report.affectedHost}
              </span>
            </div>
            <div>
              <span className="text-[#58635A] dark:text-slate-400 print:text-slate-600 block mb-0.5">Incident Severity / Priority</span>
              <span className="font-semibold uppercase text-rose-600 dark:text-rose-400 print:text-red-700">
                {report.incidentSeverity} ({report.incidentPriority})
              </span>
            </div>
          </div>
        </section>

        {/* Section 1: Executive Summary */}
        <section className="mb-8 border-b border-[#CDCFC2] dark:border-slate-800 print:border-slate-300 pb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-signal-600 dark:text-signal-400 print:text-slate-900 flex items-center gap-2 mb-3">
            <span>1. Executive Summary</span>
          </h3>
          <p className="text-xs sm:text-sm text-[#354037] dark:text-slate-300 print:text-slate-800 leading-relaxed whitespace-pre-wrap">
            {report.executiveSummary}
          </p>
        </section>

        {/* Section 2: Incident Overview */}
        <section className="mb-8 border-b border-[#CDCFC2] dark:border-slate-800 print:border-slate-300 pb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-signal-600 dark:text-signal-400 print:text-slate-900 flex items-center gap-2 mb-3">
            <span>2. Incident Overview</span>
          </h3>
          <pre className="text-xs font-mono bg-[#ECEADE] dark:bg-slate-950/70 print:bg-slate-50 border border-[#CDCFC2] dark:border-slate-800 print:border-slate-300 rounded-lg p-3 text-[#1E293B] dark:text-slate-300 print:text-slate-800 whitespace-pre-wrap leading-relaxed">
            {report.incidentOverview}
          </pre>
        </section>

        {/* Section 3: Investigation Scope */}
        <section className="mb-8 border-b border-[#CDCFC2] dark:border-slate-800 print:border-slate-300 pb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-signal-600 dark:text-signal-400 print:text-slate-900 flex items-center gap-2 mb-3">
            <span>3. Investigation Scope &amp; Telemetry Sources</span>
          </h3>
          <p className="text-xs sm:text-sm text-[#354037] dark:text-slate-300 print:text-slate-800 leading-relaxed mb-3">
            {report.investigationScope}
          </p>
          <div className="flex flex-wrap gap-2">
            {report.dataSourcesExamined.map((src, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-md bg-[#E1DED1] dark:bg-slate-800 print:bg-slate-100 border border-[#CDCFC2] dark:border-slate-700 print:border-slate-300 text-xs font-mono text-[#354037] dark:text-slate-300 print:text-slate-700"
              >
                {src}
              </span>
            ))}
          </div>
        </section>

        {/* Section 4: Timeline Summary */}
        <section className="mb-8 border-b border-[#CDCFC2] dark:border-slate-800 print:border-slate-300 pb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-signal-600 dark:text-signal-400 print:text-slate-900 flex items-center gap-2 mb-3">
            <span>4. Chronological Investigation Timeline</span>
          </h3>
          {report.timelineSummary && report.timelineSummary.length > 0 ? (
            <div className="space-y-3">
              {report.timelineSummary.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 text-xs bg-[#F0EFE6] dark:bg-slate-950/40 print:bg-slate-50 p-2.5 rounded-lg border border-[#CDCFC2] dark:border-slate-800/80 print:border-slate-200"
                >
                  <span className="font-mono text-[#58635A] dark:text-slate-400 print:text-slate-600 shrink-0 w-36">
                    {item.timestamp ? new Date(item.timestamp).toUTCString().replace('GMT', 'UTC') : 'N/A'}
                  </span>
                  <div>
                    <div className="font-semibold text-[#1C241F] dark:text-white print:text-black">{item.title}</div>
                    <div className="text-[#58635A] dark:text-slate-400 print:text-slate-700 mt-0.5">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#58635A] dark:text-slate-400 print:text-slate-600 italic">No timeline entries recorded.</p>
          )}
        </section>

        {/* Section 5: Technical Findings */}
        <section className="mb-8 border-b border-[#CDCFC2] dark:border-slate-800 print:border-slate-300 pb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-signal-600 dark:text-signal-400 print:text-slate-900 flex items-center gap-2 mb-3">
            <span>5. Technical Findings ({report.findings.length})</span>
          </h3>
          <p className="text-xs text-[#58635A] dark:text-slate-400 print:text-slate-600 mb-3">{report.findingsSummary}</p>
          <div className="space-y-3">
            {report.findings.map((fnd) => (
              <div
                key={fnd.id}
                className="p-3 rounded-lg border border-[#CDCFC2] dark:border-slate-800 print:border-slate-300 bg-[#F0EFE6] dark:bg-slate-950/50 print:bg-slate-50 text-xs"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-[#1C241F] dark:text-white print:text-black">
                    [{fnd.id}] {fnd.title}
                  </span>
                  <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-[#E1DED1] dark:bg-slate-800 print:bg-slate-200 text-[#354037] dark:text-slate-300 print:text-slate-800">
                    {fnd.category} • {fnd.severity}
                  </span>
                </div>
                <p className="text-[#354037] dark:text-slate-300 print:text-slate-700 leading-relaxed">{fnd.description}</p>
                {fnd.evidenceRef && (
                  <span className="text-[10px] font-mono text-signal-600 dark:text-signal-400 print:text-slate-600 mt-1 block">
                    Evidence Ref: {fnd.evidenceRef}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Section 6: Threat Intelligence Analysis */}
        <section className="mb-8 border-b border-[#CDCFC2] dark:border-slate-800 print:border-slate-300 pb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-signal-600 dark:text-signal-400 print:text-slate-900 flex items-center gap-2 mb-3">
            <span>6. Threat Intelligence Analysis</span>
          </h3>
          <p className="text-xs text-[#354037] dark:text-slate-300 print:text-slate-800 mb-3 leading-relaxed">
            {report.threatIntelSummary}
          </p>
          {report.correlatedIndicators && report.correlatedIndicators.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-[#CDCFC2] dark:border-slate-800 print:border-slate-300">
                <thead className="bg-[#ECEADE] dark:bg-slate-950 print:bg-slate-100 text-[#58635A] dark:text-slate-400 print:text-slate-700 font-mono">
                  <tr>
                    <th className="p-2 border-b border-[#CDCFC2] dark:border-slate-800 print:border-slate-300">ID</th>
                    <th className="p-2 border-b border-[#CDCFC2] dark:border-slate-800 print:border-slate-300">Type</th>
                    <th className="p-2 border-b border-[#CDCFC2] dark:border-slate-800 print:border-slate-300">Defanged Value</th>
                    <th className="p-2 border-b border-[#CDCFC2] dark:border-slate-800 print:border-slate-300">Risk Score</th>
                    <th className="p-2 border-b border-[#CDCFC2] dark:border-slate-800 print:border-slate-300">Confidence</th>
                    <th className="p-2 border-b border-[#CDCFC2] dark:border-slate-800 print:border-slate-300">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CDCFC2] dark:divide-slate-800 print:divide-slate-200 bg-[#F2F0E6] dark:bg-[#0D120F]">
                  {report.correlatedIndicators.map((ioc) => (
                    <tr key={ioc.id}>
                      <td className="p-2 font-mono text-signal-600 dark:text-signal-400 print:text-slate-900">{ioc.id}</td>
                      <td className="p-2 uppercase text-[10px] font-mono text-[#354037] dark:text-slate-300">{ioc.type}</td>
                      <td className="p-2 font-mono text-[#1C241F] dark:text-slate-200 print:text-slate-800">{ioc.defangedValue}</td>
                      <td className="p-2 font-mono font-semibold text-[#1C241F] dark:text-white">{ioc.riskScore}/100</td>
                      <td className="p-2 font-mono text-[#58635A] dark:text-slate-400 print:text-slate-600">{ioc.confidence}%</td>
                      <td className="p-2 text-[#58635A] dark:text-slate-400 print:text-slate-700">{ioc.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-[#58635A] dark:text-slate-400 print:text-slate-600 italic">No threat indicators correlated.</p>
          )}
        </section>

        {/* Section 7: MITRE ATT&CK Mapping */}
        <section className="mb-8 border-b border-[#CDCFC2] dark:border-slate-800 print:border-slate-300 pb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-signal-600 dark:text-signal-400 print:text-slate-900 flex items-center gap-2 mb-3">
            <span>7. MITRE ATT&CK Framework Mapping</span>
          </h3>
          <p className="text-xs text-[#354037] dark:text-slate-300 print:text-slate-800 mb-3 leading-relaxed">
            {report.mitreMappingSummary}
          </p>
          {report.correlatedTechniques && report.correlatedTechniques.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {report.correlatedTechniques.map((tech) => (
                <div
                  key={tech.id}
                  className="p-2.5 rounded-lg border border-[#CDCFC2] dark:border-slate-800 print:border-slate-300 bg-[#F0EFE6] dark:bg-slate-950/40 print:bg-slate-50 flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-bold text-signal-600 dark:text-signal-400 print:text-slate-900 mr-2">
                      {tech.id}
                    </span>
                    <span className="font-medium text-[#1C241F] dark:text-slate-200 print:text-slate-800">{tech.name}</span>
                    <div className="text-[10px] text-[#58635A] dark:text-slate-400 print:text-slate-600">{tech.tactic}</div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E1DED1] dark:bg-slate-800 print:bg-slate-200 text-[#354037] dark:text-slate-300 print:text-slate-800">
                    {tech.coverageStatus}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#58635A] dark:text-slate-400 print:text-slate-600 italic">No ATT&CK techniques mapped.</p>
          )}
        </section>

        {/* Section 8: Response and Containment */}
        <section className="mb-8 border-b border-[#CDCFC2] dark:border-slate-800 print:border-slate-300 pb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-signal-600 dark:text-signal-400 print:text-slate-900 flex items-center gap-2 mb-3">
            <span>8. Response and Containment Playbook Actions</span>
          </h3>
          <p className="text-xs text-[#354037] dark:text-slate-300 print:text-slate-800 mb-3 leading-relaxed">
            {report.responseActionsSummary}
          </p>
          {report.recordedActions && report.recordedActions.length > 0 ? (
            <div className="space-y-2">
              {report.recordedActions.map((act) => (
                <div
                  key={act.id}
                  className="p-2.5 rounded-lg border border-[#CDCFC2] dark:border-slate-800 print:border-slate-300 bg-[#F0EFE6] dark:bg-slate-950/40 print:bg-slate-50 text-xs flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-[#1C241F] dark:text-white print:text-black">{act.title}</div>
                    <div className="text-[#58635A] dark:text-slate-400 print:text-slate-600 text-[11px] mt-0.5">
                      Type: {act.type} • Executed By: {act.executedBy} • Time: {new Date(act.timestamp).toUTCString()}
                    </div>
                    {act.notes && (
                      <div className="text-[#354037] dark:text-slate-300 print:text-slate-700 text-xs mt-1 italic">
                        &quot;{act.notes}&quot;
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 print:bg-slate-100 print:text-slate-800 print:border-slate-300">
                    {act.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#58635A] dark:text-slate-400 print:text-slate-600 italic">No response actions recorded.</p>
          )}
        </section>

        {/* Section 9: Impact Assessment */}
        <section className="mb-8 border-b border-[#CDCFC2] dark:border-slate-800 print:border-slate-300 pb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-signal-600 dark:text-signal-400 print:text-slate-900 flex items-center gap-2 mb-3">
            <span>9. Impact Assessment</span>
          </h3>
          <div className="p-3.5 rounded-lg bg-[#F0EFE6] dark:bg-slate-950/60 print:bg-slate-50 border border-[#CDCFC2] dark:border-slate-800 print:border-slate-300">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-[#58635A] dark:text-slate-400 print:text-slate-600">Established Impact Level:</span>
              <span className="text-xs font-mono font-bold uppercase text-amber-600 dark:text-amber-400 print:text-amber-800">
                {report.impactSeverity}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#354037] dark:text-slate-300 print:text-slate-800 leading-relaxed">
              {report.impactAssessment}
            </p>
          </div>
        </section>

        {/* Section 10: Recommendations */}
        <section className="mb-8 border-b border-[#CDCFC2] dark:border-slate-800 print:border-slate-300 pb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-signal-600 dark:text-signal-400 print:text-slate-900 flex items-center gap-2 mb-3">
            <span>10. Recommendations &amp; Corrective Actions</span>
          </h3>
          <div className="space-y-3">
            {report.recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-3 rounded-lg border border-[#CDCFC2] dark:border-slate-800 print:border-slate-300 bg-[#F0EFE6] dark:bg-slate-950/40 print:bg-slate-50 text-xs"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-[#1C241F] dark:text-white print:text-black">
                    [{rec.id}] {rec.title}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-[#E1DED1] dark:bg-slate-800 print:bg-slate-200 text-[#354037] dark:text-slate-300 print:text-slate-700">
                      {rec.category}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-signal-50 dark:bg-signal-950 text-signal-700 dark:text-signal-300 border border-signal-200 dark:border-signal-800 print:bg-slate-100 print:text-slate-800 print:border-slate-300 font-semibold">
                      Priority: {rec.priority}
                    </span>
                  </div>
                </div>
                <p className="text-[#354037] dark:text-slate-300 print:text-slate-700 leading-relaxed">{rec.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 11: Conclusion */}
        <section className="mb-8 border-b border-[#CDCFC2] dark:border-slate-800 print:border-slate-300 pb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-signal-600 dark:text-signal-400 print:text-slate-900 flex items-center gap-2 mb-3">
            <span>11. Conclusion</span>
          </h3>
          <p className="text-xs sm:text-sm text-[#354037] dark:text-slate-300 print:text-slate-800 leading-relaxed">
            {report.conclusion}
          </p>
        </section>

        {/* Analyst Custom Observations (if any) */}
        {report.analystObservations && (
          <section className="mb-8 border-b border-[#CDCFC2] dark:border-slate-800 print:border-slate-300 pb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-signal-600 dark:text-signal-400 print:text-slate-900 flex items-center gap-2 mb-3">
              <span>Analyst Supplemental Observations</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#354037] dark:text-slate-300 print:text-slate-800 leading-relaxed italic whitespace-pre-wrap">
              &quot;{report.analystObservations}&quot;
            </p>
          </section>
        )}

        {/* Appendices: Correlated Records & Evidence */}
        <section className="mb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#58635A] dark:text-slate-400 print:text-slate-700 flex items-center gap-2 mb-3">
            <span>Appendices: Forensic Evidence &amp; Telemetry References</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg border border-[#CDCFC2] dark:border-slate-800 print:border-slate-300 bg-[#F0EFE6] dark:bg-slate-950/60 print:bg-slate-50">
              <span className="font-semibold text-[#1C241F] dark:text-slate-300 print:text-slate-800 block mb-2">
                Correlated Alert IDs:
              </span>
              {report.relatedAlerts && report.relatedAlerts.length > 0 ? (
                <ul className="space-y-1 text-[#58635A] dark:text-slate-400 print:text-slate-600">
                  {report.relatedAlerts.map((a) => (
                    <li key={a.id}>
                      • {a.id} ({a.title}) [{a.severity}]
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-[#A8B09F] dark:text-slate-500 italic">No alerts linked.</span>
              )}
            </div>

            <div className="p-3 rounded-lg border border-[#CDCFC2] dark:border-slate-800 print:border-slate-300 bg-[#F0EFE6] dark:bg-slate-950/60 print:bg-slate-50">
              <span className="font-semibold text-[#1C241F] dark:text-slate-300 print:text-slate-800 block mb-2">
                Correlated Event IDs:
              </span>
              {report.relatedEvents && report.relatedEvents.length > 0 ? (
                <ul className="space-y-1 text-[#58635A] dark:text-slate-400 print:text-slate-600">
                  {report.relatedEvents.map((e) => (
                    <li key={e.id}>
                      • {e.id} ({e.action} on {e.sourceSystem})
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-[#A8B09F] dark:text-slate-500 italic">No events linked.</span>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-6 border-t border-[#CDCFC2] dark:border-slate-800 print:border-slate-300 text-center text-xs text-[#58635A] dark:text-slate-500 print:text-slate-600 space-y-1">
          <div>CyberGuard SOC Lab • Stage 8 Incident Documentation Engine</div>
          <div className="font-mono text-[10px]">
            Document Ref: {report.id} • Source Case: {report.incidentId} • All data synthetic for SOC training
          </div>
        </footer>
      </div>
    </div>
  );
};
