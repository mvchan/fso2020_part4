const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.get('/', async (request, response) => {
    //populate allows for "querying" by aggregating the documents from the other collection
    //this is tied to the schema definition with the usage of the ref option
    //by default, the entire document's fields will be returned unless specified
    const users = await User.find({}).populate('blogs', { url: 1, title: 1, author: 1 })
    response.json(users)
})

usersRouter.post('/', async (request, response) => {
    const body = request.body

    const userMatch = await User.findOne({ username: body.username })

    if (body.username.length < 3  || body.password.length < 3)
        return response.status(406).json({ error: 'username and password must be at least 3 characters long' })
    else if (userMatch)
        return response.status(406).json({ error: 'username must be unique' })

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)

    const user = new User({
        username: body.username,
        name: body.name,
        passwordHash
    })

    const savedUser = await user.save()

    response.json(savedUser)
})

module.exports = usersRouter