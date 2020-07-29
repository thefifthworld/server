const express = require('express')
const pages = express.Router()
const callAPI = require('../api')
const { checkMessages } = require('../auth')

// GET *
pages.get('*', checkMessages, async (req, res, next) => {
  try {
    const resp = await callAPI('GET', `/pages${req.originalUrl}`, req.cookies.jwt)
    req.viewOpts.meta.title = resp.data.page.title
    req.viewOpts.page = resp.data.page
    req.viewOpts.markup = resp.data.markup
    res.render('page', req.viewOpts)
  } catch (err) {
    next()
  }
})

module.exports = pages
