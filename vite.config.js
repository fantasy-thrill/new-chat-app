import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from "fs"

// https://vitejs.dev/config/
export default ({ mode }) => {
  process.env = {...process.env, ...loadEnv(mode, process.cwd())}

  return defineConfig({
    plugins: [react()],
    server: {
      https: {
        key: fs.readFileSync("./src/lib/key.pem"),
        cert: fs.readFileSync("./src/lib/cert.pem"),
        passphrase: process.env.VITE_SSL_PASSPHRASE
      }
    }
  })
}
