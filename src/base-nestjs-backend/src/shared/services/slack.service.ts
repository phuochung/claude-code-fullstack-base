import { Injectable } from '@nestjs/common';
import { WebClient } from '@slack/web-api';

@Injectable()
export class SlackService {
  private readonly client: WebClient;

  constructor() {
    if (process.env.SLACK_APP_TOKEN) {
      this.client = new WebClient(process.env.SLACK_APP_TOKEN);
    }
  }

  async sendMessage(errorId: string, message: string) {
    try {
      if (!this.client) {
        console.warn('SLACK_APP_TOKEN is not defined');
        return '';
      }

      if (!message) {
        return '';
      }
      const CHANNEL_ID = process.env.SLACK_CHANNEL_ID;
      if (!CHANNEL_ID) {
        console.warn('SLACK_CHANNEL_ID is not defined');
        return '';
      }

      await this.client.chat.postMessage({
        channel: CHANNEL_ID,
        // K_SERVICE is set by Cloud Run to the service name; falls back to
        // 'local' off Cloud Run. One Slack channel receives alerts from every
        // service, so without it an alert cannot be traced back to its source.
        text: `[${errorId}] [${process.env.K_SERVICE ?? 'local'}] [${process.env.NODE_ENV}] ${message}`,
        // Alert text can contain attacker-supplied URLs (payloads quote paths
        // and stacks), and an unfurl would fetch and render them into the
        // channel. `link_names` is deliberately never set: it would turn a
        // reported `@channel` into a real ping.
        unfurl_links: false,
        unfurl_media: false,
      });
    } catch (error) {
      console.error('Error sending message to Slack:', error);
    }
  }
}
