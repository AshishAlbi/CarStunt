import { defineConfig } from 'vite'
import { copy } from 'vite-plugin-copy'

// https://vitejs.dev/config/
export default defineConfig({
    base:"/CarStunt/",
    plugins: [
        copy([{ src: 'models', dest: 'dist' }])
    ]
})