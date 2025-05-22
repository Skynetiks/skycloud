import {
  Icon,
  IconBracketsContain,
  IconBrandGolang,
  IconBrandKotlin,
  IconBrandPowershell,
  IconBrandPython,
  IconBrandRust,
  IconBrandTypescript,
  IconFileCode,
  IconFileCode2,
  IconFileText,
  IconFileTypeCss,
  IconFileTypeCsv,
  IconFileTypeDocx,
  IconFileTypeHtml,
  IconFileTypeJs,
  IconFileTypeJsx,
  IconFileTypePhp,
  IconFileTypePpt,
  IconFileTypeRs,
  IconFileTypeSql,
  IconFileTypeXls,
  IconFileTypeXml,
  IconFileUnknown,
  IconFileZip,
  IconMarkdown,
  IconMusic,
  IconPhoto,
  IconTerminal2,
  IconTex,
  IconVideo,
} from '@tabler/icons-react';

const genericIcons: Record<string, Icon> = {
  video: IconVideo,
  image: IconPhoto,
  audio: IconMusic,
  text: IconFileText,
};

const icons: Record<string, Icon> = {
  // common compressed files
  'application/zip': IconFileZip,
  'application/x-7z-compressed': IconFileZip,
  'application/x-rar-compressed': IconFileZip,
  'application/x-tar': IconFileZip,
  'application/x-bzip2': IconFileZip,
  'application/x-gzip': IconFileZip,

  // common text/document files that are not detected by the 'text' type
  'application/pdf': IconFileText,
  'application/msword': IconFileTypeDocx,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': IconFileTypeDocx,
  'application/vnd.ms-excel': IconFileTypeXls,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': IconFileTypeXls,
  'application/vnd.ms-powerpoint': IconFileTypePpt,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': IconFileTypePpt,
  'text/csv': IconFileTypeCsv,

  // other random stuff
  'text/x-sql': IconFileTypeSql,
  'text/css': IconFileTypeCss,
  'text/html': IconFileTypeHtml,
  'text/x-rust': IconFileTypeRs,
  'application/js': IconFileTypeJs,
  'text/javascript': IconFileTypeJs,
  'application/json': IconBracketsContain,
  'text/xml': IconFileTypeXml,

  // skycloud text uploads
  'text/x-skycloud-html': IconFileTypeHtml,
  'text/x-skycloud-css': IconFileTypeCss,
  'text/x-skycloud-javascript': IconFileTypeJs,
  'text/x-skycloud-python': IconBrandPython,
  'text/x-skycloud-markdown': IconMarkdown,
  'text/x-skycloud-httpd-php': IconFileTypePhp,
  'text/x-skycloud-sass': IconFileTypeCss,
  'text/x-skycloud-scss': IconFileTypeCss,
  'text/x-skycloud-typescript': IconBrandTypescript,
  'text/x-skycloud-go': IconBrandGolang,
  'text/x-skycloud-rustsrc': IconBrandRust,
  'text/x-skycloud-sh': IconTerminal2,
  'text/x-skycloud-json': IconFileCode2,
  'text/x-skycloud-powershell': IconBrandPowershell,
  'text/x-skycloud-sql': IconFileTypeSql,
  'text/x-skycloud-kotlin': IconBrandKotlin,
  'text/x-skycloud-jsx': IconFileTypeJsx,
  'text/x-skycloud-plain': IconFileText,
  'text/x-skycloud-latex': IconTex,

  'text/x-skycloud-c++src': IconFileCode,
  'text/x-skycloud-ruby': IconFileCode,
  'text/x-skycloud-java': IconFileCode,
  'text/x-skycloud-csrc': IconFileCode,
  'text/x-skycloud-swift': IconFileCode,
  'text/x-skycloud-yaml': IconFileCode,
  'text/x-skycloud-dockerfile': IconFileCode,
  'text/x-skycloud-lua': IconFileCode,
  'text/x-skycloud-nginx-conf': IconFileCode,
  'text/x-skycloud-perl': IconFileCode,
  'text/x-skycloud-rsrc': IconFileCode,
  'text/x-skycloud-scala': IconFileCode,
  'text/x-skycloud-groovy': IconFileCode,
  'text/x-skycloud-haskell': IconFileCode,
  'text/x-skycloud-elixir': IconFileCode,
  'text/x-skycloud-vim': IconFileCode,
  'text/x-skycloud-matlab': IconFileCode,
  'text/x-skycloud-dart': IconFileCode,
  'text/x-skycloud-handlebars-template': IconFileCode,
  'text/x-skycloud-hcl': IconFileCode,
  'text/x-skycloud-http': IconFileCode,
  'text/x-skycloud-ini': IconFileCode,
  'text/x-skycloud-coffeescript': IconFileCode,

  // feel free to PR more icons if you want :D
};

export default function fileIcon(type: string): Icon {
  const icon = icons[type] || genericIcons[type.split('/')[0]] || IconFileUnknown;

  return icon;
}
