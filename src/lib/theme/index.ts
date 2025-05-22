import {
  AppShell,
  defaultVariantColorsResolver,
  lighten,
  LoadingOverlay,
  MantineTheme,
  MantineThemeOverride,
  Modal,
  parseThemeColor,
  rgba,
  VariantColorsResolver,
} from '@mantine/core';

export type SkyCloudTheme = MantineTheme & {
  id: string;
  name: string;
  colorScheme: string;
  mainBackgroundColor: string;
};

export function findTheme(id: string, themes: SkyCloudTheme[] = []): SkyCloudTheme | undefined {
  return themes.find((theme) => theme.id === id);
}

const variantColorResolver: VariantColorsResolver = (input) => {
  const defaultResolvedColors = defaultVariantColorsResolver(input);
  if (input.variant !== 'oauth') return defaultResolvedColors;

  const parsedColor = parseThemeColor({
    color: input.color || input.theme.primaryColor,
    theme: input.theme,
  });

  return {
    background: rgba(parsedColor.value, 1),
    hover: rgba(parsedColor.value, input.color === 'oidc.0' ? 0.2 : 0.1),
    border: `1px solid ${parsedColor.value}`,
    color: lighten(parsedColor.value, 1),
    hoverColor: rgba(parsedColor.value, 1),
  };
};

export function themeComponents(theme: SkyCloudTheme): MantineThemeOverride {
  return {
    ...theme,
    variantColorResolver: variantColorResolver,
    components: {
      AppShell: AppShell.extend({
        styles: {
          main: {
            backgroundColor: theme.mainBackgroundColor,
          },
        },
      }),
      LoadingOverlay: LoadingOverlay.extend({
        defaultProps: {
          overlayProps: {
            blur: 6,
          },
        },
      }),
      Modal: Modal.extend({
        defaultProps: {
          closeButtonProps: { size: 'lg' },
          centered: true,
          overlayProps: {
            blur: 6,
          },
        },
      }),
    },
  };
}
