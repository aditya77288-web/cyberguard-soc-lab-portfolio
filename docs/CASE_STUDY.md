# CyberGuard SOC Lab — Project Case Study

## 1. Project Summary

CyberGuard SOC Lab is an educational Security Operations Center (SOC) dashboard simulation built with React, TypeScript, and Vite. It models common blue-team workflows using synthetic security telemetry and browser-local state.

The project demonstrates how SOC analysts can move from alert triage to investigation, detection review, incident documentation, and response planning in one interface.

> **Scope:** This is a training simulation, not a production SIEM. It does not ingest live organizational telemetry, connect to real security sensors, or execute real containment actions.

## 2. Problem Being Explored

SOC workflows often involve several connected tasks:
- Reviewing and prioritizing security alerts.
- Searching events from different telemetry sources.
- Assessing indicators of compromise (IOCs).
- Evaluating detection logic and mapping detections to adversary techniques.
- Tracking investigations and documenting response decisions.

This project explores how these activities can be represented in one learning environment, while making the relationships between alerts, events, detection rules, techniques, and incidents visible.

## 3. Goals

1. Build an interactive SOC-style interface for learning blue-team workflows.
2. Model a structured alert lifecycle and incident lifecycle.
3. Demonstrate deterministic evaluation of a documented subset of Sigma-like rules.
4. Visualize curated MITRE ATT&CK technique coverage.
5. Preserve analyst-created simulation data locally and support backup and restoration.
6. Make the simulated nature and operational limitations explicit.

## 4. Implemented Workflow

1. **Monitor:** Review dashboard metrics and synthetic event activity.
2. **Triage:** Search alerts, inspect affected assets, assign an analyst, add notes, and change alert status.
3. **Investigate:** Explore related synthetic events and indicators.
4. **Detect:** Enable or disable demonstration detection rules and review resulting findings.
5. **Map:** Inspect curated MITRE ATT&CK techniques and their mapped rules.
6. **Respond:** Track an incident through investigation and simulated response phases.
7. **Document:** Generate a structured incident report from the incident record.
8. **Manage data:** Review simulated sources, run synthetic ingestion batches, and export or restore local data.

## 5. Architecture

The application uses a client-side architecture:
- **UI layer:** React components and module-based navigation.
- **Domain logic:** TypeScript utilities for alert state transitions, event filtering, IOC scoring, rule evaluation, ATT&CK mapping, and report generation.
- **Persistence:** Browser localStorage with namespaced, versioned keys for application records.
- **Build and development:** Vite.
- **Validation:** Automated utility tests, TypeScript type checking, and a production build through the repository's CI workflow.

All telemetry records are synthetic fixtures or locally generated simulation data. Browser-local persistence is not a centralized database and is not shared across users or devices.

## 6. Security and Engineering Considerations

The repository documents several implementation safeguards and constraints:
- Threat indicators are defanged in the interface to reduce accidental navigation.
- CSV export includes mitigation for spreadsheet formula injection prefixes.
- Backup restoration uses schema validation and a preview flow.
- Storage operations are scoped to CyberGuard-specific localStorage namespaces.
- Unsupported detection-rule operators are identified rather than silently treated as supported.
- Simulated response actions are recorded for training and do not execute operating-system or network changes.

These measures are scoped to the educational application; they should not be interpreted as a security certification or production-readiness assessment.

## 7. Testing and Quality Checks

The project README reports 109 passing automated tests. The repository's CI workflow runs:
- Dependency installation using the Bun lockfile.
- Automated tests.
- TypeScript type checking through the lint script.
- A Vite production build.

A passing test suite provides evidence that the tested code paths behave as expected; it does not prove that the application is free of defects or vulnerabilities.

## 8. Current Limitations

- No live endpoint, firewall, cloud, or network telemetry is collected.
- External threat-intelligence feeds are not configured.
- Sigma and MITRE ATT&CK support is a curated educational subset.
- Detection evaluation is deterministic and local, not a full SIEM detection pipeline.
- Containment and eradication playbooks are simulations only.
- Data is stored in the browser and is not a multi-user backend service.

## 9. Possible Future Improvements

- Add a clearly separated, opt-in ingestion adapter for a real lab data source.
- Expand detection-rule test fixtures and document supported rule syntax.
- Add end-to-end browser tests for critical analyst workflows.
- Improve accessibility testing and keyboard navigation coverage.
- Add reproducible deployment instructions and a hosted demonstration, with synthetic data clearly labelled.
- Add threat-model documentation for the application's own attack surface.

## 10. Learning Outcomes Demonstrated

This project brings together frontend engineering and cybersecurity concepts, including alert lifecycle modelling, event analysis, IOC handling, rule-based detection, ATT&CK mapping, incident workflow design, local data validation, and automated testing.

It is best presented as a hands-on SOC workflow simulator that demonstrates applied learning—not as evidence of operating a production SOC or deploying enterprise SIEM infrastructure.