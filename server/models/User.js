import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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
      select: false, // Don't return password in queries by default
    },
    role: {
      type: String,
      enum: ['student', 'staff', 'organizer', 'admin'],
      default: 'student',
    },
    university: {
      type: String,
      default: 'University of Colombo',
      trim: true,
    },
    faculty: {
      type: String,
      default: 'Faculty of Computing',
      trim: true,
    },
    department: {
      type: String,
      default: 'Computer Science & Software Engineering',
      trim: true,
    },
    studentId: {
      type: String,
      trim: true,
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
