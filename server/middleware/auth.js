import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Normalize role for comparison
export const normalizeRole = (role) => {
  if (!role) return 'STUDENT';
  const upper = role.toUpperCase();
  if (upper === 'ADMIN') return 'SUPER_ADMIN';
  if (upper === 'STAFF') return 'FACULTY_OFFICER';
  if (upper === 'ORGANIZER') return 'STUDENT';
  return upper;
};

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please log in to continue.',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'uniconnect_super_secret_jwt_key_2026_campus_intelligence'
    );

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact campus administration.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please log in again.',
    });
  }
};

// Authorize specific roles
export const authorize = (...roles) => {
  const normalizedAllowedRoles = roles.map((r) => normalizeRole(r));

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const userRole = normalizeRole(req.user.role);

    // Super Admin always has full access
    if (userRole === 'SUPER_ADMIN') {
      return next();
    }

    // University Admin has access to any staff/admin role requirements
    if (userRole === 'UNIVERSITY_ADMIN' && !normalizedAllowedRoles.includes('SUPER_ADMIN_ONLY')) {
      return next();
    }

    if (!normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user.role}' is not authorized to access this resource. Required: ${roles.join(', ')}`,
      });
    }

    next();
  };
};

// Verify organizational scope for staff
export const checkOrganizationalScope = (user, complaint) => {
  const role = normalizeRole(user.role);

  // Super and University Admin have campus-wide scope
  if (role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN') {
    return true;
  }

  // Student can only access their own complaint
  if (role === 'STUDENT') {
    return complaint.reporter?.toString() === user._id.toString();
  }

  // Faculty Officer scope check
  if (role === 'FACULTY_OFFICER') {
    if (!user.assignedFaculties || user.assignedFaculties.length === 0) {
      return true; // Unrestricted if not scoped
    }
    return user.assignedFaculties.includes(complaint.faculty) ||
      user.assignedFaculties.includes(complaint.locationDetails?.facultyName);
  }

  // Hostel Warden & Sub-Warden scope check
  if (role === 'HOSTEL_WARDEN' || role === 'HOSTEL_SUB_WARDEN') {
    if (complaint.category !== 'HOSTEL_ACCOMMODATION' && complaint.category !== 'Hostel and Accommodation') {
      return false;
    }
    if (!user.assignedHostels || user.assignedHostels.length === 0) {
      return true;
    }
    const targetHostel = complaint.locationDetails?.hostelName || complaint.location;
    return user.assignedHostels.some((h) => targetHostel.toLowerCase().includes(h.toLowerCase()));
  }

  // Maintenance Officer scope check
  if (role === 'MAINTENANCE_OFFICER') {
    const unit = complaint.routingDecision?.assignedUnit || '';
    return unit.toLowerCase().includes('maintenance') || complaint.category === 'CAMPUS_MAINTENANCE';
  }

  // Library Officer scope check
  if (role === 'LIBRARY_OFFICER') {
    return complaint.category === 'LIBRARY' || (complaint.routingDecision?.assignedUnit || '').includes('Library');
  }

  // Canteen Manager scope check
  if (role === 'CANTEEN_MANAGER') {
    return complaint.category === 'CANTEEN_FOOD' || (complaint.routingDecision?.assignedUnit || '').includes('Cafeteria');
  }

  // Health Centre Officer scope check
  if (role === 'HEALTH_CENTRE_OFFICER') {
    return (complaint.routingDecision?.assignedUnit || '').includes('Health');
  }

  // Security Officer scope check
  if (role === 'SECURITY_OFFICER') {
    return (complaint.routingDecision?.assignedUnit || '').includes('Security');
  }

  // Student Welfare Officer scope check
  if (role === 'STUDENT_WELFARE_OFFICER') {
    return (complaint.routingDecision?.assignedUnit || '').includes('Welfare') || complaint.category === 'OTHER_SERVICES';
  }

  return true;
};

// Optional auth - doesn't fail if token missing, but attaches req.user if valid
export const optionalAuth = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'uniconnect_super_secret_jwt_key_2026_campus_intelligence'
    );
    req.user = await User.findById(decoded.id).select('-password');
  } catch (err) {
    req.user = null;
  }
  next();
};
