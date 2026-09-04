/**
 * Formats timestamps nicely (e.g., 9:41 AM) using native Intl or Date methods.
 */
export function formatMessageTime(date: Date): string {
  try {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return '';
  }
}

/**
 * Formats date headers (e.g., TODAY, YESTERDAY, 12 AUGUST 2026).
 */
export function formatDateHeader(date: Date): string {
  try {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return 'TODAY';
    }

    if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return 'YESTERDAY';
    }

    return date
      .toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })
      .toUpperCase();
  } catch {
    return '';
  }
}
