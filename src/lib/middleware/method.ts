import { NextApiReq, NextApiRes } from '../response';
import { Handler } from './combine';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';

export function method(allowedMethods: HttpMethod[] = []) {
  return (handler: Handler) => {
    return async (req: NextApiReq, res: NextApiRes) => {
      allowedMethods.push('OPTIONS');

      if (!allowedMethods.includes(req.method as HttpMethod)) {
        res.setHeader('Allow', allowedMethods.join(', '));
        return res.methodNotAllowed();
      }

      return handler(req, res);
    };
  };
}
