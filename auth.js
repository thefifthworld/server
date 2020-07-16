const axios = require('axios')
const LocalStrategy = require('passport-local').Strategy
const config = require('./config')

/**
 * Set up Passport.js
 * @param passport {Passport} - A Passport.js instance.
 */

const auth = passport => {
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'passphrase',
    session: false
  },
  async (email, pass, done) => {
    const errmsg = 'Email/passphrase not found'
    try {
      const res = await axios.post(`${config.api.root}/members/auth`, { email, pass })
      return res.status === 200
        ? done(null, res.data)
        : done(null, false, errmsg)
    } catch {
      done(null, false, errmsg)
    }
  }))
}

module.exports = auth
