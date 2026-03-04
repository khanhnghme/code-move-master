import { supabase } from '@/integrations/supabase/client';

interface ErrorLogEntry {
  error_message: string;
  error_type: string;
  error_stack?: string;
  component?: string;
  url?: string;
  user_id?: string;
  metadata?: Record<string, any>;
}

// In-memory dedup: track recent errors to batch by key
const RECENT_ERRORS = new Map<string, { entry: ErrorLogEntry; count: number }>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let isProcessing = false;
let isInitialized = false;

function getErrorKey(entry: ErrorLogEntry): string {
  return `${entry.error_type}::${entry.error_message.slice(0, 200)}`;
}

async function flushErrors() {
  if (isProcessing || RECENT_ERRORS.size === 0) return;
  isProcessing = true;

  const batch = Array.from(RECENT_ERRORS.entries());
  RECENT_ERRORS.clear();

  try {
    for (const [, { entry, count }] of batch) {
      // Try to find existing log with same error_type + message
      const { data: existing } = await (supabase as any)
        .from('system_error_logs')
        .select('id, occurrence_count')
        .eq('error_type', entry.error_type)
        .eq('error_message', entry.error_message.slice(0, 2000))
        .order('created_at', { ascending: false })
        .limit(1);

      if (existing && existing.length > 0) {
        // Update existing: increment count + update timestamp
        await (supabase as any)
          .from('system_error_logs')
          .update({
            occurrence_count: (existing[0].occurrence_count || 1) + count,
            last_occurred_at: new Date().toISOString(),
            error_stack: entry.error_stack || undefined,
            component: entry.component || undefined,
            url: entry.url || undefined,
          })
          .eq('id', existing[0].id);
      } else {
        // Insert new entry
        await (supabase as any)
          .from('system_error_logs')
          .insert({
            error_message: entry.error_message.slice(0, 2000),
            error_type: entry.error_type,
            error_stack: entry.error_stack,
            component: entry.component,
            url: entry.url,
            user_id: entry.user_id,
            metadata: entry.metadata,
            user_agent: navigator.userAgent,
            occurrence_count: count,
            last_occurred_at: new Date().toISOString(),
          });
      }
    }
  } catch (e) {
    console.warn('[ErrorLogger] Failed to flush error logs:', e);
  } finally {
    isProcessing = false;
  }
}

export function logError(entry: ErrorLogEntry) {
  // Prevent logging our own logging errors
  if (entry.error_message?.includes('system_error_logs')) return;

  // Enrich with context
  const enrichedEntry: ErrorLogEntry = {
    ...entry,
    url: entry.url || window.location.href,
    metadata: {
      ...entry.metadata,
      route: window.location.pathname + window.location.search,
      timestamp_local: new Date().toISOString(),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      online: navigator.onLine,
    },
  };

  // Try to get current user id
  try {
    const sessionStr = localStorage.getItem('sb-wsdphdtdmixzvywklnzf-auth-token');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session?.user?.id) {
        enrichedEntry.user_id = session.user.id;
      }
    }
  } catch { /* ignore */ }

  const key = getErrorKey(enrichedEntry);
  const existing = RECENT_ERRORS.get(key);

  if (existing) {
    existing.count++;
    if (enrichedEntry.error_stack) existing.entry.error_stack = enrichedEntry.error_stack;
  } else {
    RECENT_ERRORS.set(key, {
      entry: enrichedEntry,
      count: 1,
    });
  }

  // Debounce flush
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushErrors, 2000);
}

export function initGlobalErrorHandler() {
  if (isInitialized) return;
  isInitialized = true;

  window.addEventListener('error', (event) => {
    logError({
      error_message: event.message || 'Unknown error',
      error_type: 'runtime',
      error_stack: event.error?.stack,
      component: event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : undefined,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason?.message || reason?.toString?.() || 'Unhandled promise rejection';
    if (message.includes('Refresh Token') || message.includes('refresh_token')) return;

    logError({
      error_message: message,
      error_type: 'promise_rejection',
      error_stack: reason?.stack,
    });
  });

  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    originalConsoleError.apply(console, args);

    const message = args.map(a => {
      if (a instanceof Error) return a.message;
      if (typeof a === 'string') return a;
      try { return JSON.stringify(a); } catch { return String(a); }
    }).join(' ');

    if (
      message.includes('system_error_logs') ||
      message.includes('Refresh Token') ||
      message.includes('tailwindcss.com') ||
      message.length < 5
    ) return;

    logError({
      error_message: message.slice(0, 2000),
      error_type: 'console_error',
      error_stack: args.find(a => a instanceof Error)?.stack,
    });
  };
}
