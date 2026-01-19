/**
 * Structured Logging System
 * 
 * Provides consistent, structured logging across the application.
 * Logs are sent to console in development and can be integrated with
 * external services (Vercel Logs, Sentry, etc.) in production.
 */

import { isProduction } from './env';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

class Logger {
  private formatLog(entry: LogEntry): string {
    if (isProduction()) {
      // Production: JSON format for log aggregation
      return JSON.stringify(entry);
    } else {
      // Development: Human-readable format
      const emoji = {
        debug: '🐛',
        info: 'ℹ️ ',
        warn: '⚠️ ',
        error: '❌',
      }[entry.level];
      
      let output = `${emoji} [${entry.level.toUpperCase()}] ${entry.message}`;
      
      if (entry.context && Object.keys(entry.context).length > 0) {
        output += `\n   Context: ${JSON.stringify(entry.context, null, 2)}`;
      }
      
      if (entry.error) {
        output += `\n   Error: ${entry.error.message}`;
        if (entry.error.stack) {
          output += `\n   Stack: ${entry.error.stack}`;
        }
      }
      
      return output;
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    }

    const formatted = this.formatLog(entry);

    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }

    // In production, send to external logging service
    if (isProduction()) {
      this.sendToExternalService(entry).catch(() => {
        // Fail silently - don't break the app if logging fails
      });
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // TODO: Integrate with external logging service (Sentry, Datadog, etc.)
    // For now, this is a no-op
    // Example:
    // if (entry.level === 'error' && entry.error) {
    //   Sentry.captureException(entry.error, { extra: entry.context });
    // }
  }

  /**
   * Debug level - development info
   */
  debug(message: string, context?: LogContext): void {
    if (!isProduction()) {
      this.log('debug', message, context);
    }
  }

  /**
   * Info level - general information
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Warning level - something unexpected but handled
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Error level - something failed
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error);
  }

  /**
   * Log API call
   */
  apiCall(service: string, endpoint: string, duration: number, success: boolean, context?: LogContext): void {
    this.info(`API Call: ${service}`, {
      service,
      endpoint,
      duration,
      success,
      ...context,
    });
  }

  /**
   * Log user action
   */
  userAction(action: string, userId?: string, context?: LogContext): void {
    this.info(`User Action: ${action}`, {
      action,
      userId,
      ...context,
    });
  }

  /**
   * Log database query
   */
  dbQuery(table: string, operation: string, duration: number, context?: LogContext): void {
    this.debug(`DB Query: ${operation} on ${table}`, {
      table,
      operation,
      duration,
      ...context,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export helper for measuring execution time
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger.debug(`${name} completed`, { duration, ...context });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`${name} failed`, error as Error, { duration, ...context });
    throw error;
  }
}

// Export helper for measuring sync operations
export function measureSync<T>(
  name: string,
  fn: () => T,
  context?: LogContext
): T {
  const start = Date.now();
  try {
    const result = fn();
    const duration = Date.now() - start;
    logger.debug(`${name} completed`, { duration, ...context });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`${name} failed`, error as Error, { duration, ...context });
    throw error;
  }
}
