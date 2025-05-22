import { queryStats } from '@/lib/stats';
import { IntervalTask } from '..';

export default function metrics(prisma: typeof globalThis.__db__) {
  return async function (this: IntervalTask) {
    const stats = await queryStats();

    const metric = await prisma.metric.create({
      data: {
        data: stats,
      },
    });

    this.logger.debug('created metric', {
      id: metric.id,
      metric: stats,
    });
  };
}
