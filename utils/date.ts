export function formatDate(dateString: string) {
  if (typeof window === 'undefined') return '';
  return new Date(dateString).toLocaleDateString();
} 