import { AttackTactic, AttackTechnique } from '../types/soc';

export const MITRE_DEMO_METADATA = {
  isSimulated: true,
  frameworkVersion: 'MITRE ATT&CK Enterprise v14 (Selected Demonstration Subset)',
  totalTacticsInEnterprise: 14,
  disclaimer:
    'This module renders a curated demonstration subset of the MITRE ATT&CK Enterprise matrix designed for SOC lab training, telemetry correlation, and detection coverage gap analysis. It is not the entire knowledge base.',
};

export const MOCK_ATTACK_TACTICS: AttackTactic[] = [
  {
    id: 'TA0043',
    name: 'Reconnaissance',
    shortName: 'reconnaissance',
    description:
      'The adversary is trying to gather information they can use to plan future operations.',
    order: 1,
  },
  {
    id: 'TA0042',
    name: 'Resource Development',
    shortName: 'resource-development',
    description:
      'The adversary is trying to establish resources they can use to support operations.',
    order: 2,
  },
  {
    id: 'TA0001',
    name: 'Initial Access',
    shortName: 'initial-access',
    description:
      'The adversary is trying to get into your network through targeted vectors.',
    order: 3,
  },
  {
    id: 'TA0002',
    name: 'Execution',
    shortName: 'execution',
    description:
      'The adversary is trying to run malicious code on internal endpoints.',
    order: 4,
  },
  {
    id: 'TA0003',
    name: 'Persistence',
    shortName: 'persistence',
    description:
      'The adversary is trying to maintain their foothold across reboots and credential resets.',
    order: 5,
  },
  {
    id: 'TA0004',
    name: 'Privilege Escalation',
    shortName: 'privilege-escalation',
    description:
      'The adversary is trying to gain higher-level permissions like SYSTEM or Domain Admin.',
    order: 6,
  },
  {
    id: 'TA0005',
    name: 'Defense Evasion',
    shortName: 'defense-evasion',
    description:
      'The adversary is trying to avoid being detected by security controls and sensors.',
    order: 7,
  },
  {
    id: 'TA0006',
    name: 'Credential Access',
    shortName: 'credential-access',
    description:
      'The adversary is trying to steal account names and passwords or tickets.',
    order: 8,
  },
  {
    id: 'TA0007',
    name: 'Discovery',
    shortName: 'discovery',
    description:
      'The adversary is trying to observe the system and internal network environment.',
    order: 9,
  },
  {
    id: 'TA0008',
    name: 'Lateral Movement',
    shortName: 'lateral-movement',
    description:
      'The adversary is trying to move through your environment to access critical systems.',
    order: 10,
  },
  {
    id: 'TA0009',
    name: 'Collection',
    shortName: 'collection',
    description:
      'The adversary is trying to gather data of interest to their operational goal.',
    order: 11,
  },
  {
    id: 'TA0011',
    name: 'Command and Control',
    shortName: 'command-and-control',
    description:
      'The adversary is communicating with compromised systems to control them remotely.',
    order: 12,
  },
  {
    id: 'TA0010',
    name: 'Exfiltration',
    shortName: 'exfiltration',
    description:
      'The adversary is trying to steal and transmit sensitive data out of your network.',
    order: 13,
  },
  {
    id: 'TA0040',
    name: 'Impact',
    shortName: 'impact',
    description:
      'The adversary is trying to manipulate, interrupt, or destroy your systems and data.',
    order: 14,
  },
];

export const MOCK_ATTACK_TECHNIQUES: AttackTechnique[] = [
  // 1. Reconnaissance (TA0043)
  {
    id: 'T1595',
    name: 'Active Scanning',
    description:
      'Adversaries may execute active reconnaissance scans to gather information that can be used during targeting, such as network IP ranges, open ports, and live hosts.',
    tacticIds: ['TA0043'],
    parentTechniqueId: undefined,
    subTechniqueIds: ['T1595.001', 'T1595.002'],
    detectionRuleIds: [],
    associatedAlertIds: [],
    associatedEventIds: [],
    coverageStatus: 'uncovered',
    isSimulated: true,
  },
  {
    id: 'T1592',
    name: 'Gather Victim Host Information',
    description:
      'Adversaries may gather information about the victim host configuration, operating system, and hardware specs to tailor subsequent exploits.',
    tacticIds: ['TA0043'],
    detectionRuleIds: [],
    associatedAlertIds: [],
    associatedEventIds: [],
    coverageStatus: 'uncovered',
    isSimulated: true,
  },

  // 2. Resource Development (TA0042)
  {
    id: 'T1583',
    name: 'Acquire Infrastructure',
    description:
      'Adversaries may buy, lease, or rent infrastructure including domains, VPS instances, or botnets that can be used during targeting and command-and-control.',
    tacticIds: ['TA0042'],
    detectionRuleIds: [],
    associatedAlertIds: [],
    associatedEventIds: [],
    coverageStatus: 'uncovered',
    isSimulated: true,
  },
  {
    id: 'T1584',
    name: 'Compromise Infrastructure',
    description:
      'Adversaries may compromise third-party infrastructure (such as shared hosting or staging servers) to stage payloads and mask origins.',
    tacticIds: ['TA0042'],
    detectionRuleIds: [],
    associatedAlertIds: [],
    associatedEventIds: [],
    coverageStatus: 'uncovered',
    isSimulated: true,
  },

  // 3. Initial Access (TA0001)
  {
    id: 'T1566',
    name: 'Phishing',
    description:
      'Adversaries may send phishing messages to gain access to victim systems via spearphishing attachments or malicious credential harvesting links.',
    tacticIds: ['TA0001'],
    subTechniqueIds: ['T1566.001'],
    detectionRuleIds: [],
    associatedAlertIds: ['ALT-2026-114'],
    associatedEventIds: ['EVT-90400'],
    coverageStatus: 'partially-covered',
    isSimulated: true,
  },
  {
    id: 'T1566.001',
    name: 'Spearphishing Attachment',
    description:
      'Adversaries may send spearphishing emails with malicious email attachments (.iso, .lnk, .vbs) to execute initial payloads when opened by users.',
    tacticIds: ['TA0001'],
    parentTechniqueId: 'T1566',
    detectionRuleIds: [],
    associatedAlertIds: ['ALT-2026-114'],
    associatedEventIds: ['EVT-90400'],
    coverageStatus: 'partially-covered',
    isSimulated: true,
  },
  {
    id: 'T1078',
    name: 'Valid Accounts',
    description:
      'Adversaries may obtain and abuse credentials of existing accounts as a means of gaining Initial Access, Persistence, or Defense Evasion.',
    tacticIds: ['TA0001', 'TA0003', 'TA0005'],
    detectionRuleIds: [],
    associatedAlertIds: ['ALT-2026-115'],
    associatedEventIds: ['EVT-90399'],
    coverageStatus: 'partially-covered',
    isSimulated: true,
  },

  // 4. Execution (TA0002)
  {
    id: 'T1059',
    name: 'Command and Scripting Interpreter',
    description:
      'Adversaries may abuse command and script interpreters (PowerShell, Windows Command Shell, Unix Shell) to execute commands and malicious payloads.',
    tacticIds: ['TA0002'],
    subTechniqueIds: ['T1059.001', 'T1059.004'],
    detectionRuleIds: ['SIG-2026-010'],
    associatedAlertIds: ['ALT-2026-101'],
    associatedEventIds: ['EVT-90412'],
    coverageStatus: 'covered',
    isSimulated: true,
  },
  {
    id: 'T1059.001',
    name: 'PowerShell',
    description:
      'Adversaries may abuse PowerShell commands and scripts for execution, leveraging hidden flags, base64 encoding, or WebClient memory staging.',
    tacticIds: ['TA0002'],
    parentTechniqueId: 'T1059',
    detectionRuleIds: ['SIG-2026-010'],
    associatedAlertIds: ['ALT-2026-101'],
    associatedEventIds: ['EVT-90412'],
    coverageStatus: 'covered',
    isSimulated: true,
  },
  {
    id: 'T1059.004',
    name: 'Unix Shell',
    description:
      'Adversaries may abuse Unix shells (e.g., bash, sh, zsh) to execute malicious commands, shell scripts, or interactive reverse shells.',
    tacticIds: ['TA0002'],
    parentTechniqueId: 'T1059',
    detectionRuleIds: ['SIG-2026-003'],
    associatedAlertIds: ['ALT-2026-105'],
    associatedEventIds: ['EVT-90409'],
    coverageStatus: 'covered',
    isSimulated: true,
  },
  {
    id: 'T1053.005',
    name: 'Scheduled Task',
    description:
      'Adversaries may abuse the Windows Task Scheduler (schtasks.exe) to execute programs at system startup or on a scheduled basis for persistence or execution.',
    tacticIds: ['TA0002', 'TA0003'],
    detectionRuleIds: ['SIG-2026-005'],
    associatedAlertIds: ['ALT-2026-107'],
    associatedEventIds: ['EVT-90407'],
    coverageStatus: 'covered',
    isSimulated: true,
  },

  // 5. Persistence (TA0003)
  {
    id: 'T1505.003',
    name: 'Web Shell',
    description:
      'Adversaries may backdoor web servers by placing scripts (e.g. .jsp, .php, .asp) in web-accessible directories to retain continuous remote shell access.',
    tacticIds: ['TA0003', 'TA0001'],
    detectionRuleIds: ['SIG-2026-006'],
    associatedAlertIds: ['ALT-2026-108'],
    associatedEventIds: ['EVT-90406'],
    coverageStatus: 'covered',
    isSimulated: true,
  },
  {
    id: 'T1098',
    name: 'Account Manipulation',
    description:
      'Adversaries may manipulate accounts to maintain access to victim systems, such as adding accounts to the local Administrators or Domain Admins group.',
    tacticIds: ['TA0003', 'TA0004'],
    detectionRuleIds: ['SIG-2026-007'],
    associatedAlertIds: ['ALT-2026-109'],
    associatedEventIds: ['EVT-90405'],
    coverageStatus: 'covered',
    isSimulated: true,
  },

  // 6. Privilege Escalation (TA0004)
  {
    id: 'T1548',
    name: 'Abuse Elevation Control Mechanism',
    description:
      'Adversaries may circumvent elevation mechanisms like Windows UAC or sudo rules to execute processes with root or administrative privileges.',
    tacticIds: ['TA0004', 'TA0005'],
    detectionRuleIds: [],
    associatedAlertIds: [],
    associatedEventIds: [],
    coverageStatus: 'uncovered',
    isSimulated: true,
  },

  // 7. Defense Evasion (TA0005)
  {
    id: 'T1562.001',
    name: 'Disable or Modify Tools',
    description:
      'Adversaries may disable and modify security tools such as antivirus, EDR agents, or firewalls to avoid detection of their payloads and activities.',
    tacticIds: ['TA0005'],
    detectionRuleIds: [],
    associatedAlertIds: ['ALT-2026-112'],
    associatedEventIds: ['EVT-90402'],
    coverageStatus: 'partially-covered',
    isSimulated: true,
  },
  {
    id: 'T1070',
    name: 'Indicator Removal on Host',
    description:
      'Adversaries may delete or alter generated artifacts on a host system, such as clearing event logs or deleting history files.',
    tacticIds: ['TA0005'],
    detectionRuleIds: [],
    associatedAlertIds: [],
    associatedEventIds: [],
    coverageStatus: 'uncovered',
    isSimulated: true,
  },

  // 8. Credential Access (TA0006)
  {
    id: 'T1003',
    name: 'OS Credential Dumping',
    description:
      'Adversaries may dump credentials from the operating system memory, security accounts manager (SAM), or LSA secrets to obtain plaintext passwords or hashes.',
    tacticIds: ['TA0006'],
    subTechniqueIds: ['T1003.001'],
    detectionRuleIds: ['SIG-2026-001'],
    associatedAlertIds: ['ALT-2026-102'],
    associatedEventIds: ['EVT-90411'],
    coverageStatus: 'covered',
    isSimulated: true,
  },
  {
    id: 'T1003.001',
    name: 'LSASS Memory',
    description:
      'Adversaries may attempt to access credential material stored in the process memory of the Local Security Authority Subsystem Service (LSASS).',
    tacticIds: ['TA0006'],
    parentTechniqueId: 'T1003',
    detectionRuleIds: ['SIG-2026-001'],
    associatedAlertIds: ['ALT-2026-102'],
    associatedEventIds: ['EVT-90411'],
    coverageStatus: 'covered',
    isSimulated: true,
  },
  {
    id: 'T1110',
    name: 'Brute Force',
    description:
      'Adversaries may use brute force techniques such as password guessing or credential stuffing to gain access to user or service accounts.',
    tacticIds: ['TA0006'],
    subTechniqueIds: ['T1110.001'],
    detectionRuleIds: ['SIG-2026-002'],
    associatedAlertIds: ['ALT-2026-104'],
    associatedEventIds: ['EVT-90410'],
    coverageStatus: 'covered',
    isSimulated: true,
  },
  {
    id: 'T1110.001',
    name: 'Password Guessing',
    description:
      'Adversaries may systematically guess passwords on remote authentication services like SSH or RDP to find valid credentials.',
    tacticIds: ['TA0006', 'TA0001'],
    parentTechniqueId: 'T1110',
    detectionRuleIds: ['SIG-2026-002'],
    associatedAlertIds: ['ALT-2026-104'],
    associatedEventIds: ['EVT-90410'],
    coverageStatus: 'covered',
    isSimulated: true,
  },
  {
    id: 'T1558.003',
    name: 'Kerberoasting',
    description:
      'Adversaries may request service tickets (TGS-REQ) for service principal names (SPNs) with RC4 encryption to crack hashes offline. (Currently mapped to disabled rule SIG-2026-011).',
    tacticIds: ['TA0006'],
    detectionRuleIds: ['SIG-2026-011'],
    associatedAlertIds: [],
    associatedEventIds: [],
    // Since SIG-2026-011 is disabled by default, dynamically computed status will be 'uncovered' or 'partially-covered'
    coverageStatus: 'uncovered',
    isSimulated: true,
  },

  // 9. Discovery (TA0007)
  {
    id: 'T1046',
    name: 'Network Service Discovery',
    description:
      'Adversaries may attempt to get a listing of services running on remote hosts and local subnets by performing port scanning and sweep sweeps.',
    tacticIds: ['TA0007'],
    detectionRuleIds: ['SIG-2026-008'],
    associatedAlertIds: ['ALT-2026-110'],
    associatedEventIds: ['EVT-90404'],
    coverageStatus: 'covered',
    isSimulated: true,
  },
  {
    id: 'T1082',
    name: 'System Information Discovery',
    description:
      'Adversaries may attempt to get detailed information about the operating system and hardware, including version, patches, and architecture.',
    tacticIds: ['TA0007'],
    detectionRuleIds: [],
    associatedAlertIds: [],
    associatedEventIds: [],
    coverageStatus: 'uncovered',
    isSimulated: true,
  },

  // 10. Lateral Movement (TA0008)
  {
    id: 'T1021.002',
    name: 'SMB/Windows Admin Shares',
    description:
      'Adversaries may use valid accounts to interact with remote SMB shares (C$, ADMIN$, IPC$) to execute code or stage tools across lateral nodes.',
    tacticIds: ['TA0008'],
    detectionRuleIds: [],
    associatedAlertIds: ['ALT-2026-113'],
    associatedEventIds: ['EVT-90401'],
    coverageStatus: 'partially-covered',
    isSimulated: true,
  },
  {
    id: 'T1021.004',
    name: 'SSH Lateral Movement',
    description:
      'Adversaries may log into remote Linux systems via SSH using stolen private keys or compromised credentials to traverse the homelab network.',
    tacticIds: ['TA0008'],
    detectionRuleIds: [],
    associatedAlertIds: [],
    associatedEventIds: [],
    coverageStatus: 'uncovered',
    isSimulated: true,
  },

  // 11. Collection (TA0009)
  {
    id: 'T1005',
    name: 'Data from Local System',
    description:
      'Adversaries may search local file systems and connected storage drives for sensitive information, proprietary source code, or configuration keys.',
    tacticIds: ['TA0009'],
    detectionRuleIds: [],
    associatedAlertIds: [],
    associatedEventIds: [],
    coverageStatus: 'uncovered',
    isSimulated: true,
  },
  {
    id: 'T1114',
    name: 'Email Collection',
    description:
      'Adversaries may target user email repositories and mail client local storage to collect sensitive communications and attachments.',
    tacticIds: ['TA0009'],
    detectionRuleIds: [],
    associatedAlertIds: [],
    associatedEventIds: [],
    coverageStatus: 'uncovered',
    isSimulated: true,
  },

  // 12. Command and Control (TA0011)
  {
    id: 'T1071',
    name: 'Application Layer Protocol',
    description:
      'Adversaries may communicate using application layer protocols (HTTP, HTTPS, DNS) to blend in with legitimate enterprise network traffic.',
    tacticIds: ['TA0011'],
    subTechniqueIds: ['T1071.001', 'T1071.004'],
    detectionRuleIds: ['SIG-2026-012'], // Mapped to unsupported demo rule
    associatedAlertIds: [],
    associatedEventIds: [],
    coverageStatus: 'uncovered',
    isSimulated: true,
  },
  {
    id: 'T1071.001',
    name: 'Web Protocols',
    description:
      'Adversaries may communicate using application layer web protocols (HTTP, HTTPS) to disguise C2 sessions and bypass perimeter egress filters.',
    tacticIds: ['TA0011'],
    parentTechniqueId: 'T1071',
    detectionRuleIds: ['SIG-2026-003', 'SIG-2026-009'],
    associatedAlertIds: ['ALT-2026-105', 'ALT-2026-111'],
    associatedEventIds: ['EVT-90409', 'EVT-90403'],
    coverageStatus: 'covered',
    isSimulated: true,
  },
  {
    id: 'T1071.004',
    name: 'DNS Protocol',
    description:
      'Adversaries may communicate using the Domain Name System (DNS) application layer protocol to convey C2 commands or tunnel encrypted data.',
    tacticIds: ['TA0011', 'TA0010'],
    parentTechniqueId: 'T1071',
    detectionRuleIds: ['SIG-2026-004'],
    associatedAlertIds: ['ALT-2026-106'],
    associatedEventIds: ['EVT-90408'],
    coverageStatus: 'covered',
    isSimulated: true,
  },

  // 13. Exfiltration (TA0010)
  {
    id: 'T1041',
    name: 'Exfiltration Over C2 Channel',
    description:
      'Adversaries may steal and exfiltrate data by communicating over the existing established command and control communication channel.',
    tacticIds: ['TA0010'],
    detectionRuleIds: [],
    associatedAlertIds: ['ALT-2026-106'],
    associatedEventIds: ['EVT-90408'],
    coverageStatus: 'partially-covered',
    isSimulated: true,
  },
  {
    id: 'T1048',
    name: 'Exfiltration Over Alternative Protocol',
    description:
      'Adversaries may steal data by exfiltrating it over a different protocol than that used for command and control, such as FTP or ICMP payloads.',
    tacticIds: ['TA0010'],
    detectionRuleIds: [],
    associatedAlertIds: [],
    associatedEventIds: [],
    coverageStatus: 'uncovered',
    isSimulated: true,
  },

  // 14. Impact (TA0040)
  {
    id: 'T1486',
    name: 'Data Encrypted for Impact',
    description:
      'Adversaries may encrypt data on target systems to interrupt availability to system and network resources, typical of ransomware deployments.',
    tacticIds: ['TA0040'],
    detectionRuleIds: [],
    associatedAlertIds: ['ALT-2026-103'],
    associatedEventIds: ['EVT-90413'],
    coverageStatus: 'partially-covered',
    isSimulated: true,
  },
  {
    id: 'T1499',
    name: 'Endpoint Denial of Service',
    description:
      'Adversaries may perform endpoint denial of service attacks to degrade or block the availability of targeted servers or service daemons.',
    tacticIds: ['TA0040'],
    detectionRuleIds: [],
    associatedAlertIds: [],
    associatedEventIds: [],
    coverageStatus: 'uncovered',
    isSimulated: true,
  },
];
