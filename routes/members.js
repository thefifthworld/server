const axios = require('axios')
const express = require('express')
const members = express.Router()
const { requireLoggedIn } = require('../auth')
const config = require('../config')

// GET /welcome
members.get('/welcome', requireLoggedIn, async (req, res) => {
  req.viewOpts.welcome = true
  req.viewOpts.meta.title = 'Set Up Your Profile'
  res.render('member-form', req.viewOpts)
})

// GET /members/:id
members.get('/member/:id', async (req, res, next) => {
  const resp = await axios.get(`${config.api.root}/members/${req.params.id}`)
  if (resp && resp.status === 200) {
    req.viewOpts.profile = resp.data
    if (resp.data && resp.data.links) {
      const keys = Object.getOwnPropertyNames(resp.data.links)
      req.viewOpts.profile.showLinks = keys.reduce((acc, curr) => acc && resp.data.links[curr] && resp.data.links[curr].length > 0, true)
    }
    req.viewOpts.profile.canEdit = req.user && (req.user.id === resp.data.id || req.user.admin)
    return res.render('profile', req.viewOpts)
  }
  return next()
})

// GET /members/:id/edit
members.get('/member/:id/edit', async (req, res, next) => {
  if (req.user && (req.user === req.params.id || req.user.admin)) {
    const resp = await axios.get(`${config.api.root}/members/${req.params.id}`)
    if (resp && resp.status === 200) {
      req.viewOpts.profile = resp.data
      console.log(req.viewOpts)
      return res.render('member-form', req.viewOpts)
    }
  }
  return next()
})

module.exports = members
