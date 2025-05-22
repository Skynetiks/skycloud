import { Box, Button, Group, Modal, Paper, SimpleGrid, Text, Title, Tooltip } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { IconCalendarSearch, IconCalendarTime } from '@tabler/icons-react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import FilesUrlsCountGraph from './parts/FilesUrlsCountGraph';
import { useApiStats } from './useStats';
import { StatsCardsSkeleton } from './parts/StatsCards';
import { StatsTablesSkeleton } from './parts/StatsTables';

const StatsCards = dynamic(() => import('./parts/StatsCards'));
const StatsTables = dynamic(() => import('./parts/StatsTables'));
const StorageGraph = dynamic(() => import('./parts/StorageGraph'));
const ViewsGraph = dynamic(() => import('./parts/ViewsGraph'));

export default function DashboardMetrics() {
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([
    new Date(Date.now() - 86400000 * 7).toISOString(),
    new Date().toISOString(),
  ]);

  const [open, setOpen] = useState(false);
  const [allTime, setAllTime] = useState(false);

  const { data, isLoading } = useApiStats({
    from: allTime || !dateRange[0] ? undefined : new Date(dateRange[0]).toISOString(),
    to: allTime || !dateRange[1] ? undefined : new Date(dateRange[1]).toISOString(),
    all: allTime,
  });

  const handleDateChange = (value: [string | null, string | null]) => {
    setAllTime(false);
    setDateRange(value);
  };

  useEffect(() => {
    if (allTime) setDateRange([null, null]);
  }, [allTime]);

  return (
    <>
      <Modal title='Change range' opened={open} onClose={() => setOpen(false)} size='auto'>
        <Paper withBorder>
          <DatePicker
            type='range'
            value={dateRange}
            onChange={handleDateChange}
            allowSingleDateInRange={false}
            maxDate={new Date()}
          />
        </Paper>

        <Group mt='md'>
          <Button fullWidth onClick={() => setOpen(false)}>
            Close
          </Button>
        </Group>
      </Modal>

      <Group>
        <Title>Metrics</Title>
        <Button
          size='compact-sm'
          variant='outline'
          leftSection={<IconCalendarSearch size='1rem' />}
          onClick={() => setOpen(true)}
        >
          Change Date Range
        </Button>
        {!allTime ? (
          <Text size='sm' c='dimmed'>
            {dateRange[0] ? new Date(dateRange[0]).toLocaleDateString() : '—'}
            {dateRange[1] ? ` to ${new Date(dateRange[1]).toLocaleDateString()}` : ''}
          </Text>
        ) : (
          <Text size='sm' c='dimmed'>
            All Time
          </Text>
        )}
        <Tooltip
          label={!allTime ? 'This may take longer than usual to load.' : 'You are viewing all time stats.'}
        >
          <Button
            size='compact-sm'
            variant='outline'
            leftSection={<IconCalendarTime size='1rem' />}
            onClick={() => setAllTime(true)}
            disabled={allTime}
          >
            Show All Time
          </Button>
        </Tooltip>
      </Group>

      <Box pos='relative' mih={300} my='sm'>
        {isLoading ? (
          <div>
            <StatsCardsSkeleton />
            <StatsTablesSkeleton />
          </div>
        ) : data?.length ? (
          <div>
            <StatsCards data={data} />
            <StatsTables data={data} />
            <SimpleGrid mt='md' cols={{ base: 1, md: 2 }}>
              <FilesUrlsCountGraph metrics={data} />
              <ViewsGraph metrics={data} />
            </SimpleGrid>
            <div>
              <StorageGraph metrics={data} />
            </div>
          </div>
        ) : (
          <Text size='sm' c='red'>
            Failed to load statistics for this time range. There may be no data available within the time
            range specified. :(
          </Text>
        )}
      </Box>
    </>
  );
}
