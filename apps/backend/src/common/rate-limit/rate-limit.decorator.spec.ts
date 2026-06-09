import 'reflect-metadata';
import { RATE_LIMIT_POLICIES, RATE_LIMIT_POLICIES_METADATA } from './rate-limit.constants';
import type { RateLimitPolicy } from './rate-limit.types';
import { AuthController } from '../../modules/auth/auth.controller';
import { ChatController } from '../../modules/chat/chat.controller';
import { DiscoveryController } from '../../modules/discovery/discovery.controller';
import { LikesController } from '../../modules/likes/likes.controller';
import { ModerationController } from '../../modules/moderation/moderation.controller';
import { ProfilesController } from '../../modules/profiles/profiles.controller';

describe('rate limit endpoint decorators', () => {
  it('attaches auth policies', () => {
    expect(getPolicy(AuthController.prototype.register)).toEqual(
      RATE_LIMIT_POLICIES.authRegister,
    );
    expect(getPolicy(AuthController.prototype.login)).toEqual(
      RATE_LIMIT_POLICIES.authLogin,
    );
    expect(getPolicy(AuthController.prototype.refresh)).toEqual(
      RATE_LIMIT_POLICIES.authRefresh,
    );
    expect(getPolicy(AuthController.prototype.logout)).toEqual(
      RATE_LIMIT_POLICIES.authLogout,
    );
  });

  it('attaches shared likes policy to LIKE and SKIP', () => {
    expect(getPolicy(LikesController.prototype.likeProfile)).toEqual(
      RATE_LIMIT_POLICIES.likesAction,
    );
    expect(getPolicy(LikesController.prototype.skipProfile)).toEqual(
      RATE_LIMIT_POLICIES.likesAction,
    );
  });

  it('attaches chat, reports, discovery, and profile lookup policies', () => {
    expect(getPolicy(ChatController.prototype.sendMessage)).toEqual(
      RATE_LIMIT_POLICIES.chatSend,
    );
    expect(getPolicy(ModerationController.prototype.reportUser)).toEqual(
      RATE_LIMIT_POLICIES.reportCreate,
    );
    expect(getPolicy(DiscoveryController.prototype.getCards)).toEqual(
      RATE_LIMIT_POLICIES.discoveryCards,
    );
    expect(getPolicy(ProfilesController.prototype.getByHandle)).toEqual(
      RATE_LIMIT_POLICIES.publicProfileLookup,
    );
  });
});

function getPolicy(target: (...args: never[]) => unknown): RateLimitPolicy {
  return Reflect.getMetadata(RATE_LIMIT_POLICIES_METADATA, target);
}
