import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { UserRole } from '@prisma/client';

export interface UpdateUserData {
  name?: string;
  email?: string;
}

export interface InviteUserData {
  email: string;
  role: UserRole;
  name: string;
}

class UserService {
  private readonly SALT_ROUNDS = 12;

  async findByOrganization(organizationId: string) {
    return prisma.user.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async updateUser(id: string, data: UpdateUserData) {
    const updateData: any = {};

    if (data.name) {
      updateData.name = data.name;
    }

    if (data.email) {
      // Check if email is already taken
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email.toLowerCase(),
          NOT: { id },
        },
      });

      if (existingUser) {
        throw new Error('Email is already in use');
      }

      updateData.email = data.email.toLowerCase();
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deactivateUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    });
  }

  async inviteUser(data: InviteUserData, organizationId: string, invitedBy: string) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Generate temporary password
    const tempPassword = this.generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, this.SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name,
        passwordHash,
        role: data.role,
        organizationId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // TODO: Send invitation email with temporary password
    // For now, return the temp password in response (should be removed in production)
    return {
      user,
      tempPassword,
    };
  }

  async changeRole(id: string, newRole: UserRole) {
    // Don't allow changing your own role
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return prisma.user.update({
      where: { id },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

export const userService = new UserService();
