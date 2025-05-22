import type { Response } from '@/lib/api/response';
import type { SafeConfig } from '@/lib/config/safe';
import { fetchApi } from '@/lib/fetchApi';
import useAvatar from '@/lib/hooks/useAvatar';
import useLogin from '@/lib/hooks/useLogin';
import { isAdministrator } from '@/lib/role';
import { useUserStore } from '@/lib/store/user';
import {
  AppShell,
  Avatar,
  Burger,
  Button,
  Divider,
  Menu,
  NavLink,
  Paper,
  Title,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { useModals } from '@mantine/modals';
import { showNotification } from '@mantine/notifications';
import {
  IconAdjustments,
  IconChevronDown,
  IconChevronRight,
  IconClipboardCopy,
  IconFileText,
  IconFileUpload,
  IconFiles,
  IconFolder,
  IconGraph,
  IconHome,
  IconLink,
  IconLogout,
  IconRefreshDot,
  IconSettingsFilled,
  IconShieldLockFilled,
  IconTags,
  IconUpload,
  IconUsersGroup,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import ConfigProvider from './ConfigProvider';

type NavLinks = {
  label: string;
  icon: React.ReactNode;
  active: (path: string) => boolean;
  href?: string;
  links?: NavLinks[];
  if?: (user: Response['/api/user']['user'], config: SafeConfig) => boolean;
};

const navLinks: NavLinks[] = [
  {
    label: 'Home',
    icon: <IconHome size='1rem' />,
    active: (path: string) => path === '/dashboard',
    href: '/dashboard',
  },
  {
    label: 'Metrics',
    icon: <IconGraph size='1rem' />,
    active: (path: string) => path === '/dashboard/metrics',
    href: '/dashboard/metrics',
    if: (user, config) =>
      config.features.metrics.enabled &&
      (config.features.metrics.adminOnly ? isAdministrator(user?.role) : true),
  },
  {
    label: 'Files',
    icon: <IconFiles size='1rem' />,
    active: (path: string) => path === '/dashboard/files',
    href: '/dashboard/files',
  },
  {
    label: 'Folders',
    icon: <IconFolder size='1rem' />,
    active: (path: string) => path === '/dashboard/folders',
    href: '/dashboard/folders',
  },
  {
    label: 'Upload',
    icon: <IconUpload size='1rem' />,
    active: (path: string) => path.startsWith('/dashboard/upload'),
    links: [
      {
        label: 'File',
        icon: <IconFileUpload size='1rem' />,
        active: (path: string) => path === '/dashboard/upload/file',
        href: '/dashboard/upload/file',
      },
      {
        label: 'Text',
        icon: <IconFileText size='1rem' />,
        active: (path: string) => path === '/dashboard/upload/text',
        href: '/dashboard/upload/text',
      },
    ],
  },
  {
    label: 'URLs',
    icon: <IconLink size='1rem' />,
    active: (path: string) => path === '/dashboard/urls',
    href: '/dashboard/urls',
  },
  {
    label: 'Administrator',
    icon: <IconShieldLockFilled size='1rem' />,
    if: (user) => isAdministrator(user?.role),
    active: (path: string) => path.startsWith('/dashboard/admin'),
    links: [
      {
        label: 'Settings',
        icon: <IconAdjustments size='1rem' />,
        active: (path: string) => path === '/dashboard/admin/settings',
        if: (user) => user?.role === 'SUPERADMIN',
        href: '/dashboard/admin/settings',
      },
      {
        label: 'Users',
        icon: <IconUsersGroup size='1rem' />,
        active: (path: string) => path === '/dashboard/admin/users',
        href: '/dashboard/admin/users',
      },
      {
        label: 'Invites',
        icon: <IconTags size='1rem' />,
        active: (path: string) => path === '/dashboard/admin/invites',
        href: '/dashboard/admin/invites',
        if: (_, config) => config.invites.enabled,
      },
    ],
  },
];

export default function Layout({ children, config }: { children: React.ReactNode; config: SafeConfig }) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [opened, setOpened] = useState(false);
  const router = useRouter();
  const modals = useModals();
  const clipboard = useClipboard();
  const setUser = useUserStore((s) => s.setUser);

  const { user, mutate } = useLogin();
  const { avatar } = useAvatar();

  const copyToken = () => {
    modals.openConfirmModal({
      title: 'Copy token?',
      children:
        'Are you sure you want to copy your token? Your token can interact with all parts of SkyCloud. Do not share this token with anyone.',
      labels: { confirm: 'Copy', cancel: 'No, close this popup' },
      onConfirm: async () => {
        const { data, error } = await fetchApi<Response['/api/user/token']>('/api/user/token');
        if (error) {
          showNotification({
            title: 'Error',
            message: error.error,
            color: 'red',
            icon: <IconClipboardCopy size='1rem' />,
          });
        } else {
          clipboard.copy(data?.token ?? '');
          showNotification({
            title: 'Copied',
            message: 'Your token has been copied to your clipboard.',
            color: 'green',
            icon: <IconClipboardCopy size='1rem' />,
          });
        }
      },
    });
  };

  const refreshToken = () => {
    modals.openConfirmModal({
      title: 'Refresh token?',

      children:
        'Are you sure you want to refresh your token? Once you refresh/reset your token, you will need to update any scripts or applications that use your token.',
      labels: { confirm: 'Refresh', cancel: 'No, close this popup' },
      onConfirm: async () => {
        const { data, error } = await fetchApi<Response['/api/user/token']>('/api/user/token', 'PATCH');
        if (error) {
          showNotification({
            title: 'Error',
            message: error.error,
            color: 'red',
            icon: <IconRefreshDot size='1rem' />,
          });
        } else {
          setUser(data?.user);
          mutate(data as Response['/api/user']);

          showNotification({
            title: 'Refreshed',
            message: 'Your token has been refreshed.',
            color: 'green',
            icon: <IconRefreshDot size='1rem' />,
          });
        }
      },
    });
  };

  return (
    <AppShell
      navbar={{ breakpoint: 'sm', width: { sm: 200, lg: 230 }, collapsed: { mobile: !opened } }}
      header={{ height: 60 }}
      footer={{ height: { base: 0.1 } }}
    >
      <AppShell.Header px='md'>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Burger
            opened={opened}
            onClick={() => setOpened((o) => !o)}
            size='sm'
            color={theme.colors.gray[6]}
            mr='xl'
            hiddenFrom='sm'
          />

          {config.website.titleLogo && (
            <Avatar src={config.website.titleLogo} alt='SkyCloud logo' radius='sm' size='md' mr='md' />
          )}

          <Title visibleFrom='sm' lineClamp={1} size={32}>
            {config.website.title.trim()}
          </Title>

          <div style={{ marginLeft: 'auto' }}>
            <Menu shadow='md' width={200}>
              <Menu.Target>
                <Button
                  variant='transparent'
                  color={colorScheme === 'dark' ? 'white' : 'black'}
                  leftSection={
                    avatar ? (
                      <Avatar src={avatar} radius='sm' size='sm' alt={user?.username ?? 'User avatar'} />
                    ) : (
                      <IconSettingsFilled size='1rem' />
                    )
                  }
                  rightSection={<IconChevronDown size='0.7rem' />}
                  size='sm'
                >
                  {user?.username}
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>
                  {user?.username}
                  {isAdministrator(user?.role) ? ' (Administrator)' : ''}
                </Menu.Label>

                <Menu.Item leftSection={<IconClipboardCopy size='1rem' />} onClick={copyToken}>
                  Copy token
                </Menu.Item>
                <Menu.Item color='red' leftSection={<IconRefreshDot size='1rem' />} onClick={refreshToken}>
                  Refresh token
                </Menu.Item>
                <Menu.Divider />

                <Menu.Item
                  leftSection={<IconSettingsFilled size='1rem' />}
                  component={Link}
                  href='/dashboard/settings'
                >
                  Settings
                </Menu.Item>

                {user?.role === 'SUPERADMIN' && (
                  <Menu.Item
                    leftSection={<IconAdjustments size='1rem' />}
                    component={Link}
                    href='/dashboard/admin/settings'
                  >
                    Server Settings
                  </Menu.Item>
                )}

                <Menu.Divider />
                <Menu.Item
                  color='red'
                  leftSection={<IconLogout size='1rem' />}
                  component={Link}
                  href='/auth/logout'
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </div>
        </div>
      </AppShell.Header>

      <AppShell.Navbar hidden={!opened} zIndex={90}>
        <Title hiddenFrom='sm' size={24} m='sm' style={{ marginBottom: 20 }}>
          {config.website.title.trim()}
        </Title>
        <Divider hiddenFrom='sm' />

        {navLinks
          .filter((link) => !link.if || link.if(user as Response['/api/user']['user'], config))
          .map((link) => {
            if (!link.links) {
              return (
                <NavLink
                  key={link.label}
                  label={link.label}
                  leftSection={link.icon}
                  variant='light'
                  rightSection={<IconChevronRight size='0.7rem' />}
                  active={router.pathname === link.href}
                  component={Link}
                  href={link.href || ''}
                />
              );
            } else {
              return (
                <NavLink
                  key={link.label}
                  label={link.label}
                  leftSection={link.icon}
                  variant='light'
                  rightSection={<IconChevronRight size='0.7rem' />}
                  defaultOpened={link.active(router.pathname)}
                >
                  {link.links
                    .filter(
                      (sublink) => !sublink.if || sublink.if(user as Response['/api/user']['user'], config),
                    )
                    .map((sublink) => (
                      <NavLink
                        key={sublink.label}
                        label={sublink.label}
                        leftSection={sublink.icon}
                        rightSection={<IconChevronRight size='0.7rem' />}
                        variant='light'
                        active={router.pathname === sublink.href}
                        component={Link}
                        href={sublink.href || ''}
                      />
                    ))}
                </NavLink>
              );
            }
          })}
      </AppShell.Navbar>

      <AppShell.Main>
        <ConfigProvider config={config}>
          <Paper m='lg' withBorder p='xs'>
            {children}
          </Paper>
        </ConfigProvider>
      </AppShell.Main>

      <AppShell.Footer display='none' />
    </AppShell>
  );
}
