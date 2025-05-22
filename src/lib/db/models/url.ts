import type { Url as PrismaUrl } from '../../../../generated/client';

export type Url = PrismaUrl & {
  similarity?: number;
};
