import { DetectionRule } from '../types/soc';

export const MOCK_DETECTION_RULES: DetectionRule[] = [
  {
    id: 'SIG-2026-001',
    title: 'LSASS Memory Extraction via Process Handle Access',
    description:
      'Detects access to the Local Security Authority Subsystem Service (LSASS) process handle requesting full memory access permissions, characteristic of credential dumping tools like Mimikatz or Taskmgr.',
    author: 'Florian Roth / SwiftOnSecurity (Sigma Adapted)',
    severity: 'critical',
    status: 'enabled',
    enabled: true,
    category: 'Credential Access',
    logsource: {
      category: 'process_access',
      product: 'Sysmon',
      service: 'security',
    },
    detection: {
      selections: [
        {
          name: 'selection_target',
          matchers: [
            {
              field: 'details.commandLine',
              operator: 'contains',
              value: 'lsass',
            },
          ],
        },
        {
          name: 'selection_access',
          matchers: [
            {
              field: 'details.rawPayloadSnippet',
              operator: 'contains',
              value: 'lsass.exe',
            },
          ],
        },
      ],
      condition: {
        type: 'any',
        selections: ['selection_target', 'selection_access'],
        rawConditionString: 'selection_target or selection_access',
      },
    },
    tags: ['attack.t1003.001', 'attack.credential_access', 'sysmon.eid10'],
    mitreTechniques: ['T1003.001 - LSASS Memory'],
    mitreTactics: ['Credential Access'],
    falsePositives: [
      'Antivirus and EDR sensor agent memory scanning processes',
      'Authorized Windows Error Reporting dumps (werfault.exe)',
    ],
    createdAt: '2026-09-15T00:00:00Z',
    updatedAt: '2026-10-31T07:00:00Z',
    sigmaYamlSnippet: `title: LSASS Memory Extraction via Process Handle Access
id: 552c6f14-2c26-4a4b-9e45-7e3e9d899881
status: stable
description: Detects access to LSASS requesting full memory access permissions
logsource:
    product: sysmon
    category: process_access
detection:
    selection_target:
        TargetImage|endswith: '\\lsass.exe'
    selection_access:
        GrantedAccess: '0x1FFFFF'
    condition: selection_target and selection_access
fields:
    - TargetImage
    - GrantedAccess
falsepositives:
    - Antivirus engine memory scans
level: critical`,
    isSimulated: true,
  },
  {
    id: 'SIG-2026-002',
    title: 'High-Volume Ingress SSH Authentication Failure Burst',
    description:
      'Identifies rapid successive SSH authentication failures on public-facing bastion hosts originating from external IP networks.',
    author: 'SOC Threat Hunter (CyberGuard Adapted)',
    severity: 'high',
    status: 'enabled',
    enabled: true,
    category: 'Initial Access',
    logsource: {
      category: 'firewall',
      product: 'pfSense Firewall',
      service: 'sshd',
    },
    detection: {
      selections: [
        {
          name: 'selection_port',
          matchers: [
            {
              field: 'details.port',
              operator: 'exact',
              value: 22,
            },
          ],
        },
        {
          name: 'selection_message',
          matchers: [
            {
              field: 'message',
              operator: 'contains',
              value: 'failed ssh password',
            },
          ],
        },
      ],
      condition: {
        type: 'all',
        selections: ['selection_port', 'selection_message'],
        rawConditionString: 'selection_port and selection_message',
      },
    },
    tags: ['attack.t1110.001', 'attack.initial_access', 'pfsense.sshd'],
    mitreTechniques: ['T1110.001 - Password Guessing'],
    mitreTactics: ['Credential Access', 'Initial Access'],
    falsePositives: [
      'Administrator forgotten password during routine homelab maintenance',
      'Automated deployment script key sync issues',
    ],
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-31T07:00:00Z',
    sigmaYamlSnippet: `title: High-Volume Ingress SSH Authentication Failure Burst
id: a891b2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c
status: stable
description: Detects rapid failed SSH authentication attempts on bastion host
logsource:
    product: pfsense
    service: sshd
detection:
    selection_port:
        DestinationPort: 22
    selection_message:
        Message|contains: 'failed SSH password'
    condition: selection_port and selection_message
level: high`,
    isSimulated: true,
  },
  {
    id: 'SIG-2026-003',
    title: 'Outbound TCP Connection to Non-Standard Shell Port (4444)',
    description:
      'Detects egress network sockets connecting to port 4444 (Metasploit default reverse shell listener) from internal compute nodes.',
    author: 'Emerging Threats / Suricata SIGMA',
    severity: 'critical',
    status: 'enabled',
    enabled: true,
    category: 'Command and Control',
    logsource: {
      category: 'network_traffic',
      product: 'Suricata NIDS',
      service: 'flow',
    },
    detection: {
      selections: [
        {
          name: 'selection_port',
          matchers: [
            {
              field: 'details.port',
              operator: 'exact',
              value: 4444,
            },
          ],
        },
        {
          name: 'selection_reverse_shell',
          matchers: [
            {
              field: 'message',
              operator: 'contains',
              value: 'reverse shell',
            },
          ],
        },
      ],
      condition: {
        type: 'all',
        selections: ['selection_port', 'selection_reverse_shell'],
        rawConditionString: 'selection_port and selection_reverse_shell',
      },
    },
    tags: ['attack.t1071.001', 'attack.command_and_control', 'suricata.et_open'],
    mitreTechniques: ['T1071.001 - Web Protocols', 'T1059.004 - Unix Shell'],
    mitreTactics: ['Command and Control'],
    falsePositives: [
      'Authorized internal software developer testing custom local microservices',
    ],
    createdAt: '2026-10-10T00:00:00Z',
    updatedAt: '2026-10-31T07:00:00Z',
    sigmaYamlSnippet: `title: Outbound TCP Connection to Non-Standard Shell Port (4444)
id: c7d8e9f0-1a2b-3c4d-5e6f-7a8b9c0d1e2f
status: stable
description: Identifies outbound communication over default reverse shell port 4444
logsource:
    product: suricata
    category: network_traffic
detection:
    selection_port:
        DestinationPort: 4444
    selection_reverse_shell:
        Payload|contains: 'Reverse shell'
    condition: selection_port and selection_reverse_shell
level: critical`,
    isSimulated: true,
  },
  {
    id: 'SIG-2026-004',
    title: 'Suspicious DNS Query with High Shannon Entropy Subdomain',
    description:
      'Flags recursive DNS queries with Shannon entropy indicative of base64 or base32 encoded data exfiltration and C2 beaconing.',
    author: 'Pi-hole Lab Threat Analytics',
    severity: 'high',
    status: 'enabled',
    enabled: true,
    category: 'Command and Control',
    logsource: {
      category: 'dns',
      product: 'Pi-hole DNS',
      service: 'ftl',
    },
    detection: {
      selections: [
        {
          name: 'selection_dns',
          matchers: [
            {
              field: 'details.protocol',
              operator: 'exact',
              value: 'DNS',
            },
            {
              field: 'message',
              operator: 'contains',
              value: 'entropy',
            },
          ],
        },
      ],
      condition: {
        type: 'selection',
        selections: ['selection_dns'],
        rawConditionString: 'selection_dns',
      },
    },
    tags: ['attack.t1071.004', 'attack.exfiltration', 'pihole.dnsmasq'],
    mitreTechniques: ['T1071.004 - DNS Protocol'],
    mitreTactics: ['Command and Control', 'Exfiltration'],
    falsePositives: [
      'Content Delivery Networks (CDNs) with hashed subdomains (e.g. akamai, cloudflare)',
      'Antivirus cloud reputation query domains',
    ],
    createdAt: '2026-10-12T00:00:00Z',
    updatedAt: '2026-10-31T07:00:00Z',
    sigmaYamlSnippet: `title: Suspicious DNS Query with High Shannon Entropy Subdomain
id: e4f5a6b7-8c9d-0e1f-2a3b-4c5d6e7f8a9b
status: stable
description: Detects DNS tunneling via high entropy query strings
logsource:
    product: pihole
    category: dns
detection:
    selection_dns:
        Protocol: 'DNS'
        Message|contains: 'entropy'
    condition: selection_dns
level: high`,
    isSimulated: true,
  },
  {
    id: 'SIG-2026-005',
    title: 'Persistence Mechanism via Scheduled Task in User AppData',
    description:
      'Detects creation of a Windows scheduled task executing scripts or binaries residing within user writable %APPDATA% directories.',
    author: 'Sigma HQ / Windows Threat Detection',
    severity: 'medium',
    status: 'enabled',
    enabled: true,
    category: 'Persistence',
    logsource: {
      category: 'process_creation',
      product: 'Sysmon',
      service: 'eid1',
    },
    detection: {
      selections: [
        {
          name: 'selection_schtasks',
          matchers: [
            {
              field: 'details.commandLine',
              operator: 'contains',
              value: 'schtasks',
            },
            {
              field: 'details.commandLine',
              operator: 'contains',
              value: 'appdata',
            },
          ],
        },
      ],
      condition: {
        type: 'selection',
        selections: ['selection_schtasks'],
        rawConditionString: 'selection_schtasks',
      },
    },
    tags: ['attack.t1053.005', 'attack.persistence', 'sysmon.eid1'],
    mitreTechniques: ['T1053.005 - Scheduled Task'],
    mitreTactics: ['Persistence', 'Execution'],
    falsePositives: [
      'Legitimate user application auto-updaters (Google Chrome, Discord, Spotify)',
    ],
    createdAt: '2026-09-20T00:00:00Z',
    updatedAt: '2026-10-31T07:00:00Z',
    sigmaYamlSnippet: `title: Persistence Mechanism via Scheduled Task in User AppData
id: f1a2b3c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d
status: stable
description: Detects registration of scheduled tasks pointing to AppData paths
logsource:
    product: sysmon
    category: process_creation
detection:
    selection_schtasks:
        CommandLine|contains|all:
            - 'schtasks'
            - 'appdata'
    condition: selection_schtasks
level: medium`,
    isSimulated: true,
  },
  {
    id: 'SIG-2026-006',
    title: 'Web Application Document Root Modification (JSP Web Shell)',
    description:
      'Identifies unauthorized creation or modification of server script files (.jsp, .php, .war) inside HTTP document root paths monitored by host FIM.',
    author: 'Wazuh Lab Rule Team',
    severity: 'critical',
    status: 'enabled',
    enabled: true,
    category: 'Persistence',
    logsource: {
      category: 'file_integrity',
      product: 'Wazuh Agent',
      service: 'syscheck',
    },
    detection: {
      selections: [
        {
          name: 'selection_shell',
          matchers: [
            {
              field: 'details.commandLine',
              operator: 'contains',
              value: 'shell.jsp',
            },
          ],
        },
      ],
      condition: {
        type: 'selection',
        selections: ['selection_shell'],
        rawConditionString: 'selection_shell',
      },
    },
    tags: ['attack.t1505.003', 'attack.persistence', 'wazuh.fim'],
    mitreTechniques: ['T1505.003 - Web Shell'],
    mitreTactics: ['Persistence', 'Initial Access'],
    falsePositives: [
      'Authorized application deployment updates and system administrator patches',
    ],
    createdAt: '2026-10-18T00:00:00Z',
    updatedAt: '2026-10-31T07:00:00Z',
    sigmaYamlSnippet: `title: Web Application Document Root Modification (JSP Web Shell)
id: 9a8b7c6d-5e4f-3a2b-1c0d-e9f8a7b6c5d4
status: stable
description: Alerts on creation of suspicious script files in web application directories
logsource:
    product: wazuh
    category: file_integrity
detection:
    selection_shell:
        TargetFilename|endswith: 'shell.jsp'
    condition: selection_shell
level: critical`,
    isSimulated: true,
  },
  {
    id: 'SIG-2026-007',
    title: 'Local Group Membership Tampering (Privileged Administrator Created)',
    description:
      'Detects local user account provisioning or addition to the built-in local Administrators security group.',
    author: 'Sigma HQ / Windows Audit',
    severity: 'medium',
    status: 'enabled',
    enabled: true,
    category: 'Privilege Escalation',
    logsource: {
      category: 'user_management',
      product: 'Wazuh Agent',
      service: 'security',
    },
    detection: {
      selections: [
        {
          name: 'selection_admin',
          matchers: [
            {
              field: 'message',
              operator: 'contains',
              value: 'administrators group',
            },
          ],
        },
      ],
      condition: {
        type: 'selection',
        selections: ['selection_admin'],
        rawConditionString: 'selection_admin',
      },
    },
    tags: ['attack.t1098', 'attack.privilege_escalation', 'wazuh.audit'],
    mitreTechniques: ['T1098 - Account Manipulation'],
    mitreTactics: ['Privilege Escalation', 'Persistence'],
    falsePositives: [
      'Designated service account creation during system configuration scripts',
    ],
    createdAt: '2026-09-25T00:00:00Z',
    updatedAt: '2026-10-31T07:00:00Z',
    sigmaYamlSnippet: `title: Local Group Membership Tampering (Privileged Administrator Created)
id: b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e
status: stable
description: Alerts when a local account is assigned administrative privileges
logsource:
    product: wazuh
    category: user_management
detection:
    selection_admin:
        Message|contains: 'administrators group'
    condition: selection_admin
level: medium`,
    isSimulated: true,
  },
  {
    id: 'SIG-2026-008',
    title: 'Stealth SYN Port Sweep Across Internal RFC 1918 Subnet',
    description:
      'Flags internal hosts issuing rapid TCP SYN packets across multiple IP addresses in the same local subnet without completing 3-way handshakes.',
    author: 'Suricata Open Ruleset',
    severity: 'medium',
    status: 'enabled',
    enabled: true,
    category: 'Discovery',
    logsource: {
      category: 'network_traffic',
      product: 'Suricata NIDS',
      service: 'flow',
    },
    detection: {
      selections: [
        {
          name: 'selection_scan',
          matchers: [
            {
              field: 'message',
              operator: 'contains',
              value: 'syn port scan sweep',
            },
          ],
        },
      ],
      condition: {
        type: 'selection',
        selections: ['selection_scan'],
        rawConditionString: 'selection_scan',
      },
    },
    tags: ['attack.t1046', 'attack.discovery', 'suricata.recon'],
    mitreTechniques: ['T1046 - Network Service Discovery'],
    mitreTactics: ['Discovery'],
    falsePositives: [
      'Network vulnerability scanners (Nessus, OpenVAS, Nmap inventory audits)',
    ],
    createdAt: '2026-10-05T00:00:00Z',
    updatedAt: '2026-10-31T07:00:00Z',
    sigmaYamlSnippet: `title: Stealth SYN Port Sweep Across Internal RFC 1918 Subnet
id: 3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f
status: stable
description: Identifies rapid SYN scanning sweeps targeting local subnet endpoints
logsource:
    product: suricata
    category: network_traffic
detection:
    selection_scan:
        Message|contains: 'SYN port scan sweep'
    condition: selection_scan
level: medium`,
    isSimulated: true,
  },
  {
    id: 'SIG-2026-009',
    title: 'Outbound HTTP Request to Newly Registered Domain (NRD)',
    description:
      'Detects web requests originating from internal endpoints destined for domains registered within the last 48 hours.',
    author: 'pfSense Lab Firewall SIGMA',
    severity: 'low',
    status: 'enabled',
    enabled: true,
    category: 'Network Traffic',
    logsource: {
      category: 'web_proxy',
      product: 'pfSense Firewall',
      service: 'squid',
    },
    detection: {
      selections: [
        {
          name: 'selection_nrd',
          matchers: [
            {
              field: 'message',
              operator: 'contains',
              value: 'newly registered domain',
            },
          ],
        },
      ],
      condition: {
        type: 'selection',
        selections: ['selection_nrd'],
        rawConditionString: 'selection_nrd',
      },
    },
    tags: ['attack.t1071.001', 'attack.command_and_control', 'pfsense.nrd'],
    mitreTechniques: ['T1071.001 - Web Protocols'],
    mitreTactics: ['Command and Control'],
    falsePositives: [
      'Legitimate new websites, marketing campaigns, or microservices',
    ],
    createdAt: '2026-09-10T00:00:00Z',
    updatedAt: '2026-10-31T07:00:00Z',
    sigmaYamlSnippet: `title: Outbound HTTP Request to Newly Registered Domain (NRD)
id: d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a
status: stable
description: Detects outbound web requests destined for newly registered domains
logsource:
    product: pfsense
    service: squid
detection:
    selection_nrd:
        Message|contains: 'newly registered domain'
    condition: selection_nrd
level: low`,
    isSimulated: true,
  },
  {
    id: 'SIG-2026-010',
    title: 'PowerShell Download and Execution via Encoded Command (Dormant Rule)',
    description:
      'Detects PowerShell process execution utilizing Base64 encoded command arguments (-enc, -encodedcommand) to stage unauthorized remote scripts. (Demonstration rule enabled but dormant in current telemetry).',
    author: 'Michael Haag / Sigma HQ',
    severity: 'high',
    status: 'enabled',
    enabled: true,
    category: 'Execution',
    logsource: {
      category: 'process_creation',
      product: 'Sysmon',
      service: 'eid1',
    },
    detection: {
      selections: [
        {
          name: 'selection_ps',
          matchers: [
            {
              field: 'details.commandLine',
              operator: 'contains',
              value: 'powershell.exe',
            },
            {
              field: 'details.commandLine',
              operator: 'contains',
              value: '-enc',
            },
          ],
        },
      ],
      condition: {
        type: 'selection',
        selections: ['selection_ps'],
        rawConditionString: 'selection_ps',
      },
    },
    tags: ['attack.t1059.001', 'attack.execution', 'sysmon.eid1'],
    mitreTechniques: ['T1059.001 - PowerShell'],
    mitreTactics: ['Execution'],
    falsePositives: [
      'Enterprise management agents executing encoded maintenance tasks',
    ],
    createdAt: '2026-08-15T00:00:00Z',
    updatedAt: '2026-10-31T07:00:00Z',
    sigmaYamlSnippet: `title: PowerShell Download and Execution via Encoded Command
id: a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6e
status: stable
description: Detects encoded PowerShell command execution
logsource:
    product: sysmon
    category: process_creation
detection:
    selection_ps:
        CommandLine|contains|all:
            - 'powershell.exe'
            - '-enc'
    condition: selection_ps
level: high`,
    isSimulated: true,
  },
  {
    id: 'SIG-2026-011',
    title: 'Kerberoasting Service Ticket Request Surge (Disabled Rule Demo)',
    description:
      'Identifies abnormal surges of Kerberos TGS-REQ service ticket requests requesting RC4-HMAC encryption, characteristic of offline ticket cracking attacks. (Shipped disabled by default for tuning).',
    author: 'SOC Identity Specialist',
    severity: 'high',
    status: 'disabled',
    enabled: false,
    category: 'Credential Access',
    logsource: {
      category: 'authentication',
      product: 'Wazuh Agent',
      service: 'security',
    },
    detection: {
      selections: [
        {
          name: 'selection_kerberos',
          matchers: [
            {
              field: 'message',
              operator: 'contains',
              value: 'kerberos ticket request surge',
            },
          ],
        },
      ],
      condition: {
        type: 'selection',
        selections: ['selection_kerberos'],
        rawConditionString: 'selection_kerberos',
      },
    },
    tags: ['attack.t1558.003', 'attack.credential_access', 'windows.event4769'],
    mitreTechniques: ['T1558.003 - Kerberoasting'],
    mitreTactics: ['Credential Access'],
    falsePositives: [
      'Legacy Microsoft Exchange servers or legacy Kerberos authentication clients',
    ],
    createdAt: '2026-07-20T00:00:00Z',
    updatedAt: '2026-10-31T07:00:00Z',
    sigmaYamlSnippet: `title: Kerberoasting Service Ticket Request Surge
id: 5a6b7c8d-9e0f-1a2b-3c4d-5e6f7a8b9c0d
status: experimental
description: Detects Kerberoasting ticket extraction attempts
logsource:
    product: wazuh
    category: authentication
detection:
    selection_kerberos:
        TicketEncryptionType: '0x17'
        EventID: 4769
    condition: selection_kerberos
level: high`,
    isSimulated: true,
  },
  {
    id: 'SIG-2026-012',
    title: 'Advanced Temporal Aggregation & Regex Anomaly (Unsupported Sigma Demo)',
    description:
      'Demonstrates Sigma rules requiring sliding temporal correlation windows (timeframe: 10m) or arbitrary regular expression evaluation (|re). The local detection engine safely flags this condition as unsupported rather than failing silently or fabricating false matches.',
    author: 'Sigma Specification Standard Test',
    severity: 'medium',
    status: 'unsupported',
    enabled: false,
    category: 'Anomaly Detection',
    logsource: {
      category: 'advanced_analytics',
      product: 'Suricata NIDS',
      service: 'statistical',
    },
    detection: {
      selections: [
        {
          name: 'selection_temporal_window',
          matchers: [
            {
              field: 'message',
              operator: 'contains',
              value: 'statistical_anomaly',
            },
          ],
        },
      ],
      condition: {
        type: 'unsupported',
        selections: ['selection_temporal_window'],
        rawConditionString: 'selection_temporal_window | count() by SourceIP > 50 in 10m',
      },
    },
    tags: ['sigma.unsupported', 'experimental.temporal_aggregation'],
    mitreTechniques: ['T1071 - Application Layer Protocol'],
    mitreTactics: ['Command and Control'],
    falsePositives: [
      'Requires full SIEM streaming pipeline engine; local client evaluates safely as unsupported.',
    ],
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-10-31T07:00:00Z',
    sigmaYamlSnippet: `title: Advanced Temporal Aggregation & Regex Anomaly
id: 0f1e2d3c-4b5a-6f7e-8d9c-0b1a2f3e4d5c
status: unsupported_locally
description: Demonstrates advanced Sigma time windows and regex aggregations
logsource:
    product: suricata
    category: statistical
detection:
    selection_temporal_window:
        FlowType: 'outbound'
    condition: selection_temporal_window | count() by SourceIP > 50 in 10m
level: medium`,
    isSimulated: true,
  },
];
