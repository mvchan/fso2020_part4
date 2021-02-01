const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')

//all try-catch have been removed and implicitly called by express-async-errors to make code more readable
blogsRouter.get('/', async (request, response) => {
    //populate allows for "querying" by aggregating the documents from the other collection
    //this is tied to the schema definition with the usage of the ref option
    //by default, the entire document's fields will be returned unless specified
    const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
    response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
    if (!request.body.title && !request.body.url)
        return response.status(400).end()

    if (!request.body.likes)
        request.body.likes = 0

    const blog = new Blog(request.body)
    const savedBlog = await blog.save()

    const user = await User.findById(request.body.user)
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()

    response.json(savedBlog)
})

blogsRouter.get('/:id', async (request, response) => {
    const blog = await Blog.findById(request.params.id)
    if (blog) {
        response.json(blog)
    } else {
        response.status(404).end()
    }
})

blogsRouter.delete('/:id', async (request, response) => {
    await Blog.findByIdAndRemove(request.params.id)
    response.status(204).end()
})

blogsRouter.put('/:id', async (request, response) => {
    const body = new Blog(request.body)

    const blog = {
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes
    }
    //for update-related methods, validation is off by default and needs to be turned on through runValidators and context options
    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true, runValidators: true, context: 'query' })
    if (updatedBlog) {
        response.json(updatedBlog)
    } else {
        response.status(404).end()
    }
})

module.exports = blogsRouter