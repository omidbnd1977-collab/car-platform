import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // اجازه‌ی هاست‌های پراکسی (پیش‌نمایش Arena / تونل‌های توسعه) در حالت dev
    allowedHosts: true,
  },
})
