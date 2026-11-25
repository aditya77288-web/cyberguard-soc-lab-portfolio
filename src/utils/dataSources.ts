import {
  ConnectionCheckRecord,
  DataSourceFilterState,
  DataSourcesMetrics,
  IngestionActivityRecord,
  LogDataSource,
  SecurityEvent,
  SeverityLevel,
  DataSource,
} from '../types/soc';

export const LOCAL_STORAGE_SOURCES_KEY = 'cyberguard_soc_sources_v1';
export const LOCAL_STORAGE_INGESTION_LOGS_KEY = 'cyberguard_soc_ingestion_logs_v1';
export const LOCAL_STORAGE_EVENTS_KEY = 'cyberguard_soc_events_v1';

/**
 * Normalizes an incoming raw or synthetic event into the canonical SecurityEvent schema.
 * Provides safe defaults for missing optional fields and prevents silent data corruption.
 */
export function normalizeIncomingEvent(
  raw: Partial<SecurityEvent> & { sourceSystem?: string; dataSourceId?: string }
): SecurityEvent {
  const now = new Date().toISOString();

  // Validate or construct a stable ID
  const id =
    typeof raw.id === 'string' && raw.id.trim().length > 0
      ? raw.id.trim()
      : `EVT-GEN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  // Normalize timestamp
  let timestamp = raw.timestamp || now;
  if (isNaN(new Date(timestamp).getTime())) {
    timestamp = now;
  }

  // Validate severity
  const validSeverities: SeverityLevel[] = ['low', 'medium', 'high', 'critical'];
  const severity: SeverityLevel = validSeverities.includes(raw.severity as SeverityLevel)
    ? (raw.severity as SeverityLevel)
    : 'low';

  // Normalize action
  const validActions = ['Blocked', 'Alerted', 'Quarantined', 'Logged'] as const;
  const action = validActions.includes(raw.action as any) ? raw.action! : 'Logged';

  return {
    id,
    timestamp,
    ruleName: raw.ruleName?.trim() || 'Generic Security Log Ingestion',
    ruleId: raw.ruleId?.trim() || 'RULE-INGEST-001',
    severity,
    sourceSystem: raw.sourceSystem?.trim() || 'Synthetic Ingestion Pipeline',
    category: raw.category?.trim() || 'System Activity',
    mitreTechnique: raw.mitreTechnique?.trim() || 'T1082 - System Information Discovery',
    mitreTactic: raw.mitreTactic?.trim() || 'Discovery',
    sourceIp: raw.sourceIp?.trim() || '192.168.1.100',
    destinationIp: raw.destinationIp?.trim() || '192.168.1.1',
    host: raw.host?.trim() || 'lab-workstation-01',
    action,
    user: raw.user?.trim() || raw.details?.user?.trim() || 'SYSTEM',
    message: raw.message?.trim() || 'Simulated log collector record ingested into pipeline',
    relatedAlertId: raw.relatedAlertId || null,
    isSimulated: true,
    dataSourceId: raw.dataSourceId?.trim() || undefined,
    details: {
      process: raw.details?.process || 'collector.exe',
      user: raw.details?.user || raw.user || 'SYSTEM',
      protocol: raw.details?.protocol || 'TCP',
      port: typeof raw.details?.port === 'number' ? raw.details.port : 443,
      sha256: raw.details?.sha256,
      commandLine: raw.details?.commandLine,
      rawPayloadSnippet: raw.details?.rawPayloadSnippet || raw.message,
    },
  };
}

/**
 * Pre-defined realistic event templates for each supported data source type.
 */
interface EventTemplate {
  ruleName: string;
  ruleId: string;
  severity: SeverityLevel;
  category: string;
  mitreTechnique: string;
  mitreTactic: string;
  action: 'Blocked' | 'Alerted' | 'Quarantined' | 'Logged';
  message: string;
  sourceIp: string;
  destinationIp: string;
  host: string;
  user: string;
  details: {
    process?: string;
    protocol?: string;
    port?: number;
    commandLine?: string;
    rawPayloadSnippet?: string;
    sha256?: string;
  };
}

const TEMPLATES_BY_TYPE: Record<string, EventTemplate[]> = {
  'windows-event-log': [
    {
      ruleName: 'Windows Security Event Log 4625: An account failed to log on',
      ruleId: 'SEC-WIN-4625',
      severity: 'medium',
      category: 'Credential Access',
      mitreTechnique: 'T1110.001 - Password Guessing',
      mitreTactic: 'Credential Access',
      action: 'Alerted',
      message: 'Failed login attempt for user Administrator from workstation IP 192.168.1.180',
      sourceIp: '192.168.1.180',
      destinationIp: '192.168.1.10',
      host: 'lab-dc-01',
      user: 'Administrator',
      details: {
        process: 'lsass.exe',
        protocol: 'Kerberos/TCP',
        port: 88,
        commandLine: 'EventID=4625 LogonType=3 Status=0xC000006D SubStatus=0xC000006A',
        rawPayloadSnippet: 'Microsoft-Windows-Security-Auditing: EventID 4625, TargetUserName Administrator, FailureReason Unknown user name or bad password',
      },
    },
    {
      ruleName: 'Windows System Event Log 7045: A new service was installed',
      ruleId: 'SEC-WIN-7045',
      severity: 'high',
      category: 'Persistence',
      mitreTechnique: 'T1543.003 - Windows Service',
      mitreTactic: 'Persistence',
      action: 'Alerted',
      message: 'New service PsExecSvc installed in system by user DOMAIN\\svc-admin',
      sourceIp: '192.168.1.145',
      destinationIp: '192.168.1.10',
      host: 'lab-dc-01',
      user: 'DOMAIN\\svc-admin',
      details: {
        process: 'services.exe',
        protocol: 'SMB/TCP',
        port: 445,
        commandLine: 'sc.exe create PsExecSvc binpath= "C:\\Windows\\PSEXESVC.exe"',
        rawPayloadSnippet: 'Service Control Manager: EventID 7045, ServiceName: PsExecSvc, ServiceFileName: C:\\Windows\\PSEXESVC.exe',
      },
    },
    {
      ruleName: 'Windows Security Event Log 4688: A new process has been created',
      ruleId: 'SEC-WIN-4688',
      severity: 'low',
      category: 'Execution',
      mitreTechnique: 'T1059.001 - PowerShell',
      mitreTactic: 'Execution',
      action: 'Logged',
      message: 'Process creation: powershell.exe spawned by explorer.exe for user alice.smith',
      sourceIp: '192.168.1.145',
      destinationIp: '192.168.1.145',
      host: 'lab-workstation-01',
      user: 'alice.smith',
      details: {
        process: 'powershell.exe',
        protocol: 'INTERNAL',
        commandLine: 'powershell.exe -ExecutionPolicy Bypass -File C:\\Scripts\\backup.ps1',
        rawPayloadSnippet: 'EventID 4688: NewProcessName: C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe, Creator: explorer.exe',
      },
    },
  ],
  sysmon: [
    {
      ruleName: 'Sysmon EID 1: Suspicious Encoded PowerShell Process Execution',
      ruleId: 'SEC-SYS-001',
      severity: 'critical',
      category: 'Execution',
      mitreTechnique: 'T1059.001 - PowerShell',
      mitreTactic: 'Execution',
      action: 'Alerted',
      message: 'Sysmon Event ID 1: powershell.exe executed with base64 encoded command arguments',
      sourceIp: '192.168.1.145',
      destinationIp: '198.51.100.22',
      host: 'lab-workstation-01',
      user: 'bob.investigator',
      details: {
        process: 'powershell.exe',
        protocol: 'TCP',
        port: 443,
        commandLine: 'powershell.exe -NoP -NonI -W Hidden -Enc JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0AA==',
        rawPayloadSnippet: 'Sysmon EID 1: Image: C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe, ParentImage: cmd.exe, User: CORP\\bob.investigator',
        sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      },
    },
    {
      ruleName: 'Sysmon EID 10: LSASS Memory Handle Access Request',
      ruleId: 'SEC-SYS-010',
      severity: 'critical',
      category: 'Credential Access',
      mitreTechnique: 'T1003.001 - LSASS Memory',
      mitreTactic: 'Credential Access',
      action: 'Alerted',
      message: 'Sysmon Event ID 10: Process taskmgr.exe requested full handle permissions (0x1FFFFF) to lsass.exe',
      sourceIp: '192.168.1.145',
      destinationIp: '192.168.1.145',
      host: 'lab-workstation-01',
      user: 'SYSTEM',
      details: {
        process: 'taskmgr.exe',
        commandLine: 'taskmgr.exe /dump',
        rawPayloadSnippet: 'Sysmon EID 10: SourceImage: C:\\Windows\\System32\\taskmgr.exe, TargetImage: C:\\Windows\\System32\\lsass.exe, GrantedAccess: 0x1FFFFF',
      },
    },
    {
      ruleName: 'Sysmon EID 3: Suspicious Outbound Network Connection from Rundll32',
      ruleId: 'SEC-SYS-003',
      severity: 'high',
      category: 'Command and Control',
      mitreTechnique: 'T1218.011 - Rundll32',
      mitreTactic: 'Defense Evasion',
      action: 'Alerted',
      message: 'Sysmon Event ID 3: rundll32.exe established outbound TCP connection to untrusted external IP',
      sourceIp: '192.168.1.145',
      destinationIp: '203.0.113.195',
      host: 'lab-workstation-01',
      user: 'alice.smith',
      details: {
        process: 'rundll32.exe',
        protocol: 'TCP',
        port: 8443,
        commandLine: 'rundll32.exe C:\\Users\\Public\\update.dll,DllRegisterServer',
        rawPayloadSnippet: 'Sysmon EID 3: Image: C:\\Windows\\System32\\rundll32.exe, DestinationIp: 203.0.113.195, DestinationPort: 8443',
      },
    },
  ],
  'linux-auth': [
    {
      ruleName: 'Linux SSH Failed Password Brute-Force Attempt',
      ruleId: 'SEC-LNX-001',
      severity: 'high',
      category: 'Credential Access',
      mitreTechnique: 'T1110.001 - Password Guessing',
      mitreTactic: 'Credential Access',
      action: 'Blocked',
      message: 'sshd: Failed password for invalid user root from 198.51.100.42 port 48210 ssh2',
      sourceIp: '198.51.100.42',
      destinationIp: '192.168.1.10',
      host: 'lab-bastion-srv',
      user: 'root',
      details: {
        process: 'sshd[28419]',
        protocol: 'SSH/TCP',
        port: 22,
        rawPayloadSnippet: 'sshd[28419]: Failed password for invalid user root from 198.51.100.42 port 48210 ssh2 [54 failed attempts in 60s]',
      },
    },
    {
      ruleName: 'Linux Sudo Command Execution with Root Privileges',
      ruleId: 'SEC-LNX-002',
      severity: 'low',
      category: 'Privilege Escalation',
      mitreTechnique: 'T1548.003 - Sudo and Sudo Caching',
      mitreTactic: 'Privilege Escalation',
      action: 'Logged',
      message: 'pam_unix(sudo:session): session opened for user root by ubuntu(uid=1000)',
      sourceIp: '192.168.1.15',
      destinationIp: '192.168.1.10',
      host: 'lab-bastion-srv',
      user: 'ubuntu',
      details: {
        process: 'sudo',
        protocol: 'INTERNAL',
        commandLine: 'sudo /usr/bin/apt-get update',
        rawPayloadSnippet: 'sudo:   ubuntu : TTY=pts/0 ; PWD=/home/ubuntu ; USER=root ; COMMAND=/usr/bin/apt-get update',
      },
    },
  ],
  zeek: [
    {
      ruleName: 'Zeek DNS High Entropy Tunneling Query Detected',
      ruleId: 'SEC-ZEEK-DNS',
      severity: 'high',
      category: 'Command and Control',
      mitreTechnique: 'T1071.004 - DNS Protocol',
      mitreTactic: 'Command and Control',
      action: 'Alerted',
      message: 'Zeek dns.log: high entropy TXT query payload indicating DNS tunneling channel',
      sourceIp: '192.168.1.188',
      destinationIp: '192.168.1.5',
      host: 'lab-iot-gateway',
      user: 'systemd-resolved',
      details: {
        process: 'zeek-dns-analyzer',
        protocol: 'UDP',
        port: 53,
        commandLine: 'query: v3-x89a19c00bfa.exfil-stream.sinkhole-lab.internal',
        rawPayloadSnippet: 'zeek dns.log: uid=CHhAv25vJ9vT, id.orig_h=192.168.1.188, qtype_name=TXT, Shannon Entropy=4.89, answers=data-block-1',
      },
    },
    {
      ruleName: 'Zeek SSL Self-Signed Certificate Observed on Standard Port',
      ruleId: 'SEC-ZEEK-SSL',
      severity: 'medium',
      category: 'Initial Access',
      mitreTechnique: 'T1573.002 - Asymmetric Cryptography',
      mitreTactic: 'Command and Control',
      action: 'Logged',
      message: 'Zeek ssl.log: untrusted self-signed certificate subject /CN=default-c2-beacon',
      sourceIp: '192.168.1.145',
      destinationIp: '198.51.100.88',
      host: 'lab-workstation-01',
      user: 'SYSTEM',
      details: {
        process: 'zeek-ssl-analyzer',
        protocol: 'TLSv1.3',
        port: 443,
        rawPayloadSnippet: 'zeek ssl.log: issuer=/CN=default-c2-beacon, validation_status=self-signed, cipher=TLS_AES_256_GCM_SHA384',
      },
    },
  ],
  suricata: [
    {
      ruleName: 'Suricata ET MALWARE Cobalt Strike Malleable C2 HTTP Beaconing',
      ruleId: 'ET-MAL-2038101',
      severity: 'critical',
      category: 'Command and Control',
      mitreTechnique: 'T1071.001 - Web Protocols',
      mitreTactic: 'Command and Control',
      action: 'Alerted',
      message: 'Suricata alert: ET MALWARE Cobalt Strike Malleable C2 HTTP Beaconing Pattern detected',
      sourceIp: '192.168.1.145',
      destinationIp: '198.51.100.88',
      host: 'lab-workstation-01',
      user: 'NETWORK_SENSOR',
      details: {
        process: 'suricata',
        protocol: 'HTTP/TCP',
        port: 8080,
        rawPayloadSnippet: 'EVE-JSON: alert: {"action":"allowed","gid":1,"signature_id":2038101,"rev":1,"signature":"ET MALWARE Cobalt Strike Malleable C2 Beacon"}',
      },
    },
    {
      ruleName: 'Suricata ET SCAN Potential Nmap OS Detection Probe',
      ruleId: 'ET-SCAN-2000537',
      severity: 'medium',
      category: 'Reconnaissance',
      mitreTechnique: 'T1046 - Network Service Discovery',
      mitreTactic: 'Reconnaissance',
      action: 'Blocked',
      message: 'Suricata alert: ET SCAN Potential Nmap OS Detection Probe TCP flags SYN/ECN/CWR',
      sourceIp: '203.0.113.88',
      destinationIp: '192.168.1.1',
      host: 'sensor-nids-01',
      user: 'NIDS',
      details: {
        process: 'suricata',
        protocol: 'TCP',
        port: 80,
        rawPayloadSnippet: 'EVE-JSON: alert: {"signature_id":2000537,"signature":"ET SCAN Potential Nmap OS Detection Probe"}',
      },
    },
  ],
  firewall: [
    {
      ruleName: 'pfSense Firewall: WAN Default Block Inbound Rule Dropped Packet',
      ruleId: 'FW-RULE-DROP-01',
      severity: 'low',
      category: 'Initial Access',
      mitreTechnique: 'T1046 - Network Service Discovery',
      mitreTactic: 'Reconnaissance',
      action: 'Blocked',
      message: 'Firewall dropped unsolicited inbound TCP SYN probe on WAN interface port 3389 (RDP)',
      sourceIp: '203.0.113.50',
      destinationIp: '192.168.1.1',
      host: 'gateway-fw-01',
      user: 'PACKET_FILTER',
      details: {
        process: 'pf-kernel',
        protocol: 'TCP',
        port: 3389,
        rawPayloadSnippet: 'filterlog: 4,,,1000000103,igb0,match,block,in,4,0x0,,128,0,0,DF,6,tcp,60,203.0.113.50,192.168.1.1,54122,3389,0,S,12345678,,65535,,mss;nop;wscale;sackOK;TS',
      },
    },
    {
      ruleName: 'pfSense Firewall: Outbound High-Port Direct Connection Allowed',
      ruleId: 'FW-RULE-ALLOW-02',
      severity: 'medium',
      category: 'Command and Control',
      mitreTechnique: 'T1571 - Non-Standard Port',
      mitreTactic: 'Command and Control',
      action: 'Logged',
      message: 'Firewall state created: Outbound TCP session to non-standard destination port 4444',
      sourceIp: '192.168.1.145',
      destinationIp: '198.51.100.88',
      host: 'gateway-fw-01',
      user: 'PF_STATE',
      details: {
        process: 'pf-kernel',
        protocol: 'TCP',
        port: 4444,
        rawPayloadSnippet: 'filterlog: pass out on igb1 to 198.51.100.88:4444 flags [S] seq 349182',
      },
    },
  ],
  waf: [
    {
      ruleName: 'Cloudflare WAF: OWASP SQL Injection (SQLi) Attempt Blocked',
      ruleId: 'WAF-RULE-SQLI-01',
      severity: 'high',
      category: 'Initial Access',
      mitreTechnique: 'T1190 - Exploit Public-Facing Application',
      mitreTactic: 'Initial Access',
      action: 'Blocked',
      message: 'WAF matched SQL injection signature: union select payload in URI query parameter',
      sourceIp: '198.51.100.5',
      destinationIp: '192.168.1.20',
      host: 'waf-edge-01',
      user: 'ANONYMOUS_CLIENT',
      details: {
        process: 'waf-worker',
        protocol: 'HTTPS',
        port: 443,
        commandLine: 'GET /portal/login?user=admin%27%20UNION%20SELECT%20null,password%20FROM%20users--',
        rawPayloadSnippet: 'WAF Logpush: ruleId=100014, ruleMessage="OWASP SQL Injection Attack", clientIP=198.51.100.5, action=block',
      },
    },
    {
      ruleName: 'Cloudflare WAF: Directory Traversal Path Attempt Blocked',
      ruleId: 'WAF-RULE-TRAVERSAL-02',
      severity: 'high',
      category: 'Initial Access',
      mitreTechnique: 'T1190 - Exploit Public-Facing Application',
      mitreTactic: 'Initial Access',
      action: 'Blocked',
      message: 'WAF matched directory traversal pattern: ../../../../etc/passwd in HTTP request URI',
      sourceIp: '203.0.113.112',
      destinationIp: '192.168.1.20',
      host: 'waf-edge-01',
      user: 'ANONYMOUS_CLIENT',
      details: {
        process: 'waf-worker',
        protocol: 'HTTPS',
        port: 443,
        commandLine: 'GET /download?file=../../../../etc/passwd',
        rawPayloadSnippet: 'WAF Logpush: ruleId=100028, ruleMessage="Path Traversal Attempt Detected", clientIP=203.0.113.112, action=block',
      },
    },
  ],
  'aws-cloudtrail': [
    {
      ruleName: 'AWS CloudTrail: Root Account Console Login without MFA',
      ruleId: 'AWS-CT-ROOT-01',
      severity: 'critical',
      category: 'Initial Access',
      mitreTechnique: 'T1078.004 - Cloud Accounts',
      mitreTactic: 'Defense Evasion',
      action: 'Alerted',
      message: 'CloudTrail Event: ConsoleLogin by AWS Root Account without MFA authentication',
      sourceIp: '198.51.100.5',
      destinationIp: '169.254.169.254',
      host: 'aws-console.us-east-1',
      user: 'Root',
      details: {
        process: 'signin.amazonaws.com',
        protocol: 'HTTPS',
        port: 443,
        rawPayloadSnippet: '{"eventVersion":"1.08","userIdentity":{"type":"Root"},"eventName":"ConsoleLogin","additionalEventData":{"MFAUsed":"No"}}',
      },
    },
    {
      ruleName: 'AWS CloudTrail: Security Group Ingress Rule 0.0.0.0/0 Added',
      ruleId: 'AWS-CT-SG-02',
      severity: 'medium',
      category: 'Defense Evasion',
      mitreTechnique: 'T1562.007 - Disable or Modify Cloud Firewalls',
      mitreTactic: 'Defense Evasion',
      action: 'Alerted',
      message: 'CloudTrail Event: AuthorizeSecurityGroupIngress opened port 22 globally (0.0.0.0/0)',
      sourceIp: '198.51.100.5',
      destinationIp: '169.254.169.254',
      host: 'ec2.amazonaws.com',
      user: 'admin-temp',
      details: {
        process: 'ec2.amazonaws.com',
        protocol: 'HTTPS',
        port: 443,
        rawPayloadSnippet: '{"eventName":"AuthorizeSecurityGroupIngress","ipPermissions":{"ipProtocol":"tcp","fromPort":22,"toPort":22,"ipRanges":["0.0.0.0/0"]}}',
      },
    },
  ],
  edr: [
    {
      ruleName: 'EDR Alert: Process Injection via VirtualAllocEx in Explorer.exe',
      ruleId: 'EDR-INJ-001',
      severity: 'critical',
      category: 'Defense Evasion',
      mitreTechnique: 'T1055.001 - Dynamic-link Library Injection',
      mitreTactic: 'Defense Evasion',
      action: 'Quarantined',
      message: 'EDR Sensor detected remote thread memory allocation (PAGE_EXECUTE_READWRITE) inside explorer.exe',
      sourceIp: '192.168.1.145',
      destinationIp: '192.168.1.145',
      host: 'lab-workstation-01',
      user: 'bob.investigator',
      details: {
        process: 'malware_stager.exe',
        commandLine: 'C:\\Users\\Public\\malware_stager.exe --inject',
        rawPayloadSnippet: 'EDR behavioral engine: Process explorer.exe (PID 4912) targeted by unverified binary C:\\Users\\Public\\malware_stager.exe',
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
    },
    {
      ruleName: 'EDR Alert: Ransomware Canary File Renamed on Disk',
      ruleId: 'EDR-RANSOM-002',
      severity: 'critical',
      category: 'Impact',
      mitreTechnique: 'T1486 - Data Encrypted for Impact',
      mitreTactic: 'Impact',
      action: 'Blocked',
      message: 'EDR Canary Trap triggered: Decoy file C:\\Canary\\canary.docx modified and renamed with .locked extension',
      sourceIp: '192.168.1.145',
      destinationIp: '192.168.1.145',
      host: 'lab-workstation-01',
      user: 'SYSTEM',
      details: {
        process: 'vssadmin.exe',
        commandLine: 'vssadmin delete shadows /all /quiet',
        rawPayloadSnippet: 'EDR Ransomware Shield: Rapid encryption activity halted; process terminated and network quarantined',
      },
    },
  ],
};

/**
 * Generates synthetic security events for a specific data source.
 * Fails safely if the data source is disabled or paused.
 */
export function generateSyntheticEvents(
  source: LogDataSource,
  count: number,
  existingEvents: SecurityEvent[] = []
): { events: SecurityEvent[]; rejected: number; error?: string } {
  // Requirement 7: Disabled-source ingestion prevention
  if (!source.enabled) {
    return {
      events: [],
      rejected: count,
      error: `Cannot ingest events: Data source "${source.name}" (${source.id}) is currently disabled. Enable the source first.`,
    };
  }

  // Requirement 8: Paused-source ingestion prevention
  if (source.isPaused) {
    return {
      events: [],
      rejected: count,
      error: `Cannot ingest events: Data source collection for "${source.name}" is currently paused. Resume collection first.`,
    };
  }

  // Input validation
  const safeCount = Math.max(1, Math.min(count, 100));
  const templates = TEMPLATES_BY_TYPE[source.typeId] || TEMPLATES_BY_TYPE['windows-event-log'];
  const generated: SecurityEvent[] = [];

  const baseTimestamp = Date.now();
  const existingIds = new Set(existingEvents.map((e) => e.id));

  for (let i = 0; i < safeCount; i++) {
    const template = templates[i % templates.length];
    // Spread timestamps across the last 15 minutes
    const eventTime = new Date(baseTimestamp - i * 15000).toISOString();
    const eventId = `EVT-GEN-${Date.now().toString(36).toUpperCase()}-${(i + 1).toString().padStart(3, '0')}`;

    // Prevent accidental duplicate event ID
    if (existingIds.has(eventId)) {
      continue;
    }

    const event = normalizeIncomingEvent({
      id: eventId,
      timestamp: eventTime,
      ruleName: template.ruleName,
      ruleId: template.ruleId,
      severity: template.severity,
      sourceSystem: source.name,
      category: template.category,
      mitreTechnique: template.mitreTechnique,
      mitreTactic: template.mitreTactic,
      sourceIp: template.sourceIp,
      destinationIp: template.destinationIp,
      host: source.hostname.split(' ')[0] || template.host,
      action: template.action,
      user: template.user,
      message: template.message,
      dataSourceId: source.id,
      isSimulated: true,
      details: {
        ...template.details,
      },
    });

    generated.push(event);
    existingIds.add(eventId);
  }

  return {
    events: generated,
    rejected: safeCount - generated.length,
  };
}

/**
 * Simulates a local connection check against a data source endpoint.
 * Note: Clearly labelled as a simulated test that does not contact real servers.
 */
export function simulateConnectionCheck(source: LogDataSource): ConnectionCheckRecord {
  const now = new Date().toISOString();
  const testId = `CHK-${Date.now()}`;

  if (!source.enabled) {
    return {
      id: testId,
      timestamp: now,
      result: 'failed',
      latencyMs: 850,
      message: `Connection failed: Data source "${source.name}" is disabled. Collector service is stopped.`,
      simulatedEndpoint: source.hostname,
      details: { status: 'ServiceStopped', reason: 'SourceDisabled' },
    };
  }

  if (source.status === 'Disconnected') {
    return {
      id: testId,
      timestamp: now,
      result: 'failed',
      latencyMs: 1240,
      message: `Connection failed: Simulated endpoint unreachable. Reason: ${source.healthMessage}`,
      simulatedEndpoint: source.hostname,
      details: { status: 'NetworkTimeout', reason: source.healthMessage },
    };
  }

  if (source.status === 'Degraded') {
    return {
      id: testId,
      timestamp: now,
      result: 'warning',
      latencyMs: 320,
      message: `Connection warning: Response received with warnings. Reason: ${source.healthMessage}`,
      simulatedEndpoint: source.hostname,
      details: { status: 'HighLatencyWarning', latencyMs: 320 },
    };
  }

  if (source.status === 'Not Configured') {
    return {
      id: testId,
      timestamp: now,
      result: 'warning',
      latencyMs: 65,
      message: `Connection warning: Sensor endpoint detected but enrollment key is missing.`,
      simulatedEndpoint: source.hostname,
      details: { status: 'UnenrolledAgent' },
    };
  }

  // Healthy
  const latency = Math.floor(Math.random() * 15) + 8; // 8-22 ms
  return {
    id: testId,
    timestamp: now,
    result: 'success',
    latencyMs: latency,
    message: `Connection successful: Simulated endpoint acknowledged heartbeat in ${latency}ms. All buffers synchronized.`,
    simulatedEndpoint: source.hostname,
    details: { status: 'OK', latencyMs: latency, bufferState: 'Synchronized' },
  };
}

/**
 * Calculates high-level metrics across all data sources.
 */
export function calculateDataSourcesMetrics(sources: LogDataSource[]): DataSourcesMetrics {
  let healthySources = 0;
  let degradedSources = 0;
  let disconnectedSources = 0;
  let notConfiguredSources = 0;
  let totalEventsIngested = 0;
  let activeCollectors = 0;
  let pausedCollectors = 0;

  sources.forEach((src) => {
    totalEventsIngested += src.eventsIngested || 0;

    switch (src.status) {
      case 'Healthy':
        healthySources++;
        break;
      case 'Degraded':
        degradedSources++;
        break;
      case 'Disconnected':
        disconnectedSources++;
        break;
      case 'Not Configured':
        notConfiguredSources++;
        break;
    }

    if (src.isPaused) {
      pausedCollectors++;
    } else if (src.enabled && src.status !== 'Disconnected') {
      activeCollectors++;
    }
  });

  return {
    totalSources: sources.length,
    healthySources,
    degradedSources,
    disconnectedSources,
    notConfiguredSources,
    totalEventsIngested,
    activeCollectors,
    pausedCollectors,
  };
}

/**
 * Filters and sorts data sources based on query, health status, type, and collection state.
 */
export function filterAndSortDataSources(
  sources: LogDataSource[],
  filters: Partial<DataSourceFilterState> = {}
): LogDataSource[] {
  const {
    searchQuery = '',
    status = 'all',
    sourceType = 'all',
    enabledState = 'all',
    sortBy = 'name',
  } = filters;

  const query = searchQuery.trim().toLowerCase();

  const filtered = sources.filter((src) => {
    // 1. Status filter
    if (status !== 'all' && src.status !== status) {
      return false;
    }

    // 2. Source Type filter
    if (sourceType !== 'all' && src.sourceType !== sourceType && src.typeId !== sourceType) {
      return false;
    }

    // 3. Enabled / Paused state filter
    if (enabledState === 'enabled' && (!src.enabled || src.isPaused)) {
      return false;
    }
    if (enabledState === 'disabled' && src.enabled) {
      return false;
    }
    if (enabledState === 'paused' && !src.isPaused) {
      return false;
    }

    // 4. Query filter
    if (!query) return true;

    return (
      src.name.toLowerCase().includes(query) ||
      src.id.toLowerCase().includes(query) ||
      src.hostname.toLowerCase().includes(query) ||
      src.sourceType.toLowerCase().includes(query) ||
      src.logFormat.toLowerCase().includes(query) ||
      src.description.toLowerCase().includes(query) ||
      src.healthMessage.toLowerCase().includes(query)
    );
  });

  return filtered.sort((a, b) => {
    switch (sortBy) {
      case 'status': {
        const order: Record<string, number> = {
          Healthy: 1,
          Degraded: 2,
          'Not Configured': 3,
          Disconnected: 4,
        };
        return (order[a.status] || 99) - (order[b.status] || 99);
      }
      case 'events-desc':
        return (b.eventsIngested || 0) - (a.eventsIngested || 0);
      case 'events-asc':
        return (a.eventsIngested || 0) - (b.eventsIngested || 0);
      case 'last-seen': {
        const timeA = new Date(a.lastEventReceived).getTime() || 0;
        const timeB = new Date(b.lastEventReceived).getTime() || 0;
        return timeB - timeA;
      }
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });
}

/**
 * Filters ingestion activity logs.
 */
export function filterIngestionLogs(
  logs: IngestionActivityRecord[],
  query: string = '',
  statusFilter: string = 'all',
  sourceFilter: string = 'all'
): IngestionActivityRecord[] {
  const q = query.trim().toLowerCase();

  return logs.filter((log) => {
    if (statusFilter !== 'all' && log.status !== statusFilter) {
      return false;
    }
    if (sourceFilter !== 'all' && log.sourceId !== sourceFilter) {
      return false;
    }
    if (!q) return true;

    return (
      log.id.toLowerCase().includes(q) ||
      log.sourceName.toLowerCase().includes(q) ||
      log.sourceId.toLowerCase().includes(q) ||
      (log.errorMessage && log.errorMessage.toLowerCase().includes(q))
    );
  });
}

/**
 * Adapter converting LogDataSource to legacy DataSource for Overview dashboard compatibility.
 */
export function toLegacyDataSource(source: LogDataSource): DataSource {
  let legacyStatus: 'connected' | 'degraded' | 'disconnected' = 'connected';
  if (source.status === 'Degraded') legacyStatus = 'degraded';
  else if (source.status === 'Disconnected' || source.status === 'Not Configured' || !source.enabled) {
    legacyStatus = 'disconnected';
  }

  return {
    id: source.id,
    name: source.name,
    type: source.sourceType,
    status: legacyStatus,
    eventsPerSecond: source.eventsPerSecond ?? (source.enabled && !source.isPaused ? 15.0 : 0),
    totalEvents24h: source.eventsIngested || source.totalEvents24h || 0,
    lastSeen: source.lastEventReceived === 'Never' ? 'Never' : 'Active stream',
    hostTarget: source.hostname,
    collectorVersion: source.collectorVersion || 'Simulated Lab Collector v1.0',
  };
}

// ==========================================
// PERSISTENCE UTILITIES
// ==========================================

export function loadStoredSources(fallback: LogDataSource[]): LogDataSource[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_SOURCES_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return fallback;
    }

    // Validate essential properties
    const isValid = parsed.every(
      (item) => item && typeof item.id === 'string' && typeof item.name === 'string' && item.isSimulated
    );

    return isValid ? parsed : fallback;
  } catch (err) {
    console.warn('Failed to load stored data sources, returning fallback:', err);
    return fallback;
  }
}

export function saveStoredSources(sources: LogDataSource[]): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    window.localStorage.setItem(LOCAL_STORAGE_SOURCES_KEY, JSON.stringify(sources));
    return true;
  } catch (err) {
    console.error('Failed to save data sources to localStorage:', err);
    return false;
  }
}

export function resetStoredSources(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(LOCAL_STORAGE_SOURCES_KEY);
    } catch (err) {
      console.error('Failed to reset data sources localStorage:', err);
    }
  }
}

export function loadStoredIngestionLogs(fallback: IngestionActivityRecord[]): IngestionActivityRecord[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_INGESTION_LOGS_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;

    const isValid = parsed.every(
      (item) => item && typeof item.id === 'string' && typeof item.sourceId === 'string'
    );

    return isValid ? parsed : fallback;
  } catch (err) {
    console.warn('Failed to load stored ingestion logs, returning fallback:', err);
    return fallback;
  }
}

export function saveStoredIngestionLogs(logs: IngestionActivityRecord[]): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    window.localStorage.setItem(LOCAL_STORAGE_INGESTION_LOGS_KEY, JSON.stringify(logs));
    return true;
  } catch (err) {
    console.error('Failed to save ingestion logs to localStorage:', err);
    return false;
  }
}

export function resetStoredIngestionLogs(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(LOCAL_STORAGE_INGESTION_LOGS_KEY);
    } catch (err) {
      console.error('Failed to reset ingestion logs localStorage:', err);
    }
  }
}

export function loadStoredEvents(fallback: SecurityEvent[]): SecurityEvent[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_EVENTS_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return fallback;

    const isValid = parsed.every(
      (item) => item && typeof item.id === 'string' && typeof item.ruleName === 'string'
    );

    return isValid ? parsed : fallback;
  } catch (err) {
    console.warn('Failed to load stored events, returning fallback:', err);
    return fallback;
  }
}

export function saveStoredEvents(events: SecurityEvent[]): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    window.localStorage.setItem(LOCAL_STORAGE_EVENTS_KEY, JSON.stringify(events));
    return true;
  } catch (err) {
    console.error('Failed to save events to localStorage:', err);
    return false;
  }
}

export function resetStoredEvents(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(LOCAL_STORAGE_EVENTS_KEY);
    } catch (err) {
      console.error('Failed to reset events localStorage:', err);
    }
  }
}
