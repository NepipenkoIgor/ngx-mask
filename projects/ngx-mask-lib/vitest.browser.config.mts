import { defineConfig } from 'vitest/config';

// The browser specs share the real system clipboard (userEvent.copy/paste), so
// spec files must not run in parallel or one file's paste reads another's copy.
export default defineConfig({
    test: {
        fileParallelism: false,
    },
});
