import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config'

const background = { background: '#06161c', fit: 'contain' as const }

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...preset,
    transparent: { ...preset.transparent, padding: 0 },
    maskable: { ...preset.maskable, padding: 0, resizeOptions: background },
    apple: { ...preset.apple, padding: 0, resizeOptions: background },
  },
  images: ['public/logo.svg'],
})
