import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { HttpAdapterHost } from '@nestjs/core';
import { HeaderResolver, I18nModule, I18nService } from 'nestjs-i18n';
import * as path from 'path';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { LoggerService } from '../services/logger.service';

/**
 * The real translation files, loaded the way the app loads them — the point of
 * these tests is that the *shipped* strings render. A stubbed I18nService would
 * assert nothing about the message a user actually reads.
 */
describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let reply: jest.Mock;
  let logger: { error: jest.Mock; warn: jest.Mock };

  /** Minimal ArgumentsHost: the filter only needs the request and a response. */
  const hostWith = (request: Record<string, unknown> = {}): ArgumentsHost =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ url: '/api/test', method: 'DELETE', ...request }),
        getResponse: () => ({}),
      }),
    }) as unknown as ArgumentsHost;

  /** The body the filter handed to the http adapter. */
  const bodyOf = (): Record<string, unknown> => {
    const [, body] = reply.mock.calls[0] as [unknown, Record<string, unknown>];
    return body;
  };

  beforeEach(async () => {
    reply = jest.fn();
    logger = { error: jest.fn(), warn: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        I18nModule.forRoot({
          fallbackLanguage: 'en',
          loaderOptions: { path: path.join(__dirname, '../../i18n/') },
          // Only to silence the "no resolvers" error log — every message here
          // falls back to en.
          resolvers: [new HeaderResolver(['x-lang'])],
        }),
      ],
      providers: [
        AllExceptionsFilter,
        { provide: HttpAdapterHost, useValue: { httpAdapter: { reply } } },
        { provide: LoggerService, useValue: logger },
      ],
    }).compile();

    filter = new AllExceptionsFilter(
      module.get(I18nService),
      module.get(HttpAdapterHost),
      logger as unknown as LoggerService,
    );
  });

  it('translates a plain message key', () => {
    filter.catch(new BadRequestException('admin.tag.not_found'), hostWith());

    expect(bodyOf()).toMatchObject({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Tag not found',
    });
  });

  /**
   * The delete-in-use guards report a count. This is the whole plumbing:
   * `{ message: key, args }` on the exception → i18n args → a resolved
   * placeholder. If the placeholder syntax ever stops matching nestjs-i18n's,
   * the admin sees a literal "{count}" — which this test is here to catch.
   */
  it('interpolates args into the translated message', () => {
    filter.catch(
      new BadRequestException({
        message: 'admin.category.has_blogs',
        args: { count: 3 },
      }),
      hostWith(),
    );

    const { message } = bodyOf();
    expect(message).toContain('3 posts');
    expect(message).not.toContain('{count}');
  });

  /** `args` is a server-side translation input, not part of the contract. */
  it('does not leak args to the client', () => {
    filter.catch(
      new BadRequestException({
        message: 'admin.tag.in_use_blogs',
        args: { count: 7 },
      }),
      hostWith(),
    );

    expect(bodyOf()).not.toHaveProperty('args');
    expect(bodyOf().message).toContain('7 posts');
  });

  /** ValidationPipe's per-field messages must reach the caller. */
  it('forwards class-validator field messages as errors', () => {
    filter.catch(
      new BadRequestException({
        message: ['name should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      }),
      hostWith(),
    );

    expect(bodyOf().errors).toEqual(['name should not be empty']);
  });

  it('omits errors when the exception carries none', () => {
    filter.catch(new BadRequestException('admin.tag.not_found'), hostWith());

    expect(bodyOf()).not.toHaveProperty('errors');
  });

  /**
   * This filter is also the thing that can hurt us. Two ways — paging Slack for
   * every rate-limited request, and forwarding personal data into a Slack
   * channel.
   */
  describe('rate limiting', () => {
    /** What LoggerService.error was handed, i.e. what heads for Slack. */
    const alerted = () => JSON.stringify(logger.error.mock.calls);
    /** The single string LoggerService.warn was handed. */
    const warnedText = (): string => {
      const [first] = logger.warn.mock.calls as [string][];
      return first?.[0] ?? '';
    };

    it('does not send a Slack alert for a throttled request', () => {
      // Every request a bot makes *past* the limit would otherwise post to
      // Slack, so tripping the brake buries alerts more effectively than
      // evading it.
      for (let i = 0; i < 50; i += 1) {
        filter.catch(new ThrottlerException(), hostWith());
      }

      expect(logger.error).not.toHaveBeenCalled();
    });

    it('still records every throttle event for Cloud Logging', () => {
      filter.catch(new ThrottlerException(), hostWith());

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(warnedText()).toContain('[throttled]');
    });

    it('logs the path without the query string', () => {
      filter.catch(
        new ThrottlerException(),
        hostWith({
          path: '/api/client/blogs',
          url: '/api/client/blogs?phone=0901234567',
        }),
      );

      // Asserted together so the test cannot pass vacuously by warn() simply
      // never being called.
      expect(warnedText()).toContain('/api/client/blogs');
      expect(warnedText()).not.toContain('0901234567');
    });

    it('still answers the caller with 429 and a translated message', () => {
      filter.catch(new ThrottlerException(), hostWith());

      const [, , status] = reply.mock.calls[0] as [unknown, unknown, number];
      expect(status).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(bodyOf().message).toBeTruthy();
    });

    it('keeps personal data out of a 500 alert', () => {
      // A 500 on a customer write puts the whole request body in this payload.
      filter.catch(
        new Error('boom'),
        hostWith({
          body: {
            name: 'John Smith',
            phoneNumber: '0901234567',
            address: '12 Main Street, Springfield',
            email: 'a@example.com',
            note: 'call 0908887777',
          },
        }),
      );

      const payload = alerted();
      expect(payload).not.toContain('0901234567');
      expect(payload).not.toContain('0908887777');
      expect(payload).not.toContain('John Smith');
      expect(payload).not.toContain('12 Main Street');
      expect(payload).not.toContain('a@example.com');
    });

    it('redacts personal data nested inside the body', () => {
      filter.catch(
        new Error('boom'),
        hostWith({
          body: { customer: { name: 'Jane Doe', phoneNumber: '0912000111' } },
        }),
      );

      const payload = alerted();
      expect(payload).not.toContain('Jane Doe');
      expect(payload).not.toContain('0912000111');
    });

    it('keeps the fields that make the alert actionable', () => {
      filter.catch(
        new Error('boom'),
        hostWith({ body: { tagId: 'abc', quantity: 2 } }),
      );

      const payload = alerted();
      expect(payload).toContain('tagId');
      expect(payload).toContain('boom');
    });

    it('redacts credentials in the body and the headers', () => {
      filter.catch(
        new Error('boom'),
        hostWith({
          body: { password: 'hunter2', accessToken: 'secret-token' },
          headers: { authorization: 'Bearer leaked', cookie: 'session=abc' },
        }),
      );

      const payload = alerted();
      expect(payload).not.toContain('hunter2');
      expect(payload).not.toContain('secret-token');
      expect(payload).not.toContain('Bearer leaked');
      expect(payload).not.toContain('session=abc');
    });

    it('still alerts on a genuine 500', () => {
      filter.catch(new Error('boom'), hostWith());
      expect(logger.error).toHaveBeenCalledTimes(1);
    });
  });
});
