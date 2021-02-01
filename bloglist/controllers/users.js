const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.get('/', async (request, response) => {
    //populate allows for "querying" by aggregating the documents from the other collection
    //this is tied to the schema definition with the usage of the ref option
    //by default, the entire document's fields will be returned unless specified
    const users = await User.find({}).populate('blogs', { title: 1 })
    response.json(users)
})

usersRouter.post('/', async (request, response) => {
    const body = request.body

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)

    const user = new User({
        username: body.username,
        name: body.name,
        passwordHash,
    })

    const savedUser = await user.save()

    response.json(savedUser)
})

module.exports = usersRouter