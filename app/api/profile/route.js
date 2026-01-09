import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';
import { enforceRateLimit, RateLimitPresets } from '@/lib/rateLimiter';
import { parseJsonOrError, profileUpdateBody } from '@/lib/validation';

// GET - Fetch user profile
export async function GET() {
  try {
    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Rate limit per user for profile reads
    const rl = await enforceRateLimit({ headers: new Map() }, { ...RateLimitPresets.profile, userId: auth.userId });
    if (!rl.allowed) return rl.response;

    await dbConnect();
    
    const user = await User.findById(auth.userId).select('-passwordHash');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update user profile
export async function PUT(request) {
  try {
    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    // Rate limit per user for profile updates
    const rl = await enforceRateLimit(request, { ...RateLimitPresets.profile, userId: auth.userId });
    if (!rl.allowed) return rl.response;

    // Strict validation & sanitization
    const parsed = await parseJsonOrError(request, profileUpdateBody);
    if (!parsed.ok) return parsed.response;
    const { name, email, currentPassword, newPassword } = parsed.data;

    // Validate input
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    await dbConnect();
    
    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: auth.userId } });
      if (existingUser) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
    }

    // Handle password change if requested
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
      }

      // Enhanced password validation
      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
      }

      if (!/(?=.*[a-z])/.test(newPassword)) {
        return NextResponse.json({ error: 'Password must contain at least one lowercase letter' }, { status: 400 });
      }

      if (!/(?=.*[A-Z])/.test(newPassword)) {
        return NextResponse.json({ error: 'Password must contain at least one uppercase letter' }, { status: 400 });
      }

      if (!/(?=.*\d)/.test(newPassword)) {
        return NextResponse.json({ error: 'Password must contain at least one number' }, { status: 400 });
      }

      if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(newPassword)) {
        return NextResponse.json({ error: 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)' }, { status: 400 });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
      
      // Update user with new password
      await User.findByIdAndUpdate(auth.userId, {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: newPasswordHash
      });
    } else {
      // Update user without password change
      await User.findByIdAndUpdate(auth.userId, {
        name: name.trim(),
        email: email.toLowerCase().trim()
      });
    }

    // Fetch updated user data
    const updatedUser = await User.findById(auth.userId).select('-passwordHash');

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        createdAt: updatedUser.createdAt
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}