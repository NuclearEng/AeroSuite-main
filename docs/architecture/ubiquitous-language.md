# Ubiquitous Language Definition

## Introduction

This document defines the ubiquitous language for each domain in the AeroSuite application. Ubiquitous language is a common, shared language used by both domain experts and the development team to describe domain concepts and processes. It ensures that everyone has a consistent understanding of the system.

## Supplier Management Domain

| Term | Definition |
|------|------------|
| Supplier | An organization that provides components, materials, or services to the company. |
| Supplier Contact | A person who is the point of contact at a supplier organization. |
| Supplier Qualification | The process and status of verifying a supplier's capability to provide components or services at the required quality level. |
| Qualification Status | The current status of a supplier's qualification (e.g., "qualified", "provisional", "disqualified"). |
| Supplier Performance | Metrics and data about a supplier's quality, delivery, and overall performance. |
| Risk Factor | A specific aspect of a supplier that poses a potential risk (e.g., financial stability, quality issues). |
| Risk Assessment | The process of evaluating potential risks associated with a supplier. |
| Supplier Category | Classification of suppliers based on the type of products or services they provide. |
| Supplier Tier | Classification of suppliers based on their importance to the business (e.g., Tier 1, Tier 2). |
| Audit | A formal evaluation of a supplier's facilities, processes, and quality systems. |

## Customer Management Domain

| Term | Definition |
|------|------------|
| Customer | An organization that purchases products or services from the company. |
| Customer Contact | A person who is the point of contact at a customer organization. |
| Customer Activity | A record of interaction or transaction with a customer. |
| Customer Status | The current status of a customer relationship (e.g., "active", "inactive", "prospect"). |
| Account Manager | The employee responsible for managing the relationship with a specific customer. |
| Service Level Agreement (SLA) | A formal agreement defining the expected service quality for a customer. |
| Customer Segment | Classification of customers based on their industry, size, or other criteria. |
| Customer Feedback | Comments, suggestions, or complaints received from a customer. |
| Customer Journey | The series of interactions a customer has with the company over time. |
| Customer Satisfaction Score | A metric measuring how satisfied a customer is with the company's products or services. |

## Inspection Management Domain

| Term | Definition |
|------|------------|
| Inspection | A formal examination of a component, process, or facility to verify compliance with requirements. |
| Inspection Item | A specific check or verification point within an inspection. |
| Defect | A non-conformance or issue found during an inspection. |
| Defect Severity | Classification of defects based on their impact (e.g., "critical", "major", "minor"). |
| Inspection Schedule | Planned timing and resource allocation for inspections. |
| Inspector | A person qualified to perform inspections. |
| Inspection Type | Classification of inspections based on their purpose (e.g., "incoming", "in-process", "final"). |
| Inspection Report | A formal document summarizing the findings of an inspection. |
| Corrective Action | Action taken to address and resolve a defect or non-conformance. |
| Preventive Action | Action taken to prevent potential defects or issues from occurring. |
| Root Cause Analysis | The process of identifying the underlying cause of a defect or issue. |
| Inspection Attachment | A document, photo, or other file associated with an inspection. |
| Acceptance Criteria | The standards or requirements that must be met for an inspection item to pass. |

## Component Management Domain

| Term | Definition |
|------|------------|
| Component | A discrete part or assembly used in the manufacturing process. |
| Specification | A technical requirement or characteristic of a component. |
| Tolerance | The acceptable deviation from a specified value for a component characteristic. |
| Revision | A version of a component with specific changes from previous versions. |
| Component Status | The current status of a component in its lifecycle (e.g., "active", "obsolete", "development"). |
| Component Category | Classification of components based on their function or type. |
| Component Code | A unique identifier for a component. |
| Bill of Materials (BOM) | A structured list of components required to build a product. |
| Component Relationship | A defined connection between components (e.g., parent-child, assembly-part). |
| Technical Documentation | Drawings, specifications, and other documents describing a component. |
| Component History | The record of changes and events related to a component over time. |
| Effectivity Date | The date when a component revision becomes active or official. |

## User Management Domain

| Term | Definition |
|------|------------|
| User | A person with access to the AeroSuite system. |
| Role | A collection of permissions that can be assigned to users. |
| Permission | A specific action or access right within the system. |
| Authentication | The process of verifying a user's identity. |
| Authorization | The process of determining what actions a user is allowed to perform. |
| User Profile | Personal and professional information about a user. |
| Session | A period of user interaction with the system. |
| Two-Factor Authentication | An additional security layer requiring two forms of identification. |
| Password Policy | Rules governing password complexity and expiration. |
| User Status | The current status of a user account (e.g., "active", "inactive", "locked"). |

## Notification Domain

| Term | Definition |
|------|------------|
| Notification | A message informing users about events or required actions. |
| Notification Type | Classification of notifications based on their purpose or source. |
| Notification Channel | The method used to deliver notifications (e.g., email, in-app, SMS). |
| Notification Template | A predefined format and content structure for notifications. |
| Notification Preference | User-specific settings for receiving notifications. |
| Notification Status | The current status of a notification (e.g., "sent", "delivered", "read"). |
| Alert | An urgent notification requiring immediate attention. |
| Digest | A collection of multiple notifications sent together. |
| Notification Rule | Logic determining when and to whom notifications are sent. |

## Reporting Domain

| Term | Definition |
|------|------------|
| Report | A structured presentation of data for analysis or decision-making. |
| Report Template | A predefined format and structure for reports. |
| Dashboard | A visual display of key metrics and indicators. |
| Metric | A specific measurement or calculation used in reports. |
| Data Visualization | Graphical representation of data (e.g., charts, graphs). |
| Report Schedule | The timing for automatic generation and distribution of reports. |
| Report Parameter | A variable input that affects the content or scope of a report. |
| Export Format | The file format used when exporting reports (e.g., PDF, Excel). |
| Data Source | The origin of data used in a report. |
| Aggregation | The process of combining multiple data points into summary information. |
| Drill-Down | The ability to navigate from summary data to more detailed information. |
| Filter | A condition used to limit the data included in a report. |

## Cross-Domain Terms

| Term | Definition | Primary Domain |
|------|------------|---------------|
| Quality | Conformance to requirements and fitness for use. | Shared |
| Compliance | Adherence to internal or external standards and regulations. | Shared |
| Traceability | The ability to track the history and location of an item throughout its lifecycle. | Shared |
| Workflow | A defined sequence of steps or activities to complete a process. | Shared |
| Approval | Formal confirmation that something meets requirements or standards. | Shared |
| Status | The current state of an entity in its lifecycle. | Shared |
| Audit Trail | A chronological record of activities and changes. | Shared |

## Language Evolution Process

The ubiquitous language is not static and will evolve as the business and system evolve. To manage this evolution:

1. **Documentation**: This document should be maintained as the authoritative source of the ubiquitous language.

2. **Review Process**: Regular reviews should be conducted to ensure the language remains accurate and relevant.

3. **Change Management**: Changes to the language should be discussed and agreed upon by both domain experts and the development team.

4. **Communication**: Changes to the language should be communicated to all stakeholders.

5. **Code Alignment**: The codebase should be updated to reflect changes in the ubiquitous language.

## Usage Guidelines

1. Use the defined terms consistently in all communications, documentation, and code.

2. When new concepts emerge, define them clearly and add them to this document.

3. Avoid using technical jargon when communicating with domain experts.

4. Ensure that code entities (classes, methods, variables) reflect the ubiquitous language.

5. When terms have different meanings in different domains, be explicit about which domain's definition is being used. 
