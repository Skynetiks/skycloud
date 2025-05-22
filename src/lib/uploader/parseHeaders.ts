import ms from 'ms';
import { Config } from '../config/validate';

// from ms@3.0.0-canary.1
type Unit =
  | 'Years'
  | 'Year'
  | 'Yrs'
  | 'Yr'
  | 'Y'
  | 'Weeks'
  | 'Week'
  | 'W'
  | 'Days'
  | 'Day'
  | 'D'
  | 'Hours'
  | 'Hour'
  | 'Hrs'
  | 'Hr'
  | 'H'
  | 'Minutes'
  | 'Minute'
  | 'Mins'
  | 'Min'
  | 'M'
  | 'Seconds'
  | 'Second'
  | 'Secs'
  | 'Sec'
  | 's'
  | 'Milliseconds'
  | 'Millisecond'
  | 'Msecs'
  | 'Msec'
  | 'Ms';
type UnitAnyCase = Unit | Uppercase<Unit> | Lowercase<Unit>;
type StringValue = `${number}` | `${number}${UnitAnyCase}` | `${number} ${UnitAnyCase}`;

type StringBoolean = 'true' | 'false';

export type UploadHeaders = {
  'x-skycloud-deletes-at'?: string;
  'x-skycloud-format'?: Config['files']['defaultFormat'];
  'x-skycloud-image-compression-percent'?: string;
  'x-skycloud-password'?: string;
  'x-skycloud-max-views'?: string;
  'x-skycloud-no-json'?: StringBoolean;
  'x-skycloud-original-name'?: StringBoolean;

  'x-skycloud-folder'?: string;

  'x-skycloud-filename'?: string;
  'x-skycloud-domain'?: string;
  'x-skycloud-file-extension'?: string;

  'content-range'?: string;
  'x-skycloud-p-filename'?: string;
  'x-skycloud-p-content-type'?: string;
  'x-skycloud-p-identifier'?: string;
  'x-skycloud-p-lastchunk'?: StringBoolean;
  'x-skycloud-p-content-length'?: string;

  authorization?: string;
};

export type UploadOptions = {
  deletesAt?: Date;
  format?: Config['files']['defaultFormat'];
  imageCompressionPercent?: number;
  password?: string;
  maxViews?: number;
  noJson?: boolean;
  addOriginalName?: boolean;
  overrides?: {
    filename?: string;
    returnDomain?: string;
    extension?: string;
  };

  folder?: string;

  // error
  header?: string;
  message?: string;

  // partials
  partial?: {
    filename: string;
    contentType: string;
    identifier: string;
    lastchunk: boolean;
    range: [number, number, number]; // start, end, total
    contentLength: number;
  };
};

export function humanTime(string: StringValue | string): Date | null {
  try {
    const mil = ms(string as StringValue);
    if (typeof mil !== 'number') return null;
    if (isNaN(mil)) return null;
    if (!mil) return null;

    return new Date(Date.now() + mil);
  } catch {
    return null;
  }
}

export function parseExpiry(header: string): Date | null {
  if (!header) return null;
  header = header.toLowerCase();

  if (header.startsWith('date=')) {
    const date = new Date(header.substring(5));

    if (!date.getTime()) return null;
    if (date.getTime() < Date.now()) return null;
    return date;
  }

  const human = humanTime(header);

  if (!human) return null;
  if (human.getTime() < Date.now()) return null;

  return human;
}

function headerError(header: keyof UploadHeaders, message: string) {
  return {
    header,
    message,
  };
}

const FORMATS = ['random', 'uuid', 'date', 'name', 'gfycat', 'random-words'];

export function parseHeaders(headers: UploadHeaders, fileConfig: Config['files']): UploadOptions {
  const response: UploadOptions = {};

  if (headers['x-skycloud-deletes-at']) {
    const expiresAt = parseExpiry(headers['x-skycloud-deletes-at']);
    if (!expiresAt) return headerError('x-skycloud-deletes-at', 'Invalid expiry date');

    response.deletesAt = expiresAt;
  } else {
    if (fileConfig.defaultExpiration) {
      const expiresAt = new Date(Date.now() + ms(fileConfig.defaultExpiration as StringValue));
      response.deletesAt = expiresAt;
    }
  }

  const format = headers['x-skycloud-format'];
  if (format) {
    if (!FORMATS.includes(format)) return headerError('x-skycloud-format', 'Invalid format');

    response.format = format;
  } else {
    response.format = fileConfig.defaultFormat;
  }

  const imageCompressionPercent = headers['x-skycloud-image-compression-percent'];
  if (imageCompressionPercent) {
    const num = Number(imageCompressionPercent);
    if (isNaN(num))
      return headerError('x-skycloud-image-compression-percent', 'Invalid compression percent (NaN)');

    if (num < 0 || num > 100)
      return headerError(
        'x-skycloud-image-compression-percent',
        'Invalid compression percent (must be between 0 and 100)',
      );

    response.imageCompressionPercent = num;
  }

  const password = headers['x-skycloud-password'];
  if (password) response.password = password;

  const maxViews = headers['x-skycloud-max-views'];
  if (maxViews) {
    const num = Number(maxViews);
    if (isNaN(num)) return headerError('x-skycloud-max-views', 'Invalid max views (NaN)');

    response.maxViews = num;
  }

  const noJson = headers['x-skycloud-no-json'];
  if (noJson) response.noJson = noJson === 'true';

  const addOriginalName = headers['x-skycloud-original-name'];
  if (addOriginalName) response.addOriginalName = addOriginalName === 'true';

  const folder = headers['x-skycloud-folder'];
  if (folder) response.folder = folder;

  response.overrides = {};

  const filename = headers['x-skycloud-filename'];
  if (filename) response.overrides.filename = filename;

  const extension = headers['x-skycloud-file-extension'];
  if (extension) {
    if (!extension.startsWith('.')) response.overrides.extension = `.${extension}`;
    else response.overrides.extension = extension;
  }

  const returnDomain = headers['x-skycloud-domain'];
  if (returnDomain) {
    const domainArray = returnDomain.split(',');
    response.overrides.returnDomain = domainArray[Math.floor(Math.random() * domainArray.length)].trim();
  }

  if (headers['content-range']) {
    const [start, end, total] = headers['content-range']
      .replace('bytes ', '')
      .replace('-', '/')
      .split('/')
      .map((x) => Number(x));

    if (isNaN(start) || isNaN(end) || isNaN(total))
      return headerError('content-range', 'Invalid content-range');

    response.partial = {
      filename: headers['x-skycloud-p-filename']!,
      contentType: headers['x-skycloud-p-content-type']!,
      identifier: headers['x-skycloud-p-identifier']!,
      lastchunk: headers['x-skycloud-p-lastchunk'] === 'true',
      range: [start, end, total],
      contentLength: Number(headers['x-skycloud-p-content-length']!),
    };
  }

  return response;
}
