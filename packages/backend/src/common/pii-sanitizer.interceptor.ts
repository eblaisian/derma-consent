import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

const PII_FIELDS = [
  'encryptedResponses',
  'encrypted_responses',
  'encryptedName',
  'encrypted_name',
  'encryptedDob',
  'encrypted_dob',
  'encryptedEmail',
  'encrypted_email',
  'encryptedSessionKey',
  'encrypted_session_key',
  'encryptedPrivKey',
  'encrypted_priv_key',
  'patientLookupHash',
  'encryptedPatientName',
  'encryptedPatientDob',
  'encryptedPatientEmail',
  'lookupHash',
  'lookup_hash',
];

function sanitizeValue(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeValue);
  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (PII_FIELDS.includes(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeValue(value);
      }
    }
    return sanitized;
  }
  return obj;
}

@Injectable()
export class PiiSanitizerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    return next.handle().pipe(
      tap({
        next: (data) => {
          // Skip logging for raw binary responses (e.g. photo downloads)
          if (Buffer.isBuffer(data) || data instanceof ArrayBuffer) {
            this.logger.log(`${method} ${url} -> [binary ${Buffer.isBuffer(data) ? data.length : 0} bytes]`);
            return;
          }
          try {
            const sanitized = sanitizeValue(data);
            const json = JSON.stringify(sanitized);
            this.logger.log(`${method} ${url} -> ${json?.substring(0, 200) ?? '[empty]'}`);
          } catch {
            this.logger.log(`${method} ${url} -> [non-serializable response]`);
          }
        },
        error: (error) => {
          this.logger.error(`${method} ${url} -> ${error.message}`);
        },
      }),
    );
  }
}
