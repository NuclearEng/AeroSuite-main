# Getting Started with AeroSuite

This guide will help you get up and running with AeroSuite quickly. Follow these steps to set up your account and learn the basics of the platform.

## System Requirements

AeroSuite is a web-based application that works on modern web browsers:

- **Web Browsers**: 
  - Google Chrome 90+
  - Mozilla Firefox 88+
  - Microsoft Edge 90+
  - Apple Safari 14+

- **Screen Resolution**: 
  - Minimum: 1366 x 768
  - Recommended: 1920 x 1080 or higher

- **Internet Connection**: 
  - Broadband connection (1 Mbps or faster)

- **Mobile Devices**: 
  - iOS 14+ or Android 10+
  - Responsive design works on tablets and smartphones

## Accessing AeroSuite

1. Open your web browser
2. Navigate to your organization's AeroSuite URL: `https://[your-company].aerosuite.com`
3. You will be directed to the login page

## First-Time Login

### If You've Received an Invitation Email

1. Check your email for an invitation from AeroSuite
2. Click the "Set Password" link in the email
3. Create a strong password following the displayed requirements:
   - At least 10 characters
   - Combination of uppercase and lowercase letters
   - At least one number
   - At least one special character
4. After setting your password, you will be redirected to the login page

### If Your Account Was Created by an Administrator

1. Your administrator should provide your initial login credentials
2. Use these credentials to log in
3. You will be prompted to change your password on first login
4. Follow the on-screen instructions to set a new password

## Logging In

1. Enter your email address
2. Enter your password
3. Click "Log In"

## Two-Factor Authentication (2FA)

If your organization has enabled two-factor authentication, you'll need to complete this step after entering your credentials:

### Setting Up 2FA (First Time)

1. After logging in, you'll be prompted to set up 2FA
2. Choose your preferred method:
   - **Authenticator App**: Scan the QR code with Google Authenticator, Microsoft Authenticator, or a similar app
   - **SMS Authentication**: Enter your mobile number to receive codes via text message
   - **Email Authentication**: Use your registered email address to receive codes

3. Follow the on-screen instructions to complete setup
4. Store your backup codes in a secure location

### Using 2FA (After Setup)

1. Enter your email and password
2. On the 2FA screen, enter the verification code from your chosen method
3. Click "Verify" to complete login

## The AeroSuite Interface

After logging in, you'll see the main interface with these key elements:

### Navigation

- **Top Navigation Bar**: Contains search function, notifications, and user profile menu
- **Side Navigation**: Provides access to all main modules of the application
- **Breadcrumb Navigation**: Shows your current location in the application hierarchy

### Dashboard

The dashboard is your central hub for:
- Key performance metrics
- Recent activities
- Upcoming tasks and events
- Quick access to common functions

### Customizing Your Dashboard

1. Click the "Customize" button at the top-right of the dashboard
2. Drag and drop widgets to rearrange them
3. Click the "+" button to add new widgets
4. Use the gear icon on any widget to configure or remove it
5. Click "Save Layout" when finished

## Your User Profile

To access and update your profile:

1. Click your user avatar in the top-right corner
2. Select "Profile" from the dropdown menu
3. Here you can:
   - Update your personal information
   - Change your password
   - Configure notification preferences
   - Set interface preferences (theme, language, etc.)

## Automated Multi-Agent QA & Audit System

AeroSuite automatically runs a suite of expert agents on every code update and regularly in production. These agents:
- Check for code quality, security, compliance, and best-in-class UX/UI
- Run real tests, linting, accessibility, and security scans
- Learn from previous results to focus on unresolved issues
- Provide clear, actionable feedback to users and admins

**How to interpret results:**
- Green status: All agents passed, system is healthy
- Warnings: Some agents found issues—review details in the QA/Audit dashboard or ask your admin
- Red status: Critical issues found—immediate attention required

**Where to find results:**
- QA/Audit dashboard in the app
- Developer/admins: see terminal output from orchestrator runs

This system ensures AeroSuite remains secure, reliable, and user-friendly at all times.

## Getting Help

If you need assistance while using AeroSuite:

- **In-App Help**: Click the "?" icon in the top navigation bar
- **Tooltips**: Hover over icons and buttons for helpful tooltips
- **User Manual**: Access the full user manual from the help menu
- **Support**: Contact support through the help menu or at support@aerosuite.example.com

## Next Steps

Now that you're logged in and familiar with the basic interface, here are some recommended next steps:

1. [Explore the Dashboard](./dashboard.md) to understand the available metrics and widgets
2. Learn about [Supplier Management](./features/supplier-management.md) if you work with suppliers
3. Check out [Inspection Management](./features/inspection-management.md) if you conduct inspections
4. Review [User Settings and Preferences](./features/user-settings.md) to personalize your experience

---

*If you encounter any issues during the login process, please contact your system administrator or the AeroSuite support team.* 

## Multi-Agent QA & Audit System

### Summary for the Team

**AeroSuite now features a best-in-class, memory-driven multi-agent QA, audit, and improvement system.**  
This system leverages specialized agents for architecture, security, test automation, QA, DevOps, product logic, UX/UI, compliance, and human psychology. The orchestrator coordinates all agents, prioritizes based on memory (previous failures), and aggregates results for every module and the entire application. All checks are automated and run on every code update, pre-push, and CI/CD event, with persistent memory for adaptive improvement and human-in-the-loop review for unresolved issues.

**Key Benefits:**
- Continuous, automated QA, security, and UX checks
- Adaptive focus on unresolved or high-priority issues
- Best-in-class user experience and psychological engagement
- Results surfaced in dashboards and available for developer/admin review
- Human review triggered for critical or persistent issues

**How to Run:**
```sh
npx ts-node automation/orchestrator.ts --modules=Login,Reports,Settings,Suppliers
```
Agents will run real checks (lint, test, coverage, a11y, security, infra, etc.) for each module and globally, reporting results and persisting findings for adaptive improvement.

### README and Documentation Updates

- **README.md** now includes a summary of the multi-agent system, orchestrator usage, and links to automation details.
- **docs/README.md** and **docs/user-manual/index.md** reference the new system and its benefits.
- **automation/README.md** documents all agent roles, including the new UX/UI and Human Psychology agents, and explains how to interpret orchestrator results.
- **docs/user-manual/getting-started.md** and **docs/user-manual/roles/quality-manager.md** explain how users and quality managers can view, interpret, and act on agent results.

### User Manual Additions

**New Section: Multi-Agent QA & Audit System**
- Explains the purpose, benefits, and operation of the multi-agent system.
- Describes how users can view results, interpret agent findings, and leverage the system for continuous improvement.
- Details on how to interpret green/yellow/red statuses and where to find results (QA/Audit dashboard, orchestrator output).

### Next Steps for the Team

- **Developers/Admins:** Use the orchestrator to run all agents on every code update or PR. Review results and address any flagged issues.
- **Quality Managers:** Monitor the QA/Audit dashboard for agent findings and use them to drive corrective actions.
- **UX/UI and Product Teams:** Collaborate with the new UX/UI and Human Psychology agents to ensure best-in-class user experience and engagement.
- **All Users:** Benefit from a continuously improving, secure, and user-friendly AeroSuite platform.

---

**If you need further quick guides, role-based instructions, or want to expand the user manual with agent-specific workflows, let me know!** 