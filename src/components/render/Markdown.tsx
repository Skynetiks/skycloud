import { Code, Image, Paper } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import HighlightCode from './code/HighlightCode';
import remarkGfm from 'remark-gfm';

export default function Markdown({ md }: { md: string }) {
  return (
    <Paper withBorder p='md'>
      <ReactMarkdown
        components={{
          code({ node: _, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <HighlightCode language={match[1]} code={String(children).replace(/\n$/, '')} />
            ) : (
              <Code className={className} {...props}>
                {children}
              </Code>
            );
          },
          img({ node: _, ...props }) {
            return <Image {...props} />;
          },
        }}
        remarkPlugins={[remarkGfm]}
      >
        {md}
      </ReactMarkdown>
    </Paper>
  );
}
