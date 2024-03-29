const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const passport = require('passport')
const session = require('express-session')

const config = require('./config')
const { initializePassport } = require('./auth')
const {
  initViewOpts,
  getUser,
  renewJWT,
  error404,
  error500
} = require('./universal-middlewares')

const pub = require('./routes/public')
const login = require('./routes/login')
const members = require('./routes/members')
const pages = require('./routes/pages')

const server = express()
server.set('view engine', 'ejs')
server.use(express.urlencoded({ extended: true }))
server.use(bodyParser.json())
server.use(cookieParser())

// Set up Passport
server.use(session({
  secret: process.env.SESSION_SECRET || '0123456789default_secret9876543210',
  resave: false,
  saveUninitialized: false
}))
server.use(passport.initialize())
server.use(passport.session())
initializePassport(passport)

server.use(initViewOpts)
server.use(getUser)
server.use(renewJWT)

server.use('/', login)
server.use('/', members)
server.use('/', pub)
server.use('/', pages)

// Error handling
server.use(error404)
server.use(error500)

const { port } = config
server.listen(port, () => {
  console.log(`The Fifth World server is listening on port ${port}`)
})
