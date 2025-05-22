import { UploadHeaders } from '@/lib/uploader/parseHeaders';
import { GeneratorOptions, download } from '../GeneratorButton';

export function sharex(token: string, type: 'file' | 'url', options: GeneratorOptions) {
  const config = {
    Version: '17.0.0',
    Name: `SkyCloud - ${window.location.origin} - ${type === 'file' ? 'File' : 'URL'}`,
    DestinationType: 'ImageUploader, TextUploader, FileUploader',
    RequestMethod: 'POST',
    RequestURL: `${window.location.origin}/api/upload`,
    Headers: {},
    URL: options.sharex_xshareCompatibility ? '$json:files[0].url$' : '{json:files[0].url}',
    Body: 'MultipartFormData',
    FileFormName: 'file',
    Data: undefined,
  };

  if (type === 'url') {
    config.URL = '{json:url}';
    config.Body = 'JSON';
    config.DestinationType = 'URLShortener,URLSharingService';
    config.RequestURL = `${window.location.origin}/api/user/urls`;

    delete (config as any).FileFormName;
    (config as any).Data = JSON.stringify({ destination: '{input}' });
  }

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

  if (options.noJson === true) {
    toAddHeaders['x-skycloud-no-json'] = 'true';
    config.URL = '{response}';
  } else {
    delete toAddHeaders['x-skycloud-no-json'];
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
    (config as any).Headers[key] = value;
  }

  return download(`skycloud-${type}.sxcu`, JSON.stringify(config, null, 2));
}
