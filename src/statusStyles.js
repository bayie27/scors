// Centralized status-to-style mapping for reservation statuses
export const STATUS_LABELS = {
  1: 'Reserved',
  2: 'Rejected',
  3: 'Pending',
  4: 'Cancelled',
};

export const STATUS_STYLES = {
  1: 'bg-green-100 text-green-800 border-green-200',      // Reserved
  2: 'bg-red-100 text-red-800 border-red-200',         // Rejected
  3: 'bg-yellow-100 text-yellow-800 border-yellow-200',// Pending
  4: 'bg-gray-200 text-gray-700 border-gray-300',      // Cancelled
};

// Helper to get style by either ID or status string
export function getStatusStyle(status) {
  if (typeof status === 'number') return STATUS_STYLES[status] || STATUS_STYLES[3];
  if (typeof status === 'string') {
    const id = Object.entries(STATUS_LABELS).find(([_id, label]) => label.toLowerCase() === status.toLowerCase());
    return id ? STATUS_STYLES[id[0]] : STATUS_STYLES[3];
  }
  return STATUS_STYLES[3];
}

export function getStatusLabel(statusId) {
  return STATUS_LABELS[statusId] || 'Unknown';
}
