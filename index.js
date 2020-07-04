const express = require('express')

const config = require('./config')
const pub = require('./routes/public')
const login = require('./routes/login')

const server = express()
server.set('view engine', 'ejs')

server.use('/', login)
server.use('/', pub)

const { port } = config
server.listen(port, () => {
  console.log(`The Fifth World server is listening on port ${port}`)
})
