import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const USER_ROLES = [
  'STUDENT',
  'SUPER_ADMIN',
  'UNIVERSITY_ADMIN',
  'FACULTY_OFFICER',
  'HOSTEL_WARDEN',
  'HOSTEL_SUB_WARDEN',
  'MAINTENANCE_OFFICER',
  'LIBRARY_OFFICER',
  'CANTEEN_MANAGER',
  'HEALTH_CENTRE_OFFICER',
  'SECURITY_OFFICER',
  'STUDENT_WELFARE_OFFICER',
  'OTHER_AUTHORIZED_SERVICE_OFFICER',
  // legacy backward-compatibility
  'student',
  'staff',
  'organizer',
  'admin',
];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'STUDENT',
    },
    university: {
      type: String,
      default: 'South Eastern University of Sri Lanka',
      trim: true,
    },
    faculty: {
      type: String,
      default: 'Faculty of Technology',
      trim: true,
    },
    department: {
      type: String,
      default: 'Information & Communication Technology',
      trim: true,
    },
    degreeProgramme: {
      type: String,
      default: 'Bachelor of Information and Communication Technology (Honours)',
      trim: true,
    },
    academicYear: {
      type: String,
      default: '2022/2023',
      trim: true,
    },
    registrationNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    studentId: {
      type: String,
      trim: true,
    },
    contactNumber: {
      type: String,
      trim: true,
      default: '',
    },
    // Organizational scopes assigned to staff / officials
    assignedFaculties: [{
      type: String,
      trim: true,
    }],
    assignedHostels: [{
      type: String,
      trim: true,
    }],
    assignedServiceUnits: [{
      type: String,
      trim: true,
    }],
    assignedFacilities: [{
      type: String,
      trim: true,
    }],
    // Verification workflow for student admissions/accounts
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'verified',
    },
    verificationNote: {
      type: String,
      default: '',
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: 'Student passionate about community and campus technology.',
      maxlength: [300, 'Bio cannot exceed 300 characters'],
    },
    interests: [{
      type: String,
      trim: true,
    }],
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'pending'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Normalize studentId and registrationNumber
userSchema.pre('save', function (next) {
  if (this.registrationNumber && !this.studentId) {
    this.studentId = this.registrationNumber;
  } else if (this.studentId && !this.registrationNumber) {
    this.registrationNumber = this.studentId;
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
