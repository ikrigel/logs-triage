import chalk from 'chalk';
import { LogEntry } from '../agent/types';

export interface AlertInput {
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedServices: string[];
  issueSummary: string;
  relevantLogs?: LogEntry[];
}

export function alertTeam(input: AlertInput): { success: boolean; message: string } {
  const severityColors: Record<string, any> = {
    low: chalk.blue,
    medium: chalk.yellow,
    high: chalk.redBright,
    critical: chalk.bgRedBright.white,
  };

  const color = severityColors[input.severity] || chalk.white;

  let alertMessage = color(
    `\n${'═'.repeat(80)}\nALERT: ${input.severity.toUpperCase()} SEVERITY ISSUE\n${'═'.repeat(80)}`
  );

  alertMessage += `\n${chalk.bold('Services Affected:')} ${input.affectedServices.join(', ')}`;
  alertMessage += `\n${chalk.bold('Summary:')} ${input.issueSummary}`;

  if (input.relevantLogs && input.relevantLogs.length > 0) {
    alertMessage += `\n${chalk.bold('Sample Logs:')}`;
    input.relevantLogs.slice(0, 3).forEach((log) => {
      alertMessage += `\n  [${log.time}] ${log.service}: ${log.msg}`;
    });
  }

  alertMessage += `\n${chalk.dim('Timestamp:')} ${new Date().toISOString()}`;
  alertMessage += `\n${'═'.repeat(80)}\n`;

  console.log(alertMessage);

  return {
    success: true,
    message: `Alert sent for ${input.severity} severity issue in ${input.affectedServices.join(', ')}`,
  };
}

export function formatAlertForSlack(input: AlertInput): string {
  const severityEmoji: Record<string, string> = {
    low: ':blue_circle:',
    medium: ':yellow_circle:',
    high: ':red_circle:',
    critical: ':rotating_light:',
  };

  const emoji = severityEmoji[input.severity] || ':grey_circle:';

  let message = `${emoji} *${input.severity.toUpperCase()} ALERT*\n`;
  message += `*Services:* ${input.affectedServices.join(', ')}\n`;
  message += `*Issue:* ${input.issueSummary}\n`;
  message += `*Time:* ${new Date().toISOString()}`;

  return message;
}

export function formatAlertForEmail(input: AlertInput): {
  subject: string;
  body: string;
} {
  const subject = `[${input.severity.toUpperCase()}] Production Alert: ${input.affectedServices.join(', ')}`;

  let body = `<h2>Production Alert - ${input.severity.toUpperCase()} Severity</h2>\n`;
  body += `<p><strong>Affected Services:</strong> ${input.affectedServices.join(', ')}</p>\n`;
  body += `<p><strong>Issue Summary:</strong></p>\n`;
  body += `<p>${input.issueSummary}</p>\n`;

  if (input.relevantLogs && input.relevantLogs.length > 0) {
    body += `<h3>Sample Logs</h3>\n<ul>\n`;
    input.relevantLogs.slice(0, 5).forEach((log) => {
      body += `<li>[${log.time}] <strong>${log.service}</strong>: ${log.msg}</li>\n`;
    });
    body += `</ul>\n`;
  }

  body += `<p><small>Alert generated at ${new Date().toISOString()}</small></p>`;

  return { subject, body };
}

export function generateAlertSuggestion(input: AlertInput): string {
  if (input.severity === 'critical') {
    return 'CRITICAL alert detected. Immediate action required. Page on-call engineer and initiate incident response.';
  }

  if (input.severity === 'high') {
    return 'High severity issue detected. Notify team lead and prioritize investigation.';
  }

  if (input.severity === 'medium') {
    return 'Medium severity issue detected. Plan investigation and fix within business hours.';
  }

  return 'Low severity alert. Monitor trend and address during next sprint.';
}
