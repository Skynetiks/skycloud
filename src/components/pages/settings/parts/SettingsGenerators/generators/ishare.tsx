import { UploadHeaders } from '@/lib/uploader/parseHeaders';
import { GeneratorOptions, download } from '../GeneratorButton';

export function ishare(token: string, type: 'file' | 'url', options: GeneratorOptions) {
  if (type === 'url') {
    // unsupported in ishare
    return;
  }

  const config = {
    requesturl: `${window.location.origin}/api/upload`,
    name: `SkyCloud - ${window.location.origin} - File`,
    headers: {},
    fileformname: 'file',
    responseurl: '{{files[0].url}}',
  };

  const toAddHeaders: UploadHeaders = {
    authorization: token,
  };

  if (options.deletesAt !== null && type === 'file') {
    toAddHeaders['x-skycloud-deletes-at'] = options.deletesAt;
  } else {
    delete toAddHeaders['x-skycloud-deletes-at'];
  }

  if (options.format !== 'default' && type === 'file') {
    toAddHeaders['x-skycloud-format'] = options.format;
  } else {
    delete toAddHeaders['x-skycloud-format'];
  }

  if (options.imageCompressionPercent !== null && type === 'file') {
    toAddHeaders['x-skycloud-image-compression-percent'] = options.imageCompressionPercent.toString();
  } else {
    delete toAddHeaders['x-skycloud-image-compression-percent'];
  }

  if (options.maxViews !== null) {
    toAddHeaders['x-skycloud-max-views'] = options.maxViews.toString();
  } else {
    delete toAddHeaders['x-skycloud-max-views'];
  }

  if (options.addOriginalName === true && type === 'file') {
    toAddHeaders['x-skycloud-original-name'] = 'true';
  } else {
    delete toAddHeaders['x-skycloud-original-name'];
  }

  if (options.overrides_returnDomain !== null) {
    toAddHeaders['x-skycloud-domain'] = options.overrides_returnDomain;
  } else {
    delete toAddHeaders['x-skycloud-domain'];
  }

  for (const [key, value] of Object.entries(toAddHeaders)) {
    (config as any).headers[key] = value;
  }

  return download(`skycloud-${type}.iscu`, JSON.stringify(config, null, 2));
}
