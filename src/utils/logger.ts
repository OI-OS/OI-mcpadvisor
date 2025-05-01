/**
 * Logger module for structured logging
 * Provides consistent logging across the application
 */

import winston from 'winston';
import fs from 'fs';
import path from 'path';

// Determine if we're running as the main application or as a dependency
const isMainApplication = process.env.MCP_COMPASS_MAIN === 'true';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports based on mode
const transports = [];

// Only add file logging if explicitly enabled or running as main application
if (isMainApplication || process.env.ENABLE_FILE_LOGGING === 'true') {
  try {
    // Use environment variable if provided, otherwise use default
    const logsDir = process.env.LOGS_DIR || path.join(process.cwd(), 'logs');
    
    // Only try to create directory if we're the main application
    if (isMainApplication && !fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Only add file transports if directory exists
    if (fs.existsSync(logsDir)) {
      transports.push(
        // File transport for errors
        new winston.transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: 'error',
        }),
        // File transport for all logs
        new winston.transports.File({ 
          filename: path.join(logsDir, 'all.log') 
        })
      );
    }
  } catch (error) {
    // Silently fail - no console output
  }
}

// Always add a silent console transport to prevent "no transport" warnings
transports.push(
  new winston.transports.Console({
    silent: true, // This prevents any output
    handleExceptions: false
  })
);

// Create the logger with silent mode when used as a dependency
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  silent: !isMainApplication && process.env.ENABLE_FILE_LOGGING !== 'true', // Silence all logging when used as a dependency
  exitOnError: false // Don't crash on logging errors
});

// Suppress logger errors by adding a no-op error handler
logger.on('error', () => {});

export default logger;
