import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { OAuthProvider } from '@prisma/client';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('GITHUB_CLIENT_ID') || 'dummy',
      clientSecret: configService.get('GITHUB_CLIENT_SECRET') || 'dummy',
      callbackURL: configService.get('GITHUB_CALLBACK_URL'),
      scope: ['user:email', 'read:user'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user: any) => void,
  ) {
    const { displayName, emails, photos, username } = profile;
    const nameParts = (displayName || username || '').split(' ');

    const user = {
      email: emails?.[0]?.value || `${username}@github.local`,
      firstName: nameParts[0] || username || '',
      lastName: nameParts.slice(1).join(' ') || '',
      avatarUrl: photos?.[0]?.value,
      provider: OAuthProvider.GITHUB,
      providerId: profile.id,
      accessToken,
      refreshToken,
    };

    done(null, user);
  }
}
