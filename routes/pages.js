const express = require('express')
const multer = require('multer')
const Diff = require('text-diff')
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
    const commands = ['/edit', '/history', '/compare', '/like', '/unlike', '/lock', '/unlock', '/hide', '/unhide']
    const path = req.originalUrl.indexOf('?') > -1
      ? req.originalUrl.substr(0, req.originalUrl.indexOf('?'))
      : req.originalUrl.match(/(.*?)\/rollback\/(\d*)/i)
        ? req.originalUrl.match(/(.*?)\/rollback\/(\d*)/i)[1]
        :req.originalUrl
    const lastElement = path.substr(path.lastIndexOf('/'))
    const isCommand = commands.includes(lastElement)
    const version = parseInt(lastElement.substr(1))
    const isVersion = !isNaN(version)
    const url = isCommand || isVersion
      ? req.originalUrl.substr(0, path.lastIndexOf('/'))
      : req.originalUrl
    const endpoint = isVersion ? `/pages${url}?version=${version}` : `/pages${url}`
    const resp = await callAPI('GET', endpoint, req.cookies.jwt)
    req.viewOpts.meta.title = resp.data.page.title
    req.viewOpts.page = resp.data.page
    req.viewOpts.markup = resp.data.markup

    if (isVersion) {
      const vids = resp.data.page.history.changes.map(change => change.id)
      const latest = vids[vids.length - 1]
      if (version !== latest) {
        const matching = resp.data.page.history.changes.filter(change => change.id === version)
        if (matching && Array.isArray(matching) && matching.length > 0) {
          req.viewOpts.page.version = matching[0]
        }
      }
    }

    next()
  } catch (err) {
    return res.status(404).render('errors/e404', req.viewOpts)
  }
}

/**
 * Returns the version from a page with a given ID.
 * @param changes {Object[]} - The array of the changes made to the page.
 * @param vstr {string} - The string representing the ID of the change you want
 *   to retrieve.
 * @returns {Object|null} - Either the change object with the matching ID, or
 *   `null` if no change could be found with that ID.
 */

const getPageVersion = (changes, vstr) => {
  const vint = parseInt(vstr)
  if (!isNaN(vint)) {
    const matching = changes.filter(change => change.id === vint)
    if (matching && Array.isArray(matching) && matching.length > 0) {
      return matching[0]
    }
  }
  return null
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

// GET */history
pages.get('*/history', getPage, checkMessages, async (req, res) => {
  res.render('page-history', req.viewOpts)
})

// GET */compare
pages.get('*/compare', getPage, checkMessages, async (req, res) => {
  const aid = Math.min(parseInt(req.query.a), parseInt(req.query.b))
  const bid = Math.max(parseInt(req.query.a), parseInt(req.query.b))
  const a = getPageVersion(req.viewOpts.page.history.changes, `${aid}`)
  const b = getPageVersion(req.viewOpts.page.history.changes, `${bid}`)
  const fields = {
    title: 'Title',
    path: 'Path',
    parent: 'Parent',
    body: 'Body',
    description: 'Description'
  }

  if (a && b) {
    const differ = new Diff()
    const keys = Object.keys(a.content)
    keys.forEach(key => {
      const fa = a.content[key] || ''
      const fb = b.content[key] || ''
      const diffs = differ.main(fa, fb)
      differ.cleanupSemantic(diffs)
      b.content[key] = differ.prettyHtml(diffs)
    })
    req.viewOpts.compare = { a, b, fields }
    res.render('page-compare', req.viewOpts)
  } else {
    res.redirect(req.viewOpts.page.path)
  }
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

// GET */lock
pages.get('*/lock', requireLoggedIn, getPage, checkMessages, async (req, res) => {
  try {
    await callAPI('PATCH', `/pages${req.viewOpts.page.path}/lock`, req.cookies.jwt, req.body)
    res.redirect(302, req.viewOpts.page.path)
  } catch (err) {
    res.redirect(302, '/dashboard')
  }
})

// GET */unlock
pages.get('*/unlock', requireLoggedIn, getPage, checkMessages, async (req, res) => {
  try {
    await callAPI('PATCH', `/pages${req.viewOpts.page.path}/unlock`, req.cookies.jwt, req.body)
    res.redirect(302, req.viewOpts.page.path)
  } catch (err) {
    res.redirect(302, '/dashboard')
  }
})

// GET */hide
pages.get('*/hide', requireLoggedIn, getPage, checkMessages, async (req, res) => {
  try {
    await callAPI('PATCH', `/pages${req.viewOpts.page.path}/hide`, req.cookies.jwt, req.body)
    res.redirect(302, req.viewOpts.page.path)
  } catch (err) {
    res.redirect(302, '/dashboard')
  }
})

// GET */unhide
pages.get('*/unhide', requireLoggedIn, getPage, checkMessages, async (req, res) => {
  try {
    await callAPI('PATCH', `/pages${req.viewOpts.page.path}/unhide`, req.cookies.jwt, req.body)
    res.redirect(302, req.viewOpts.page.path)
  } catch (err) {
    res.redirect(302, '/dashboard')
  }
})

// GET */like
pages.get('*/like', requireLoggedIn, getPage, checkMessages, async (req, res) => {
  try {
    await callAPI('GET', `/pages${req.viewOpts.page.path}/like`, req.cookies.jwt)
  } catch (err) {}
  res.redirect(302, req.viewOpts.page.path)
})

// GET */rollback/:id
pages.get('*/rollback/:id', requireLoggedIn, getPage, requirePageWriteAccess, async (req, res) => {
  try {
    const match = req.originalUrl.match(/(.*?)\/rollback\/(\d*)/i)
    const path = match && Array.isArray(match) && match.length > 1 ? match[1] : null
    if (path) {
      await callAPI('POST', `/pages${path}/rollback/${req.params.id}`, req.cookies.jwt, req.body)
      res.redirect(302, path)
    } else {
      res.redirect(302, req.originalUrl)
    }
  } catch (err) {
    res.redirect(302, '/dashboard')
  }
})

// GET *
pages.get('*', getPage, checkMessages, async (req, res) => {
  res.render('page', req.viewOpts)
})

// POST *
pages.post('*', requireLoggedIn, requirePageWriteAccess, useMulter, convertMulter, async (req, res) => {
  try {
    await callAPI('POST', `/pages${req.originalUrl}`, req.cookies.jwt, req.body)
    res.redirect(302, req.originalUrl)
  } catch (err) {
    res.redirect(302, `${req.originalUrl}/edit`)
  }
})

module.exports = pages
