import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { SlackService } from '../../shared/services/slack.service';
import { GcsService } from '../storage/services/gcs.service';
import { ConfigService } from '@nestjs/config';

export interface CheckResult {
  name: string;
  status: 'success' | 'failed' | 'warning';
  details: string;
  timestamp: string;
  error?: string;
}

export interface ChecklistResponse {
  overall: 'success' | 'failed' | 'warning';
  timestamp: string;
  environment: string;
  checks: CheckResult[];
}

@Injectable()
export class DevService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly slackService: SlackService,
    private readonly gcsService: GcsService,
    private readonly configService: ConfigService,
  ) {}

  async runChecklist(): Promise<ChecklistResponse> {
    const checks: CheckResult[] = [];
    const timestamp = new Date().toISOString();

    // Run all checks in parallel
    const checkResults = await Promise.allSettled([
      this.checkMongoDB(),
      this.checkSlack(),
      this.checkGCS(),
      this.checkEnvironmentVariables(),
    ]);

    // Process results
    checkResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        checks.push(result.value);
      } else {
        checks.push({
          name: 'Unknown Check',
          status: 'failed',
          details: 'Check failed to execute',
          timestamp: new Date().toISOString(),
          error: result.reason?.message || 'Unknown error',
        });
      }
    });

    // Add system info
    checks.push(this.getSystemInfo());

    // Determine overall status
    const hasFailures = checks.some((check) => check.status === 'failed');
    const hasWarnings = checks.some((check) => check.status === 'warning');
    const overall = hasFailures
      ? 'failed'
      : hasWarnings
        ? 'warning'
        : 'success';

    return {
      overall,
      timestamp,
      environment: this.configService.get('NODE_ENV') || 'unknown',
      checks,
    };
  }

  private async checkMongoDB(): Promise<CheckResult> {
    const timestamp = new Date().toISOString();
    try {
      const isConnected = this.connection.readyState === 1;
      const dbName = this.connection.db?.databaseName;

      if (!isConnected) {
        return {
          name: 'MongoDB',
          status: 'failed',
          details: `Connection status: ${this.getReadyStateString(this.connection.readyState)}`,
          timestamp,
          error: 'MongoDB is not connected',
        };
      }

      return {
        name: 'MongoDB',
        status: 'success',
        details: `Connected to database: ${dbName || 'unknown'}`,
        timestamp,
      };
    } catch (error) {
      return {
        name: 'MongoDB',
        status: 'failed',
        details: 'Failed to check MongoDB connection',
        timestamp,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkSlack(): Promise<CheckResult> {
    const timestamp = new Date().toISOString();
    try {
      const slackToken = process.env.SLACK_APP_TOKEN;
      const slackChannel = process.env.SLACK_CHANNEL_ID;

      if (!slackToken) {
        return {
          name: 'Slack',
          status: 'warning',
          details: 'SLACK_APP_TOKEN is not configured',
          timestamp,
        };
      }

      if (!slackChannel) {
        return {
          name: 'Slack',
          status: 'warning',
          details: 'SLACK_CHANNEL_ID is not configured',
          timestamp,
        };
      }

      // Send a test message
      const testId = `checklist-${Date.now()}`;
      await this.slackService.sendMessage(
        testId,
        '✅ Dev checklist test message',
      );

      return {
        name: 'Slack',
        status: 'success',
        details: `Test message sent successfully to channel: ${slackChannel}`,
        timestamp,
      };
    } catch (error) {
      return {
        name: 'Slack',
        status: 'failed',
        details: 'Failed to send test message to Slack',
        timestamp,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkGCS(): Promise<CheckResult> {
    const timestamp = new Date().toISOString();
    try {
      const bucketName = this.configService.get<string>(
        'GCP_STORAGE_BUCKET_NAME',
      );

      if (!bucketName) {
        return {
          name: 'Google Cloud Storage',
          status: 'warning',
          details: 'GCP_STORAGE_BUCKET_NAME is not configured',
          timestamp,
        };
      }

      // Test bucket access by checking if it exists
      const storage = (this.gcsService as any).storage;
      const bucket = storage.bucket(bucketName);
      const [exists] = await bucket.exists();

      if (!exists) {
        return {
          name: 'Google Cloud Storage',
          status: 'failed',
          details: `Bucket "${bucketName}" does not exist`,
          timestamp,
          error: 'Bucket not found',
        };
      }

      // Try to get bucket metadata to verify read access
      const [metadata] = await bucket.getMetadata();

      return {
        name: 'Google Cloud Storage',
        status: 'success',
        details: `Bucket "${bucketName}" is accessible. Location: ${metadata.location || 'unknown'}`,
        timestamp,
      };
    } catch (error) {
      return {
        name: 'Google Cloud Storage',
        status: 'failed',
        details: 'Failed to access Google Cloud Storage',
        timestamp,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private checkEnvironmentVariables(): CheckResult {
    const timestamp = new Date().toISOString();
    const requiredVars = [
      'APP_PORT',
      'NODE_ENV',
      'MONGODB_URI',
      'FRONTEND_URL',
    ];

    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      return {
        name: 'Environment Variables',
        status: 'failed',
        details: `Missing required variables: ${missingVars.join(', ')}`,
        timestamp,
        error: 'Required environment variables are not set',
      };
    }

    const optionalVars = [
      'SLACK_APP_TOKEN',
      'SLACK_CHANNEL_ID',
      'GCP_STORAGE_BUCKET_NAME',
    ];
    const missingOptionalVars = optionalVars.filter(
      (varName) => !process.env[varName],
    );

    if (missingOptionalVars.length > 0) {
      return {
        name: 'Environment Variables',
        status: 'warning',
        details: `All required variables set. Optional variables missing: ${missingOptionalVars.join(', ')}`,
        timestamp,
      };
    }

    return {
      name: 'Environment Variables',
      status: 'success',
      details: 'All required and optional environment variables are set',
      timestamp,
    };
  }

  private getSystemInfo(): CheckResult {
    const timestamp = new Date().toISOString();
    return {
      name: 'System Info',
      status: 'success',
      details: `Node: ${process.version} | Env: ${process.env.NODE_ENV || 'unknown'} | Port: ${process.env.APP_PORT || 'unknown'}`,
      timestamp,
    };
  }

  private getReadyStateString(state: number): string {
    const states: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    return states[state] || 'unknown';
  }
}
