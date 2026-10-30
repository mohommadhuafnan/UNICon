const ANON_NAME = 'Anonymous Student';

const idOf = (v) => (v && typeof v === 'object' ? String(v._id || v.id || '') : String(v || ''));

/**
 * Returns a plain-object copy of a complaint that is safe to show to `viewer`.
 * For anonymous complaints every identity-bearing field is stripped unless the viewer is
 * the reporter themselves. This applies to staff and admins too: anonymity is enforced
 * in the API, not just hidden in the UI.
 */
export const anonymizeComplaint = (complaint, viewer) => {
  if (!complaint) return complaint;
  const obj = typeof complaint.toObject === 'function' ? complaint.toObject() : { ...complaint };
  if (!obj.isAnonymous) return obj;

  const reporterId = idOf(obj.reporter);
  if (viewer && reporterId && idOf(viewer) === reporterId) return obj;

  obj.reporter = { name: ANON_NAME, role: 'STUDENT' };
  obj.studentName = ANON_NAME;
  obj.studentRegistrationNumber = '';
  obj.auditHistory = [];
  if (Array.isArray(obj.statusHistory)) {
    obj.statusHistory = obj.statusHistory.map((h) =>
      reporterId && idOf(h.changedBy) === reporterId
        ? { ...h, changedBy: null, changedByName: ANON_NAME }
        : h
    );
  }
  return obj;
};
