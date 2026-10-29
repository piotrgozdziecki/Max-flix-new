import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  const isAiStudio = Boolean(
    process.env.AI_STUDIO ||
      process.env.GITHUB_CODESPACES ||
      process.env.CODESPACES ||
      process.env.VITEST
  );

  return {
    base: './',
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: false,
      allowedHosts: true,
      hmr: false,
      watch: {
        usePolling: isAiStudio || isDev,
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
      strictPort: false,
    },
    build: {
      target: 'esnext',
      sourcemap: false,
      reportCompressedSize: false,
      rollupOptions: {
        external: ['@pmndrs/uikit/webgpu'],
        output: {
          manualChunks: {
            'vendor-three': ['three'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          },
        },
      },
    },
    optimizeDeps: {
      include: [
        'three',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        '@pmndrs/uikit',
      ],
      esbuildOptions: {
        target: 'esnext',
      },
    },
  };
});
