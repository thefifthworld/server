const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const MySQLStore = require('express-mysql-session')(session)
const passport = require('passport')

const config = require('./config')
const pub = require('./routes/public')
const login = require('./routes/login')

const server = express()
server.set('view engine', 'ejs')
server.use(express.urlencoded({ extended: true }))
server.use(bodyParser.json())
server.use(cookieParser())

const store = new MySQLStore(config.db)
server.use(session({
  key: 'thefifthworld_session',
  secret: config.sessionSecret,
  store,
  resave: true,
  saveUninitialized: true
}))

server.use(passport.initialize())
server.use(passport.session())

server.use('/', login)
server.use('/', pub)

const { port } = config
server.listen(port, () => {
  console.log(`The Fifth World server is listening on port ${port}`)
})
