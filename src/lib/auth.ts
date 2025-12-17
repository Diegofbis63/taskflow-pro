import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// User schema for validation
export const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

// Login schema for validation
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
  token?: string;
  error?: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare a password with its hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: AuthUser): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Register a new user
 */
export async function registerUser(userData: z.infer<typeof userSchema>): Promise<AuthResponse> {
  try {
    // Validate input
    const validatedData = userSchema.parse(userData);
    
    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);
    
    // Create user in database
    const newUser = await db.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword
      }
    });

    // Generate token
    const token = generateToken({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email
    });

    return {
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      },
      token
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.code === 'P2002') {
      return {
        success: false,
        message: 'Email already exists',
        error: 'DUPLICATE_EMAIL'
      };
    }
    
    return {
      success: false,
      message: 'Registration failed',
      error: 'REGISTRATION_ERROR'
    };
  }
}

/**
 * Login user
 */
export async function loginUser(credentials: z.infer<typeof loginSchema>): Promise<AuthResponse> {
  try {
    // Validate input
    const validatedData = loginSchema.parse(credentials);
    
    // Find user in database
    const user = await db.user.findUnique({
      where: { email: validatedData.email }
    });

    if (!user) {
      return {
        success: false,
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS'
      };
    }

    // Compare password
    const isPasswordValid = await comparePassword(validatedData.password, user.password);
    
    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS'
      };
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email
    });

    return {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    };
  } catch (error: any) {
    console.error('Login error:', error);
    
    return {
      success: false,
      message: 'Login failed',
      error: 'LOGIN_ERROR'
    };
  }
}

// Backward compatibility exports
export { createUser, authenticateUser, verifyAuth } from './auth';