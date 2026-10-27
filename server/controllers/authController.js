import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import SystemSetting from '../models/SystemSetting.js';
import { logAuditEvent } from '../services/auditService.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'uniconnect_super_secret_jwt_key_2026_campus_intelligence',
    { expiresIn: '30d' }
  );
};

// University registration number validator
// Matches Sri Lankan university formats e.g. TG/2022/1042, EG/2022/0891, AS/2023/0412, MC/2021/0101, AC/2022/0500, IA/2022/0300
export const validateRegistrationNumber = (regNo) => {
  if (!regNo || typeof regNo !== 'string') return false;
  const cleaned = regNo.trim().toUpperCase();
  const pattern = /^[A-Z]{2,4}\/\d{4}\/\d{3,5}$/;
  return pattern.test(cleaned);
};

// @desc    Register a new student account
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      registrationNumber,
      studentId,
      faculty,
      department,
      degreeProgramme,
      academicYear,
      contactNumber,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, university email, and password.',
      });
    }

    const regNo = (registrationNumber || studentId || '').trim().toUpperCase();
    if (!regNo) {
      return res.status(400).json({
        success: false,
        message: 'University registration number is required (e.g. TG/2022/1042, EG/2022/0891).',
      });
    }

    // Check duplicate email
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Check duplicate registration number
    const existingReg = await User.findOne({
      $or: [{ registrationNumber: regNo }, { studentId: regNo }],
    });
    if (existingReg) {
      return res.status(400).json({
        success: false,
        message: `An account with registration number "${regNo}" is already registered.`,
      });
    }

    // Check if verification is required from settings
    const verSetting = await SystemSetting.findOne({ key: 'STUDENT_REGISTRATION_VERIFICATION_REQUIRED' });
    const requireVerification = verSetting ? Boolean(verSetting.value) : true;
    const verificationStatus = requireVerification ? 'pending' : 'verified';

    // Role is strictly locked to STUDENT for public registrations
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'STUDENT',
      university: 'South Eastern University of Sri Lanka',
      faculty: faculty || 'Faculty of Technology',
      department: department || 'Information & Communication Technology',
      degreeProgramme: degreeProgramme || 'Undergraduate Degree Programme',
      academicYear: academicYear || '2022/2023',
      registrationNumber: regNo,
      studentId: regNo,
      contactNumber: contactNumber || '',
      verificationStatus,
    });

    await logAuditEvent({
      action: 'USER_REGISTERED',
      user,
      targetEntity: 'User',
      targetId: user._id,
      details: { role: 'STUDENT', registrationNumber: regNo, verificationStatus },
      ipAddress: req.ip,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        university: user.university,
        faculty: user.faculty,
        department: user.department,
        degreeProgramme: user.degreeProgramme,
        academicYear: user.academicYear,
        registrationNumber: user.registrationNumber,
        studentId: user.studentId,
        verificationStatus: user.verificationStatus,
        avatar: user.avatar,
        bio: user.bio,
      },
      message:
        verificationStatus === 'pending'
          ? 'Registration successful. Your account is pending administrative verification.'
          : 'Registration successful! Welcome to UniConnect SEUSL.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact the campus administrator.',
      });
    }

    await logAuditEvent({
      action: 'USER_LOGIN',
      user,
      targetEntity: 'User',
      targetId: user._id,
      details: { email: user.email, role: user.role },
      ipAddress: req.ip,
    });

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        university: user.university,
        faculty: user.faculty,
        department: user.department,
        degreeProgramme: user.degreeProgramme,
        academicYear: user.academicYear,
        registrationNumber: user.registrationNumber || user.studentId,
        studentId: user.studentId,
        verificationStatus: user.verificationStatus,
        assignedFaculties: user.assignedFaculties,
        assignedHostels: user.assignedHostels,
        assignedServiceUnits: user.assignedServiceUnits,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        university: user.university,
        faculty: user.faculty,
        department: user.department,
        degreeProgramme: user.degreeProgramme,
        academicYear: user.academicYear,
        registrationNumber: user.registrationNumber || user.studentId,
        studentId: user.studentId,
        contactNumber: user.contactNumber,
        verificationStatus: user.verificationStatus,
        assignedFaculties: user.assignedFaculties,
        assignedHostels: user.assignedHostels,
        assignedServiceUnits: user.assignedServiceUnits,
        avatar: user.avatar,
        bio: user.bio,
        interests: user.interests,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update permitted profile fields
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, interests, avatar, contactNumber } = req.body;
    const user = await User.findById(req.user.id);

    if (name) user.name = name.trim();
    if (bio !== undefined) user.bio = bio;
    if (interests) user.interests = interests;
    if (avatar !== undefined) user.avatar = avatar;
    if (contactNumber !== undefined) user.contactNumber = contactNumber;

    // Students cannot arbitrarily edit their faculty or registration number once registered
    if (user.role !== 'STUDENT' && req.body.faculty) {
      user.faculty = req.body.faculty;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        university: user.university,
        faculty: user.faculty,
        department: user.department,
        registrationNumber: user.registrationNumber || user.studentId,
        studentId: user.studentId,
        contactNumber: user.contactNumber,
        verificationStatus: user.verificationStatus,
        avatar: user.avatar,
        bio: user.bio,
        interests: user.interests,
      },
    });
  } catch (error) {
    next(error);
  }
};
