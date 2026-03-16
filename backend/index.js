import express from 'express'
import { serve, setup } from 'swagger-ui-express'
import { readFileSync } from 'fs'
import { load } from 'js-yaml'

const swaggerDocument = load(readFileSync('./openapi.yaml', 'utf8'))

const app = express()
const port = 3001

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('/docs', serve, setup(swaggerDocument))

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

