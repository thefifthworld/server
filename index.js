const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const passport = require('passport')

const config = require('./config')
const { initializePassport } = require('./auth')
const {
  initViewOpts,
  verifyJWT,
  renewJWT,
  error404,
  error500
} = require('./universal-middlewares')

const pub = require('./routes/public')
const login = require('./routes/login')
const members = require('./routes/members')

const server = express()
server.set('view engine', 'ejs')
server.use(express.urlencoded({ extended: true }))
server.use(bodyParser.json())
server.use(cookieParser())

// Set up Passport
server.use(passport.initialize())
server.use(passport.session())
initializePassport(passport)

/**
 * This universal middleware adds a basic options object to the `req` object.
 * Initially, this simply sets the URL to the value of `req.originalUrl`, but
 * this also provides a place to easily store other data that needs to get to
 * the view, such as the logged-in member or the page title. It also checks if
 * the request comes from a logged-in user.
 */

server.use(initViewOpts)
server.use(verifyJWT)
server.use(renewJWT)

server.use('/', login)
server.use('/', members)
server.use('/', pub)

// Error handling
server.use(error404)
server.use(error500)

const { port } = config
server.listen(port, () => {
  console.log(`The Fifth World server is listening on port ${port}`)
})
