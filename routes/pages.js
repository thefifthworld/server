const express = require('express')
const pages = express.Router()
const callAPI = require('../api')
const { checkMessages } = require('../auth')

/**
 * Express.js middleware that loads a requested page.
 * @param req {Object} - The Express.js request object.
 * @param res {Object} - The Express.js response object.
 * @param next {function} - The next function to be called.
 * @returns {Promise} - A Promise that resolves when the page has either been
 *   loaded from the API or a 404 response has been applied.
 */

const getPage = async (req, res, next) => {
  try {
    const commands = [ '/edit', '/history', '/compare', '/like', '/unlike' ]
    const url = commands.includes(req.originalUrl.substr(req.originalUrl.lastIndexOf('/')))
      ? req.originalUrl.substr(0, req.originalUrl.lastIndexOf('/'))
      : req.originalUrl
    const resp = await callAPI('GET', `/pages${url}`, req.cookies.jwt)
    req.viewOpts.meta.title = resp.data.page.title
    req.viewOpts.page = resp.data.page
    req.viewOpts.markup = resp.data.markup
    next()
  } catch (err) {
    return res.status(404).render('errors/e404', req.viewOpts)
  }
}

// GET *
pages.get('*', getPage, checkMessages, async (req, res, next) => {
  res.render('page', req.viewOpts)
})

module.exports = pages
