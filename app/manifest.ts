import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MOIM',
    short_name: 'MOIM',
    description: '참석 여부, 한 번에 모아요',
    start_url: '/',
    display: 'standalone',
    theme_color: '#3355FF',
    background_color: '#F6F5F1',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
