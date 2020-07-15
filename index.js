const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const passport = require('passport')

const config = require('./config')
const pub = require('./routes/public')
const login = require('./routes/login')

const server = express()
server.set('view engine', 'ejs')
server.use(express.urlencoded({ extended: true }))
server.use(bodyParser.json())
server.use(cookieParser())

server.use(passport.initialize())
server.use(passport.session())

server.use('/', login)
server.use('/', pub)

const { port } = config
server.listen(port, () => {
  console.log(`The Fifth World server is listening on port ${port}`)
})
