import AuditLog from '../models/AuditLog.js';

export const logAuditEvent = async ({
  action,
  user,
  targetEntity = '',
  targetId = '',
  details = {},
  ipAddress = '',
}) => {
  try {
    await AuditLog.create({
      action,
      userId: user?._id || null,
      userName: user?.name || 'System',
      userRole: user?.role || 'SYSTEM',
      targetEntity,
      targetId: String(targetId || ''),
      details,
      ipAddress,
    });
  } catch (err) {
    console.error('[Audit Log Error]', err.message);
  }
};
