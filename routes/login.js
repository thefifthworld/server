const express = require('express')
const login = express.Router()

// GET /login
login.get('/login', async (req, res) => {
  res.render('login')
})

module.exports = login
