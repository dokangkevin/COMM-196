/**
 * Authentication seam for Phase 2. The browser demo does not import this file.
 * Replace DevelopmentCurrentUserProvider with an Auth0-backed implementation.
 */
export interface CurrentUser {
  id: string;
  externalAuthId: string | null;
  displayName: string;
  studentProfileId: string | null;
}

export interface CurrentUserProvider {
  getCurrentUser(): Promise<CurrentUser | null>;
}

export class DevelopmentCurrentUserProvider implements CurrentUserProvider {
  constructor(private readonly selectedPersonaId: string) {}

  async getCurrentUser(): Promise<CurrentUser> {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Development personas are disabled in production.");
    }
    return {
      id: this.selectedPersonaId,
      externalAuthId: null,
      displayName: this.selectedPersonaId,
      studentProfileId: this.selectedPersonaId,
    };
  }
}
