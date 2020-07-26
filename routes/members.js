const express = require('express')
const members = express.Router()
const callAPI = require('../api')
const { requireLoggedIn } = require('../auth')
const config = require('../config')

// GET /welcome
members.get('/welcome', requireLoggedIn, async (req, res, next) => {
  const resp = await callAPI('GET', `/members/${req.user.id}`)
  if (resp && resp.status === 200) {
    req.viewOpts.profile = resp.data
    req.viewOpts.welcome = true
    req.viewOpts.meta.title = 'Set Up Your Profile'
    res.render('member-form', req.viewOpts)
  } else {
    next('Couldn\'t load profile of person on /welcome')
  }
})

// GET /members/:id
members.get('/member/:id', async (req, res, next) => {
  const resp = await callAPI('GET', `/members/${req.params.id}`)
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
    const resp = await callAPI('GET', `/members/${req.params.id}`)
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
    await callAPI('PATCH', `/members/${id}`, req.cookies.jwt, updates)
    return res.redirect(`/member/${id}`)
  }
})

// GET /dashboard
members.get('/dashboard', requireLoggedIn, async (req, res) => {
  const updates = await callAPI('GET', '/updates', req.cookies.jwt)
  req.viewOpts.updates = updates.data

  req.viewOpts.meta.title = 'Your Dashboard'
  req.viewOpts.discordCode = config.discord.code
  res.render('dashboard', req.viewOpts)
})

// GET /connect
members.get('/connect', requireLoggedIn, async (req, res) => {
  const providers = await callAPI('GET', '/members/providers', req.cookies.jwt)
  req.viewOpts.meta.title = 'Connect Other Login Services'
  req.viewOpts.providers = providers.data
  res.render('connect', req.viewOpts)
})

// GET /invite
members.get('/invite', requireLoggedIn, async (req, res) => {
  const invited = await callAPI('GET', '/members/invited', req.cookies.jwt)
  req.viewOpts.meta.title = 'Invitations'
  req.viewOpts.invited = invited.data
  req.viewOpts.invitations = req.user.admin ? 'Infinite' : req.user.invitations
  res.render('invite', req.viewOpts)
})

// POST /invite
members.post('/invite', requireLoggedIn, async (req, res) => {
  const emails = req.body.invitations.split('\n').map(email => email.trim())
  await callAPI('POST', '/invitations/send', req.cookies.jwt, { emails })
  res.redirect('/invite')
})

// GET /disconnect/:provider
members.get('/disconnect/:provider', requireLoggedIn, async (req, res) => {
  await callAPI('DELETE', `/members/providers/${req.params.provider}`, req.cookies.jwt)
  res.redirect('/connect')
})

module.exports = members
