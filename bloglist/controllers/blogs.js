const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

//all try-catch have been removed and implicitly called by express-async-errors to make code more readable
blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({})
    response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
    if (!request.body.title && !request.body.url)
        return response.status(400).end()

    if (!request.body.likes)
        request.body.likes = 0

    const blog = new Blog(request.body)

    const savedBlog = await blog.save()
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

module.exports = blogsRouter