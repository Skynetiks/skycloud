import { fetchToDataURL } from '@/lib/base64';
import { config } from '@/lib/config';
import { encrypt } from '@/lib/crypto';
import Logger from '@/lib/logger';
import enabled from '@/lib/oauth/enabled';
import { googleAuth } from '@/lib/oauth/providerUtil';
import { OAuthQuery, OAuthResponse } from '@/server/plugins/oauth';
import fastifyPlugin from 'fastify-plugin';

async function googleOauth({ code, host, state }: OAuthQuery, logger: Logger): Promise<OAuthResponse> {
  if (!config.features.oauthRegistration)
    return {
      error: 'OAuth registration is disabled.',
      error_code: 403,
    };

  const { google: googleEnabled } = enabled(config);

  if (!googleEnabled)
    return {
      error: 'Google OAuth is not configured.',
      error_code: 401,
    };

  if (!code) {
    const linkState = encrypt('link', config.core.secret);

    return {
      redirect: googleAuth.url(
        config.oauth.google.clientId!,
        `${config.core.returnHttpsUrls ? 'https' : 'http'}://${host}`,
        state === 'link' ? linkState : undefined,
        config.oauth.google.redirectUri ?? undefined,
      ),
    };
  }

  const body = new URLSearchParams({
    client_id: config.oauth.google.clientId!,
    client_secret: config.oauth.google.clientSecret!,
    grant_type: 'authorization_code',
    code,
    redirect_uri:
      config.oauth.google.redirectUri ??
      `${config.core.returnHttpsUrls ? 'https' : 'http'}://${host}/api/auth/oauth/google`,
    access_type: 'offline',
  });

  logger.debug('google oauth request', { body: body.toString() });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    logger.debug('google oauth failed with a non 200 status code', {
      status: res.status,
      text,
    });

    return {
      error: 'Failed to fetch access token',
    };
  }

  const json = await res.json();
  if (!json.access_token) return { error: 'No access token in response' };

  const userJson = await googleAuth.user(json.access_token);
  if (!userJson) return { error: 'Failed to fetch user' };

  logger.debug('user', { userinfo: userJson });

  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    username: userJson.given_name,
    user_id: userJson.id,
    avatar: await fetchToDataURL(userJson.picture),
  };
}

export const PATH = '/api/auth/oauth/google';
export default fastifyPlugin(
  (server, _, done) => {
    server.get(PATH, async (req, res) => {
      return req.oauthHandle(res, 'GOOGLE', googleOauth);
    });

    done();
  },
  { name: PATH },
);
