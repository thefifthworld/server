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
      return res.render('member-form', req.viewOpts)
    }
  }
  return next()
})

// POST /member
members.post('/member', requireLoggedIn, async (req, res) => {
  const { id } = req.body
  if (id) {
    const updates = JSON.parse(JSON.stringify(req.body))
    if (updates.email.length === 0) delete updates.email
    if (updates.password.length === 0) delete updates.password
    const opts = { headers: { Authorization: `Bearer ${req.cookies.jwt}` } }
    await axios.patch(`${config.api.root}/members/${id}`, updates, opts)
    return res.redirect(`/member/${id}`)
  }
})

// GET /dashboard
members.get('/dashboard', requireLoggedIn, async (req, res) => {
  const opts = { headers: { Authorization: `Bearer ${req.cookies.jwt}` } }
  const updates = await axios.get(`${config.api.root}/updates`, opts)
  req.viewOpts.updates = updates.data

  req.viewOpts.meta.title = 'Your Dashboard'
  req.viewOpts.discordCode = config.discord.code
  res.render('dashboard', req.viewOpts)
})

module.exports = members
