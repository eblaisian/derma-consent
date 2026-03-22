import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    title: 'DermaConsent',
    description: 'Zero-knowledge consent management for dermatology practices',
    base: '/',

    head: [['link', { rel: 'icon', href: '/favicon.svg' }]],

    ignoreDeadLinks: [
      /localhost/,
    ],

    // Exclude internal docs from the public site
    srcExclude: [
      'STRATEGY.md',
      'TEST-CREDENTIALS.md',
      'LAUNCH_READINESS_REPORT.md',
      'LAUNCH-ANALYSIS-2026-03-14.md',
      'PRODUCT-AUDIT-2026-02-21.md',
      'AI-ROADMAP.md',
      'DESIGN_SYSTEM.md',
      'plan/**',
    ],

    themeConfig: {
      logo: '/favicon.svg',
      siteTitle: 'DermaConsent Docs',

      nav: [
        { text: 'Guide', link: '/guide/' },
        { text: 'Self-Hosted', link: '/self-hosted/' },
        { text: 'Development', link: '/development/' },
        { text: 'Reference', link: '/reference/environment-variables' },
        { text: 'App', link: 'https://derma-consent.de' },
      ],

      sidebar: {
        '/guide/': [
          {
            text: 'Guide',
            items: [
              { text: 'Introduction', link: '/guide/' },
              { text: 'Getting Started', link: '/guide/getting-started' },
              { text: 'Architecture', link: '/guide/architecture' },
              { text: 'Key Concepts', link: '/guide/key-concepts' },
              { text: 'Consent Documents', link: '/guide/consent-documents' },
            ],
          },
        ],

        '/self-hosted/': [
          {
            text: 'Self-Hosted',
            items: [
              { text: 'Overview', link: '/self-hosted/' },
              { text: 'Prerequisites', link: '/self-hosted/prerequisites' },
              { text: 'Installation', link: '/self-hosted/installation' },
              { text: 'Configuration', link: '/self-hosted/configuration' },
              { text: 'Docker Deployment', link: '/self-hosted/docker' },
              { text: 'Updating', link: '/self-hosted/updating' },
              { text: 'Production Checklist', link: '/self-hosted/production-checklist' },
            ],
          },
        ],

        '/development/': [
          {
            text: 'Development',
            items: [
              { text: 'Overview', link: '/development/' },
              { text: 'Local Setup', link: '/development/setup' },
              { text: 'Backend (NestJS)', link: '/development/backend' },
              { text: 'Frontend (Next.js)', link: '/development/frontend' },
              { text: 'Database & Prisma', link: '/development/database' },
              { text: 'Testing', link: '/development/testing' },
              { text: 'Contributing', link: '/development/contributing' },
            ],
          },
        ],

        '/reference/': [
          {
            text: 'Reference',
            items: [
              { text: 'Environment Variables', link: '/reference/environment-variables' },
              { text: 'API Endpoints', link: '/reference/api-endpoints' },
              { text: 'Roles & Permissions', link: '/reference/roles-permissions' },
              { text: 'Consent Types', link: '/reference/consent-types' },
              { text: 'Billing Plans', link: '/reference/billing-plans' },
            ],
          },
        ],
      },

      search: {
        provider: 'local',
      },

      footer: {
        message: 'DSGVO-konforme digitale Einwilligungen',
        copyright: 'Copyright 2025-present DermaConsent',
      },

      editLink: {
        pattern: 'https://github.com/sohaibfaroukh/derma-consent/edit/master/docs/:path',
        text: 'Edit this page',
      },
    },

    mermaid: {},

    vite: {
      optimizeDeps: {
        include: ['mermaid'],
      },
    },
  })
)
