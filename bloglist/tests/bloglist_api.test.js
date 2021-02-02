const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcrypt')
const User = require('../models/user')
const Blog = require('../models/blog')
const jwt = require('jsonwebtoken')

let TESTING_TOKEN = null

describe('blog-specific tests', () => {
    beforeEach(async () => {
        //generate auth token using one of the test users
        const allUsers = await helper.usersInDb()
        const testingUser = {
            username: allUsers[0].username,
            id: allUsers[0].id,
        }

        TESTING_TOKEN = jwt.sign(testingUser, process.env.SECRET)

        //clear out existing blogs and regenerate under the test user
        await Blog.deleteMany({})

        //Promise.all executes promises in parallel, so use for...of to guarantee execution order otherwise
        const blogObjects = helper.initialBlogs.map(blog => {
            blog.user = testingUser.id
            return new Blog(blog)
        })
        const promiseArray = blogObjects.map(blog => blog.save())
        await Promise.all(promiseArray)
    })

    test('all blogs are returned as json', async () => {
        await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const response = await api.get('/api/blogs')
        expect(response.body).toHaveLength(helper.initialBlogs.length)
    })

    test('unique identifier property is set to id (without underscore)', async () => {
        const response = await api.get('/api/blogs')
        expect(response.body[0].id).toBeDefined()
    })

    test('a valid blog request can be added', async () => {
        const newBlog = {
            title: 'test title',
            author: 'test author',
            url: 'test URL',
            likes: 0
        }

        await api
            .post('/api/blogs')
            .set('Authorization',`bearer ${TESTING_TOKEN}`)
            .send(newBlog)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

        const blogTitles = blogsAtEnd.map(b => b.title)
        expect(blogTitles).toContain('test title')
    })

    test('a valid blog request without likes property will be added with default of 0', async () => {
        const newBlog = {
            title: 'test title no likes',
            author: 'test author no likes',
            url: 'test URL no likes'
        }

        await api
            .post('/api/blogs')
            .set('Authorization',`bearer ${TESTING_TOKEN}`)
            .send(newBlog)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

        expect(blogsAtEnd.find(blog => blog.title === 'test title no likes').likes).toBe(0)
    })

    test('an invalid blog request (without title and URL) is not added', async () => {
        const newBlog = {
            author: true,
            likes: 111
        }

        await api
            .post('/api/blogs')
            .set('Authorization',`bearer ${TESTING_TOKEN}`)
            .send(newBlog)
            .expect(400)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    })

    test('a blog can be deleted', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]

        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .set('Authorization',`bearer ${TESTING_TOKEN}`)
            .expect(204)

        const blogsAtEnd = await helper.blogsInDb()

        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)

        const blogTitles = blogsAtEnd.map(b => b.title)
        expect(blogTitles).not.toContain(blogToDelete.title)
    })

    test('a blog cannot be deleted if no token is provided', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]

        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .expect(401)

        const blogsAtEnd = await helper.blogsInDb()

        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)

        const blogTitles = blogsAtEnd.map(b => b.title)
        expect(blogTitles).toContain(blogToDelete.title)
    })

    test('a blog post\'s likes can be updated', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToUpdate = blogsAtStart[0]

        const updatedBlog = {
            title: blogToUpdate.title,
            author: blogToUpdate.author,
            url: blogToUpdate.url,
            likes: blogToUpdate.likes + 1
        }

        await api
            .put(`/api/blogs/${blogToUpdate.id}`)
            .set('Authorization',`bearer ${TESTING_TOKEN}`)
            .send(updatedBlog)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd.find(blog => blog.id === blogToUpdate.id).likes).not.toBe(blogToUpdate.likes)
    })
})

describe('when there is initially one user in db', () => {
    beforeEach(async () => {
        await User.deleteMany({})

        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({ username: 'root', name: 'root', passwordHash })

        await user.save()
    })

    test('creation succeeds with a fresh username', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'mluukkai',
            name: 'Matti Luukkainen',
            password: 'salainen',
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

        const usernames = usersAtEnd.map(u => u.username)
        expect(usernames).toContain(newUser.username)
    })

    test('creation fails with proper statuscode and message if username already taken', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'root',
            name: 'Superuser',
            password: 'salainen',
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(406)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('username must be unique')

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })

    test('creation fails with proper statuscode and message if user and password are less than 3 characters', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'ab',
            name: 'ab',
            password: 'ab',
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(406)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('username and password must be at least 3 characters long')

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })
})

afterAll(() => {
    mongoose.connection.close()
})