import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { JWT } from 'next-auth/jwt';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    authorization: {
      params: {
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/youtube.force-ssl',
        prompt: "consent",
        access_type: "offline",
      }
    }
  })],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      // Check if token is expired
      if (token.expiresAt && Date.now() > token.expiresAt * 1000) {
        try {
          const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              refresh_token: token.refreshToken as string,
              grant_type: 'refresh_token',
            }),
          });
          const refreshedTokens = await response.json();
          if (!response.ok) throw refreshedTokens;
          token.accessToken = refreshedTokens.access_token;
          token.expiresAt = Math.floor(Date.now() / 1000 + refreshedTokens.expires_in);
        } catch (error) {
          console.error('Error refreshing token:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  }
});