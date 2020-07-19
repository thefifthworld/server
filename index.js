const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const passport = require('passport')

const config = require('./config')
const { initializePassport } = require('./auth')
const pub = require('./routes/public')
const login = require('./routes/login')

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
 * the view, such as the logged-in member or the page title.
 */

server.use((req, res, next) => {
  req.viewOpts = {
    member: null,
    meta: {
      url: `${req.protocol}://${req.get('host')}${req.originalUrl}`
    }
  }
  next()
})

server.use('/', login)
server.use('/', pub)

const { port } = config
server.listen(port, () => {
  console.log(`The Fifth World server is listening on port ${port}`)
})
