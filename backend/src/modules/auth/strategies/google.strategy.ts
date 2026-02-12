import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { OAuthProvider } from '@prisma/client';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID') || 'dummy',
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET') || 'dummy',
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const { name, emails, photos } = profile;

    const user = {
      email: emails[0].value,
      firstName: name.givenName || '',
      lastName: name.familyName || '',
      avatarUrl: photos?.[0]?.value,
      provider: OAuthProvider.GOOGLE,
      providerId: profile.id,
      accessToken,
      refreshToken,
    };

    done(null, user);
  }
}
