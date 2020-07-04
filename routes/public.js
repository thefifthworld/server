const express = require('express')
const public = express.Router()

// GET /
public.get('/', async (req, res) => {
  res.render('home')
})

module.exports = public
