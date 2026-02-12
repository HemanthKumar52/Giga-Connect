import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto, OAuthUserDto } from './dto';
import { UserRole, OAuthProvider } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        role: dto.role || UserRole.FREELANCER,
        profile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            displayName: `${dto.firstName} ${dto.lastName}`,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { profile: true },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.mfaEnabled) {
      return {
        mfaRequired: true,
        tempToken: this.jwtService.sign(
          { sub: user.id, mfaPending: true },
          { expiresIn: '5m' },
        ),
      };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async validateMfa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA not configured');
    }

    const isValid = authenticator.verify({
      token: code,
      secret: user.mfaSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async setupMfa(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(
      user.email,
      'GigaConnect',
      secret,
    );

    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    return {
      secret,
      qrCode: qrCodeDataUrl,
    };
  }

  async enableMfa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA setup not initiated');
    }

    const isValid = authenticator.verify({
      token: code,
      secret: user.mfaSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    return { message: 'MFA enabled successfully' };
  }

  async disableMfa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.mfaEnabled) {
      throw new BadRequestException('MFA not enabled');
    }

    const isValid = authenticator.verify({
      token: code,
      secret: user.mfaSecret!,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
      },
    });

    return { message: 'MFA disabled successfully' };
  }

  async handleOAuthLogin(oauthUser: OAuthUserDto) {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: oauthUser.email.toLowerCase() },
          {
            oauthAccounts: {
              some: {
                provider: oauthUser.provider,
                providerId: oauthUser.providerId,
              },
            },
          },
        ],
      },
      include: {
        profile: true,
        oauthAccounts: true,
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: oauthUser.email.toLowerCase(),
          emailVerified: true,
          emailVerifiedAt: new Date(),
          role: UserRole.FREELANCER,
          profile: {
            create: {
              firstName: oauthUser.firstName,
              lastName: oauthUser.lastName,
              displayName: `${oauthUser.firstName} ${oauthUser.lastName}`,
              avatarUrl: oauthUser.avatarUrl,
            },
          },
          oauthAccounts: {
            create: {
              provider: oauthUser.provider,
              providerId: oauthUser.providerId,
              accessToken: oauthUser.accessToken,
              refreshToken: oauthUser.refreshToken,
            },
          },
        },
        include: {
          profile: true,
          oauthAccounts: true,
        },
      });
    } else {
      const existingOAuth = user.oauthAccounts.find(
        (acc) => acc.provider === oauthUser.provider,
      );

      if (!existingOAuth) {
        await this.prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: oauthUser.provider,
            providerId: oauthUser.providerId,
            accessToken: oauthUser.accessToken,
            refreshToken: oauthUser.refreshToken,
          },
        });
      } else {
        await this.prisma.oAuthAccount.update({
          where: { id: existingOAuth.id },
          data: {
            accessToken: oauthUser.accessToken,
            refreshToken: oauthUser.refreshToken,
          },
        });
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { profile: true },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken?: string) {
    return { message: 'Logged out successfully' };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user && user.password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        return user;
      }
    }

    return null;
  }

  private async generateTokens(userId: string, email: string, role: UserRole) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, role },
        {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: this.configService.get('JWT_EXPIRATION') || '15m',
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, role },
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { password, mfaSecret, ...sanitized } = user;
    return sanitized;
  }
}
