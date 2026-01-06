import winston from 'winston';
import path from 'path';

const logDir = 'logs';

// Create logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'pbx-dashboard' },
    transports: [
        // Write all logs with level 'error' and below to error.log
        new winston.transports.File({ 
            filename: path.join(logDir, 'error.log'), 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Write all logs with level 'info' and below to combined.log
        new winston.transports.File({ 
            filename: path.join(logDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
    ],
});

// If we're not in production, log to the console with a simple format
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Security event logging
export function logSecurityEvent(event, details = {}) {
    logger.warn('SECURITY_EVENT', {
        event,
        ...details,
        timestamp: new Date().toISOString(),
        ip: details.ip || 'unknown'
    });
}

// API access logging
export function logAPIAccess(req, res, responseTime) {
    logger.info('API_ACCESS', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
    });
}

// PBX operation logging
export function logPBXOperation(operation, pbxName, details = {}) {
    logger.info('PBX_OPERATION', {
        operation,
        pbxName,
        ...details,
        timestamp: new Date().toISOString()
    });
}

export default logger;