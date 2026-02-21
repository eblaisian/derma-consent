# Contributing

We welcome contributions to Derma Consent.

## Getting Started

1. Fork the repository
2. Clone your fork and set up the dev environment ([Local Setup](/development/setup))
3. Create a feature branch: `git checkout -b feature/my-feature`
4. Make your changes
5. Run tests: `make test`
6. Run lint: `pnpm lint`
7. Commit and push
8. Open a pull request

## Code Style

- **TypeScript** throughout — no `any` types unless absolutely necessary
- **Backend:** Follow NestJS conventions (modules, controllers, services, DTOs)
- **Frontend:** Follow Next.js App Router patterns, use shadcn/ui for UI components
- **Database:** Column names in snake_case (via Prisma `@map`), model names in PascalCase

## Commit Messages

Use clear, descriptive commit messages:

```
feat: add chemical peel consent form type
fix: correct signature canvas scaling on mobile
docs: update environment variables reference
```

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Include a description of what changed and why
- Add tests for new features
- Ensure all existing tests pass
- Update documentation if the change affects user-facing behavior

## Project Structure

See [Architecture](/guide/architecture) for a detailed breakdown of how the codebase is organized.

## Security

If you discover a security vulnerability, please report it privately rather than opening a public issue. Contact the maintainers directly.

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
