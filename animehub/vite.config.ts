import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'

const base = process.env.BASE_PATH || '/'
const isPreview = process.env.IS_PREVIEW  ? true : false;
// https://vite.dev/config/
export default defineConfig({
  define: {
   __BASE_PATH__: JSON.stringify(base),
   __IS_PREVIEW__: JSON.stringify(isPreview)
  },
  plugins: [react(),
    AutoImport({
      imports: [
        {
          'react': [
            'React',
            'useState',
            'useEffect',
            'useContext',
            'useReducer',
            'useCallback',
            'useMemo',
            'useRef',
            'useImperativeHandle',
            'useLayoutEffect',
            'useDebugValue',
            'useDeferredValue',
            'useId',
            'useInsertionEffect',
            'useSyncExternalStore',
            'useTransition',
            'startTransition',
            'lazy',
            'memo',
            'forwardRef',
            'createContext',
            'createElement',
            'cloneElement',
            'isValidElement'
          ]
        },
        {
          'react-router-dom': [
            'useNavigate',
            'useLocation',
            'useParams',
            'useSearchParams',
            'Link',
            'NavLink',
            'Navigate',
            'Outlet'
          ]
        },
        // React i18n
        {
          'react-i18next': [
            'useTranslation',
            'Trans'
          ]
        }
      ],
      dts: true,
    }),
  ],
  base,
  build: {
    sourcemap: true,
    outDir: 'out',
    rollupOptions: {
      output: {
        manualChunks: {
          // React vendor chunk
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Animation library
          'animation': ['framer-motion'],
          // UI components
          'ui-components': [
            './src/components/feature/AnimeCard',
            './src/components/feature/HeroCarousel',
            './src/components/feature/Navbar',
            './src/components/base/Button',
            './src/components/base/Card'
          ],
          // Admin components
          'admin': [
            './src/components/admin/AddAnimeModal',
            './src/components/admin/EditAnimeModal',
            './src/components/admin/AnimeScraperComponent',
            './src/components/admin/EnhancedAnimeImporter'
          ],
          // Player components
          'player': [
            './src/components/player/SmartVideoPlayer',
            './src/components/player/IframePlayer',
            './src/components/player/YouTubePlayer'
          ],
          // Services
          'services': [
            './src/services/animeService',
            './src/services/videoService',
            './src/services/authService'
          ],
          // Utils
          'utils': [
            './src/utils/requestCache',
            './src/utils/playerUtils',
            './src/utils/navigation'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 500,
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    open: true
  }
})
