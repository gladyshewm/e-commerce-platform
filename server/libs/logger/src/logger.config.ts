import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

export const winstonConfig: winston.LoggerOptions = {
  level: 'debug',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike(
          process.env.APP_NAME || 'App',
          {
            colors: true,
            prettyPrint: true,
            processId: true,
            appName: true,
          },
        ),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      level: 'info',
      format: winston.format.combine(
        winston.format((info) => {
          info.service = process.env.APP_NAME || 'App';
          return info;
        })(),
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format((info) => {
          info.service = process.env.APP_NAME || 'App';
          return info;
        })(),
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/debug.log',
      level: 'debug',
      format: winston.format.combine(
        winston.format((info) => {
          info.service = process.env.APP_NAME || 'App';
          return info;
        })(),
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
};
