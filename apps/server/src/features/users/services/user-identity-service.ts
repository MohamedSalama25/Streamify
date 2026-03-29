import type { UserIdentity } from "@streamify/shared";

export class UserIdentityService {
  normalize(user: UserIdentity): UserIdentity {
    return {
      userId: user.userId,
      displayName: user.displayName.trim(),
    };
  }
}

