import enabled from '../oauth/enabled';
import { Config } from './validate';

export type SafeConfig = Omit<
  Config,
  'oauth' | 'datasource' | 'core' | 'discord' | 'httpWebhook' | 'ratelimit' | 'ssl'
> & {
  oauthEnabled: ReturnType<typeof enabled>;
  oauth: {
    bypassLocalLogin: boolean;
    loginOnly: boolean;
  };
  version: string;
};

export function safeConfig(config: Config): SafeConfig {
  const {
    datasource: _d,
    core: _c,
    oauth,
    discord: _di,
    ratelimit: _r,
    httpWebhook: _h,
    ssl: _s,
    ...rest
  } = config;

  (rest as SafeConfig).oauthEnabled = enabled(config);
  (rest as SafeConfig).oauth = {
    bypassLocalLogin: oauth.bypassLocalLogin,
    loginOnly: oauth.loginOnly,
  };

  return rest as SafeConfig;
}
