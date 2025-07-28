import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'], // Soporte para CommonJS y ES Modules
  dts: true, // Generar archivos de declaración de tipos (.d.ts)
  splitting: false,
  sourcemap: true,
  clean: true, // Limpiar el directorio 'dist' antes de cada build
  minify: true,
});