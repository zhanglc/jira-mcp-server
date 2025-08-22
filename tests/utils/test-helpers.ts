/**
 * Common test utilities and helpers
 */

import type { Logger } from 'winston';

/**
 * Create a mock logger for testing
 */
export function createMockLogger(): jest.Mocked<Logger> {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    verbose: jest.fn(),
    silly: jest.fn(),
    log: jest.fn(),
    // Add other logger methods as needed
    level: 'info',
    levels: {},
    add: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
    close: jest.fn(),
    query: jest.fn(),
    stream: jest.fn(),
    startTimer: jest.fn(),
    profile: jest.fn(),
    configure: jest.fn(),
    child: jest.fn(),
    isLevelEnabled: jest.fn().mockReturnValue(true),
    isDebugEnabled: jest.fn().mockReturnValue(true),
    isInfoEnabled: jest.fn().mockReturnValue(true),
    isWarnEnabled: jest.fn().mockReturnValue(true),
    isErrorEnabled: jest.fn().mockReturnValue(true),
    format: {},
    transports: [],
    exitOnError: true,
    exceptions: {} as any,
    rejections: {} as any,
    profilers: {},
    defaultMeta: {},
    emitErrs: true,
    readable: true,
    writable: true,
    silent: false,
    write: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    emit: jest.fn(),
    pipe: jest.fn(),
    setMaxListeners: jest.fn(),
    getMaxListeners: jest.fn(),
    listeners: jest.fn(),
    rawListeners: jest.fn(),
    listenerCount: jest.fn(),
    off: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    addListener: jest.fn(),
    prependListener: jest.fn(),
    prependOnceListener: jest.fn(),
    eventNames: jest.fn()
  } as unknown as jest.Mocked<Logger>;
}

/**
 * Create mock Jira server config for testing
 */
export function createMockConfig() {
  return {
    url: 'https://test-jira.company.com',
    personalToken: 'test-token',
    sslVerify: true,
    timeout: 30000
  };
}

/**
 * Sleep utility for tests
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate test timestamp in ISO format
 */
export function generateTestTimestamp(offset: number = 0): string {
  const date = new Date();
  date.setTime(date.getTime() + offset);
  return date.toISOString();
}