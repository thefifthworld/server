const express = require('express')
const multer = require('multer')
const callAPI = require('../api')
const { checkMessages, requireLoggedIn } = require('../auth')

const pages = express.Router()
const upload = multer()

/**
 * Convert a single file from Multer to the format accepted by our API.
 * @param src {Object} - The file object provided by Multer.
 * @returns {{data: *, size: *, name: *, mimetype: *, encoding: *}} - An object
 *   ready for our API.
 */

const convertMulterFile = src => {
  return {
    name: src.originalname,
    data: src.buffer,
    size: src.size,
    encoding: src.encoding,
    mimetype: src.mimetype
  }
}

/**
 * Express.js Middleware that converts `file` and `thumbnail` files from Multer
 * to the format required by our API.
 * @param req {Object} - The Express.js request object.
 * @param res {Object} - The Express.js response object.
 * @param next {function} - The next function to be called.
 */

const convertMulter = (req, res, next) => {
  const { files } = req
  if (files) {
    const file = files.file && files.file.length > 0 ? files.file[0] : false
    const thumbnail = files.thumbnail && files.thumbnail.length > 0 ? files.thumbnail[0] : false
    if (file || thumbnail) {
      req.body.files = {}
      if (file) req.body.files.file = convertMulterFile(file)
      if (thumbnail) req.body.files.thumbnail = convertMulterFile(thumbnail)
    }
  }
  next()
}

/**
 * Middleware to pass to pages that might upload a file and potentially
 * a thumbnail.
 */

const useMulter = upload.fields([ { name: 'file', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 } ])

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

/**
 * Express.js middleware that checks if the user has write permissions for the
 * loaded page.
 * @param req {Object} - The Express.js request object.
 * @param res {Object} - The Express.js response object.
 * @param next {function} - The next function to be called.
 * @returns {*} - If the user has write access to the loaded page, it returns
 *   with the next function. If not, it returns a 401 status. If a page has
 *   been loaded, it returns a 401 status with the page view. If not, it
 *   merely returns the status.
 */

const requirePageWriteAccess = (req, res, next) => {
  const { page } = req.viewOpts
  if (page && page.permissions && page.permissions.write) {
    return next()
  } else if (page) {
    return res.status(401).render('page', req.viewOpts)
  } else {
    return res.sendStatus(401)
  }
}

// GET /new
pages.get('/new', requireLoggedIn, checkMessages, async (req, res, next) => {
  req.viewOpts.action = '/new'
  req.viewOpts.meta.title = 'New Page'
  res.render('form', req.viewOpts)
})

// POST /new
pages.post('/new', requireLoggedIn, useMulter, convertMulter, async (req, res, next) => {
  try {
    const page = await callAPI('POST', `/pages`, req.cookies.jwt, req.body)
    res.redirect(302, page.data.path)
  } catch (err) {
    console.error(err)
    res.redirect(302, '/new')
  }
})

// GET /upload
pages.get('/upload', requireLoggedIn, checkMessages, async (req, res, next) => {
  req.viewOpts.action = '/new'
  req.viewOpts.meta.title = 'Upload a File'
  req.viewOpts.isUpload = true
  res.render('form', req.viewOpts)
})

// GET */edit
pages.get('*/edit', requireLoggedIn, getPage, requirePageWriteAccess, checkMessages, async (req, res) => {
  const { path, title, history } = req.viewOpts.page
  const mostRecentChange = history && history.changes && history.changes.length > 0
    ? history.changes[history.changes.length - 1]
    : false
  req.viewOpts.action = path
  req.viewOpts.meta.title = `Editing “${title}”`
  req.viewOpts.body = mostRecentChange && mostRecentChange.content ? mostRecentChange.content.body : false
  res.render('form', req.viewOpts)
})

// GET *
pages.get('*', getPage, checkMessages, async (req, res) => {
  res.render('page', req.viewOpts)
})

// POST *
pages.post('*', requireLoggedIn, useMulter, convertMulter, async (req, res) => {
  try {
    await callAPI('POST', `/pages${req.originalUrl}`, req.cookies.jwt, req.body)
    res.redirect(302, req.originalUrl)
  } catch (err) {
    res.redirect(302, `${req.originalUrl}/edit`)
  }
})

module.exports = pages
