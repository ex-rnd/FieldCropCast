export type ApiErrorCode = 'QUOTA_EXCEEDED' | 'AUTH_ERROR' | 'UPSTREAM_ERROR' | 'TIMEOUT';

export interface ClassifiedError {
  code: ApiErrorCode;
  error: string;
  detail?: string;
  resetAt?: string;
}

export function classifyUpstreamError(status: number, body: Record<string, unknown>): ClassifiedError {
  const detail = (body?.message ?? body?.error ?? body?.detail ?? '') as string;
  const resetAt = (body?.reset_at ?? body?.resets_at ?? body?.period_end ?? undefined) as string | undefined;

  if (status === 429) {
    return {
      code: 'QUOTA_EXCEEDED',
      error: 'AI quota exhausted for this period.',
      detail,
      resetAt,
    };
  }

  if (status === 401 || status === 403) {
    return {
      code: 'AUTH_ERROR',
      error: 'Service authentication failed. Contact support.',
      detail,
    };
  }

  return {
    code: 'UPSTREAM_ERROR',
    error: 'Weather service is temporarily unavailable.',
    detail,
  };
}

export function timeoutError(): ClassifiedError {
  return {
    code: 'TIMEOUT',
    error: 'Request timed out. Check your connection and try again.',
  };
}
