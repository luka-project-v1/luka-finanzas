import { defineConfig } from 'prisma/config'
import { config } from 'dotenv'

// Load environment variables
config()

export default defineConfig({
  datasource: {
    url: process.env.DIRECT_URL!,
  },
})
