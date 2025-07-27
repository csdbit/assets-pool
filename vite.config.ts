import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载 env 文件
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react({
        babel: {
          plugins: [
            'react-dev-locator',
          ],
        },
      }),
      traeBadgePlugin({
        variant: 'dark',
        position: 'bottom-right',
        prodOnly: true,
        clickable: true,
        clickUrl: 'https://www.trae.ai/solo?showJoin=1',
        autoTheme: true,
        autoThemeTarget: '#root'
      }), 
      tsconfigPaths()
    ],
    server: {
      port: parseInt(env.VITE_PORT || '5173'),
      strictPort: false, // 如果端口被占用，尝试下一个可用端口
      host: true, // 监听所有地址
      allowedHosts: [
        'localhost',
        '127.0.0.1',
      ]
    }
  }
})
