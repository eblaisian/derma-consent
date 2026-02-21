import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    title: 'Derma Consent',
    description: 'Zero-knowledge consent management for dermatology practices',

    head: [['link', { rel: 'icon', href: '/favicon.svg' }]],

    ignoreDeadLinks: [
      /localhost/,
    ],

    srcExclude: ['STRATEGY.md', 'TEST-CREDENTIALS.md'],

    themeConfig: {
      logo: '/favicon.svg',

      nav: [
        { text: 'Guide', link: '/guide/' },
        { text: 'Self-Hosted', link: '/self-hosted/' },
        { text: 'Development', link: '/development/' },
        { text: 'Reference', link: '/reference/environment-variables' },
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

      socialLinks: [
        { icon: 'github', link: 'https://github.com/your-org/derma-consent' },
      ],

      search: {
        provider: 'local',
      },

      footer: {
        message: 'Released under the MIT License.',
        copyright: 'Copyright 2025-present Derma Consent',
      },
    },

    mermaid: {
      // Mermaid config: https://mermaid.js.org/config/setup/modules/mermaidAPI.html
    },

    vite: {
      optimizeDeps: {
        include: ['mermaid'],
      },
    },
  })
)
