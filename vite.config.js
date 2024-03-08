import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from "fs"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync("./src/lib/key.pem"),
      cert: fs.readFileSync("./src/lib/cert.pem"),
      passphrase: "juggernaut"
    }
  }
})
