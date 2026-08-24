import { Injectable } from '@nestjs/common';
import { SlackService } from './slack.service';
import { COMMON_CONSTANTS } from '../constants/constant';
import { safeSlackField } from '../utils/slack-escape.util';

function formatLog(message: string) {
  return `[${new Date().toLocaleString(COMMON_CONSTANTS.LOCALE, { timeZone: COMMON_CONSTANTS.TIMEZONE })}] ${message}`;
}

/**
 * Cap for a Slack-bound exception dump. Generous, because these are our own
 * stack traces and truncating them defeats the point — but not unbounded, since
 * the payload can quote request data.
 */
const SLACK_MESSAGE_MAX = 3000;

@Injectable()
export class LoggerService {
  constructor(private readonly slackService: SlackService) {}

  info(message: string) {
    console.log(message);
  }

  error(error: any, errorId = Date.now().toString()) {
    const message = typeof error === 'string' ? error : JSON.stringify(error);
    const formattedMessage = formatLog(message);

    console.error('\n=======\nError ID: ', errorId);
    console.error(formattedMessage);

    // The console keeps the raw text (Cloud Logging is not a mrkdwn context);
    // only the Slack copy is sanitised. Exception payloads routinely embed
    // request data, so untrusted text can reach this point.
    //
    // `safeSlackField`, not `escapeSlackText`: escaping alone stops
    // `<!channel>` from pinging the workspace but does nothing about personal
    // data. AllExceptionsFilter redacts the fields it can name; this catches a
    // number quoted inside a free-text message, where no key names it.
    //
    // Fire and forget to avoid blocking.
    this.slackService
      .sendMessage(errorId, safeSlackField(formattedMessage, SLACK_MESSAGE_MAX))
      .catch((err) => console.error('Failed to send error to Slack', err));
  }

  warn(message: string) {
    console.warn(message);
  }
}
