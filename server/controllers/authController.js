import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'uniconnect_super_secret_jwt_key_2026_campus_intelligence',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, university, faculty, department, studentId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and password.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Role safety: default to student unless explicitly allowed
    const validRoles = ['student', 'staff', 'organizer', 'admin'];
    const assignedRole = validRoles.includes(role) ? role : 'student';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: assignedRole,
      university: university || 'University of Colombo',
      faculty: faculty || 'Faculty of Computing',
      department: department || 'Computer Science & Software Engineering',
      studentId: studentId || '',
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
        studentId: user.studentId,
        avatar: user.avatar,
        bio: user.bio,
      },
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
        studentId: user.studentId,
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
        studentId: user.studentId,
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

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, interests, faculty, department, avatar } = req.body;
    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (interests) user.interests = interests;
    if (faculty) user.faculty = faculty;
    if (department) user.department = department;
    if (avatar !== undefined) user.avatar = avatar;

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
        studentId: user.studentId,
        avatar: user.avatar,
        bio: user.bio,
        interests: user.interests,
      },
    });
  } catch (error) {
    next(error);
  }
};
