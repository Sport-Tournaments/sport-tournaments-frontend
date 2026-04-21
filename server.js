import { createServer } from 'http'
import next from 'next'
import { config } from 'dotenv'

// Load .env first, then .env.local overrides it (mirrors Next.js env loading order)
config()
config({ path: '.env.local', override: true })

const port = parseInt(process.env.PORT || '4000', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res)
  }).listen(port, (err) => {
    if (err) throw err
    console.log(
      `> Server listening at http://localhost:${port} as ${
        dev ? 'development' : process.env.NODE_ENV
      }`
    )
  })
})
