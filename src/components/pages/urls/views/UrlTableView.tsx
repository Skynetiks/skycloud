import RelativeDate from '@/components/RelativeDate';
import { Response } from '@/lib/api/response';
import { Url } from '@/lib/db/models/url';
import { ActionIcon, Anchor, Box, Checkbox, Group, TextInput, Tooltip } from '@mantine/core';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useReducer, useState } from 'react';
import useSWR from 'swr';
import { copyUrl, deleteUrl } from '../actions';
import { IconCopy, IconPencil, IconTrashFilled } from '@tabler/icons-react';
import { useConfig } from '@/components/ConfigProvider';
import { useClipboard } from '@mantine/hooks';
import { useSettingsStore } from '@/lib/store/settings';
import { formatRootUrl, trimUrl } from '@/lib/url';
import EditUrlModal from '../EditUrlModal';

const NAMES = {
  code: 'Code',
  vanity: 'Vanity',
  destination: 'Destination',
};

function SearchFilter({
  setSearchField,
  searchQuery,
  setSearchQuery,
  field,
}: {
  setSearchField: (...args: any) => void;
  searchQuery: {
    code: string;
    vanity: string;
    destination: string;
  };
  setSearchQuery: (...args: any) => void;
  field: 'code' | 'vanity' | 'destination';
}) {
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchField(field);
    setSearchQuery({
      field,
      query: e.target.value,
    });
  };

  return (
    <TextInput
      label={NAMES[field]}
      placeholder={`Search by ${NAMES[field].toLowerCase()}`}
      value={searchQuery[field]}
      onChange={onChange}
      variant='filled'
      size='sm'
    />
  );
}

const fetcher = async ({ searchQuery, searchField }: { searchQuery?: string; searchField?: string }) => {
  const searchParams = new URLSearchParams();
  if (searchQuery) {
    searchParams.append('searchQuery', searchQuery);
    if (searchField) searchParams.append('searchField', searchField);
  }

  const res = await fetch(`/api/user/urls${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
  if (!res.ok) {
    const json = await res.json();

    throw new Error(json.message);
  }

  return res.json();
};

export default function UrlTableView() {
  const config = useConfig();
  const clipboard = useClipboard();

  const [searchField, setSearchField] = useState<'code' | 'vanity' | 'destination'>('destination');
  const [searchQuery, setSearchQuery] = useReducer(
    (
      state: { code: string; vanity: string; destination: string },
      action: {
        field: 'code' | 'vanity' | 'destination';
        query: string;
      },
    ) => {
      return {
        ...state,
        [action.field]: action.query,
      };
    },
    {
      code: '',
      vanity: '',
      destination: '',
    },
  );
  const warnDeletion = useSettingsStore((state) => state.settings.warnDeletion);

  const { data, isLoading } = useSWR<Extract<Response['/api/user/urls'], Url[]>>(
    {
      key: '/api/user/urls',
      ...(searchQuery[searchField].trim() !== '' && {
        searchQuery: searchQuery[searchField],
        searchField,
      }),
    },
    fetcher,
  );

  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: 'createdAt',
    direction: 'desc',
  });
  const [sorted, setSorted] = useState<Url[]>(data ?? []);

  const [selectedUrl, setSelectedUrl] = useState<Url | null>(null);

  useEffect(() => {
    if (data) {
      const sorted = data.sort((a, b) => {
        const cl = sortStatus.columnAccessor as keyof Url;

        return sortStatus.direction === 'asc' ? (a[cl]! > b[cl]! ? 1 : -1) : a[cl]! < b[cl]! ? 1 : -1;
      });

      setSorted(sorted);
    }
  }, [sortStatus]);

  useEffect(() => {
    if (data) {
      setSorted(data);
    }
  }, [data]);

  useEffect(() => {
    for (const field of ['code', 'vanity', 'destination'] as const) {
      if (field !== searchField) {
        setSearchQuery({
          field,
          query: '',
        });
      }
    }
  }, [searchField]);

  return (
    <>
      <EditUrlModal url={selectedUrl} onClose={() => setSelectedUrl(null)} open={!!selectedUrl} />

      <Box my='sm'>
        <DataTable
          borderRadius='sm'
          withTableBorder
          minHeight={200}
          records={sorted ?? []}
          columns={[
            {
              accessor: 'code',
              sortable: true,
              filter: (
                <SearchFilter
                  setSearchField={setSearchField}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  field='code'
                />
              ),
              filtering: searchField === 'code' && searchQuery.code.trim() !== '',
              render: (url) => (
                <Anchor href={formatRootUrl(config.urls.route, url.code)} target='_blank'>
                  {url.code}
                </Anchor>
              ),
            },
            {
              accessor: 'vanity',
              sortable: true,
              filter: (
                <SearchFilter
                  setSearchField={setSearchField}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  field='vanity'
                />
              ),
              filtering: searchField === 'vanity' && searchQuery.vanity.trim() !== '',
              render: (url) =>
                url.vanity ? (
                  <Anchor href={formatRootUrl(config.urls.route, url.vanity)} target='_blank'>
                    {url.vanity}
                  </Anchor>
                ) : (
                  ''
                ),
            },
            {
              accessor: 'destination',
              sortable: true,
              render: (url) => (
                <Anchor href={url.destination} target='_blank' rel='noreferrer'>
                  {trimUrl(100, url.destination)}
                </Anchor>
              ),
              filter: (
                <SearchFilter
                  setSearchField={setSearchField}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  field='destination'
                />
              ),
              filtering: searchField === 'destination' && searchQuery.destination.trim() !== '',
            },
            {
              accessor: 'views',
              sortable: true,
            },
            {
              accessor: 'maxViews',
              sortable: true,
              render: (url) => (url.maxViews ? url.maxViews : ''),
            },
            {
              accessor: 'createdAt',
              title: 'Created',
              sortable: true,
              render: (url) => <RelativeDate date={url.createdAt} />,
            },
            {
              accessor: 'enabled',
              title: 'Enabled',
              sortable: true,
              render: (url) => <Checkbox checked={url.enabled} />,
            },
            {
              accessor: 'actions',
              textAlign: 'right',
              render: (url) => (
                <Group gap='sm' justify='right' wrap='nowrap'>
                  <Tooltip label='Copy URL'>
                    <ActionIcon
                      onClick={(e) => {
                        e.stopPropagation();
                        copyUrl(url, config, clipboard);
                      }}
                    >
                      <IconCopy size='1rem' />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label='Edit URL'>
                    <ActionIcon
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUrl(url);
                      }}
                    >
                      <IconPencil size='1rem' />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label='Delete URL'>
                    <ActionIcon
                      color='red'
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteUrl(warnDeletion, url);
                      }}
                    >
                      <IconTrashFilled size='1rem' />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              ),
            },
          ]}
          fetching={isLoading}
          sortStatus={sortStatus}
          onSortStatusChange={(s) => setSortStatus(s as unknown as any)}
        />
      </Box>
    </>
  );
}
