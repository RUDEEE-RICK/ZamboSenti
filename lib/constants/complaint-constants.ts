/**
 * Complaint status options and related constants
 */

export const COMPLAINT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', icon: '⏳' },
  { value: 'processing', label: 'Processing', icon: '🔄' },
  { value: 'solved', label: 'Solved', icon: '✓' },
  { value: 'rejected', label: 'Rejected', icon: '✕' }
] as const;

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-900 border-yellow-200 hover:bg-yellow-100',
  processing: 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100',
  solved: 'bg-green-50 text-green-900 border-green-200 hover:bg-green-100',
  rejected: 'bg-red-50 text-red-900 border-red-200 hover:bg-red-100',
};

export const STATUS_BADGE_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  processing: 'bg-blue-100 text-blue-800 border-blue-300',
  solved: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
};

/**
 * Complaint categories
 */
export const COMPLAINT_CATEGORIES = [
  'Road and Infrastructure',
  'Street Lighting',
  'Waste Management',
  'Water and Drainage',
  'Public Safety',
  'Noise Complaint',
  'Other'
] as const;

export type ComplaintStatus = typeof COMPLAINT_STATUS_OPTIONS[number]['value'];
export type ComplaintCategory = typeof COMPLAINT_CATEGORIES[number];
