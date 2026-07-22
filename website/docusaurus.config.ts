import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

import pkg from './package.json';

// This runs in Node.js — don't use client-side code here.
// pkg.version is kept in sync with the release by @release-it/bumper.

const config: Config = {
  title: 'Ashborn',
  tagline: 'See what your AI agents access, call, and send.',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  url: 'https://vedant1202.github.io',
  baseUrl: '/ashborn/',

  organizationName: 'Vedant1202',
  projectName: 'ashborn',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/Vedant1202/ashborn/tree/main/website/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    metadata: [
      {
        name: 'keywords',
        content:
          'ai security, agent security, llm security, prompt injection, tool poisoning, mcp, agentdojo, benchmark',
      },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'Ashborn',
      logo: {
        alt: 'Ashborn',
        src: 'img/logo.svg',
        srcDark: 'img/logo-dark.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://www.npmjs.com/package/@ashborn-sec/cli',
          label: 'npm',
          position: 'right',
        },
        {
          href: 'https://github.com/Vedant1202/ashborn',
          label: 'GitHub',
          position: 'right',
        },
        {
          label: `v${pkg.version}`,
          href: 'https://github.com/Vedant1202/ashborn/blob/main/CHANGELOG.md',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Introduction', to: '/docs/intro' },
            { label: 'Getting started', to: '/docs/getting-started' },
            { label: 'The signals', to: '/docs/signals' },
          ],
        },
        {
          title: 'Project',
          items: [
            { label: 'GitHub', href: 'https://github.com/Vedant1202/ashborn' },
            { label: 'npm', href: 'https://www.npmjs.com/package/@ashborn-sec/cli' },
            {
              label: 'Changelog',
              href: 'https://github.com/Vedant1202/ashborn/blob/main/CHANGELOG.md',
            },
          ],
        },
        {
          title: 'More',
          items: [
            { label: "What is and isn't claimed", to: '/docs/what-is-claimed' },
            { label: 'Roadmap', to: '/docs/roadmap' },
            {
              label: 'Security policy',
              href: 'https://github.com/Vedant1202/ashborn/security/policy',
            },
          ],
        },
      ],
      copyright: 'Ashborn — MIT licensed. Built with Docusaurus.',
    },
    prism: {
      theme: prismThemes.oneLight,
      darkTheme: prismThemes.oneDark,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
