import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: [
        'src/domain/**/*.ts',
        'src/core/errors.ts',
        'src/utils/git-ref.ts',
        'src/services/git/git-command-validator.ts',
      ],
      exclude: ['src/**/index.ts', 'src/**/types.ts'],
      thresholds: {
        lines: 75,
        functions: 65,
        branches: 65,
        statements: 75,
      },
    },
  },
});
