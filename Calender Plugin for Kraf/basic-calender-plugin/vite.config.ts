import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: 'index.ts',
            name: 'plugin',
            formats: ['es']
        },
        rollupOptions: {
            output: {
                dir: 'dist',
                entryFileNames: 'assets/index.js',
            }
        }
    },
    server: {
        cors: {
            origin: '*', // Allow all origins
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Specify allowed methods
            allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
        },
    },
    preview: {
        cors: {
            origin: '*', // Allow all origins
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Specify allowed methods
            allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
        },
    },
});
