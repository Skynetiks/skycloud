import { config } from '../config';
import { log } from '../logger';
import { onUpload as discordOnUpload, onShorten as discordOnShorten } from './discord';

const logger = log('webhooks').c('http');

export async function onUpload({ user, file, link }: Parameters<typeof discordOnUpload>[0]) {
  if (!config.httpWebhook.onUpload) return;
  if (!URL.canParse(config.httpWebhook.onUpload)) {
    logger.debug('invalid url for http onUpload');
    return;
  }

  delete (<any>user).oauthProviders;
  delete user.passkeys;
  delete user.token;
  delete user.password;
  delete user.totpSecret;
  delete (<any>file).password;

  const payload = {
    type: 'upload',
    data: {
      user,
      file,
      link,
    },
  };

  try {
    const res = await fetch(config.httpWebhook.onUpload, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        'x-skycloud-webhook': 'true',
        'x-skycloud-webhook-type': 'upload',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      logger.error('webhook failed', { response: text, status: res.status });
    } else {
      logger.info('http upload webhook sent successfully', { status: res.status });
    }
  } catch (e) {
    logger.error('error while sending webhook', { error: (e as TypeError).message });
  }

  return;
}

export async function onShorten({ user, url, link }: Parameters<typeof discordOnShorten>[0]) {
  if (!config.httpWebhook.onShorten) return;
  if (!URL.canParse(config.httpWebhook.onShorten)) {
    logger.debug('invalid url for http onShorten');
    return;
  }

  delete (<any>user).oauthProviders;
  delete user.passkeys;
  delete user.token;
  delete user.password;
  delete user.totpSecret;
  delete (<any>url).password;

  const payload = {
    type: 'shorten',
    data: {
      user,
      url,
      link,
    },
  };
  try {
    const res = await fetch(config.httpWebhook.onShorten, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        'x-skycloud-webhook': 'true',
        'x-skycloud-webhook-type': 'shorten',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      logger.error('webhook failed', { response: text, status: res.status });
    } else {
      logger.info('http shorten webhook sent successfully', { status: res.status });
    }
  } catch (e) {
    logger.error('error while sending webhook', { error: (e as TypeError).message });
  }

  return;
}
