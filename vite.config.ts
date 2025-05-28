import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [
    angular({
      tsconfig: 'tsconfig.app.json'
    })
  ],
  build: {
    target: ['es2020']
  },
  resolve: {
    mainFields: ['module']
  }
});