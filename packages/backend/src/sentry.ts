const dsn = process.env.SENTRY_DSN;

if (dsn) {
  try {
    // Dynamic imports to avoid loading native binaries when Sentry is not configured
    const Sentry = require('@sentry/nestjs');
    const { nodeProfilingIntegration } = require('@sentry/profiling-node');

    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      integrations: [Sentry.nestIntegration(), nodeProfilingIntegration()],
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
  } catch (err) {
    console.warn(`Sentry initialization failed: ${err}. Continuing without error tracking.`);
  }
}
