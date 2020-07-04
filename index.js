const express = require('express')

const config = require('./config')
const login = require('./routes/login')

const server = express()
server.set('view engine', 'ejs')
const router = express.Router()

server.use('/', login)
server.use('/', router)

router.get('/', async (req, res) => {
  res.render('home')
})

const { port } = config
server.listen(port, () => {
  console.log(`The Fifth World server is listening on port ${port}`)
})
