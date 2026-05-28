import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '../src/static/tab')
fs.mkdirSync(outDir, { recursive: true })

// 最小合法 1x1 PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)

;['home', 'home-active', 'profile', 'profile-active'].forEach((name) => {
  fs.writeFileSync(path.join(outDir, `${name}.png`), PNG)
})

console.log('Tab icons created in src/static/tab/')
