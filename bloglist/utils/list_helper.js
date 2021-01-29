const dummy = (blogs) => {
    console.log(blogs.length)
    return 1
}

const totalLikes = (blogs) => (
    blogs.reduce((accumulator,currentValue) => accumulator + currentValue.likes, 0)
)

const favoriteBlog = (blogs) => {
    if (!blogs.length)
        return ''

    const maxLikes = Math.max(...blogs.map(blog => blog.likes))
    return blogs.find(blog => blog.likes === maxLikes)
}

const mostBlogs = (blogs) => {
    if (!blogs.length)
        return ''

    let hash = new Map()

    blogs.map(blog => {
        hash.set(blog.author, hash.has(blog.author) ? hash.get(blog.author) + 1 : 1)
    })

    //turn hash into iterable collection, spread, then convert to array in order to use reduce
    //use reduce function to go through Map entries (which turn into key-value array) and set accumulator to max value
    //cur[0] is the key, cur[1] is the value
    const mostBlogsEntry = [...hash.entries()].reduce((acc,cur) => cur[1] > acc[1] ? cur : acc)

    return ({
        author: mostBlogsEntry[0],
        blogs: mostBlogsEntry[1]
    })
}

const mostLikes = (blogs) => {
    if (!blogs.length)
        return ''

    let hash = new Map()

    blogs.map(blog => {
        hash.set(blog.author, hash.has(blog.author) ? hash.get(blog.author) + blog.likes : blog.likes)
    })

    //turn hash into iterable collection, spread, then convert to array in order to use reduce
    //use reduce function to go through Map entries (which turn into key-value array) and set accumulator to max value
    //[0] is the key, [1] is the value for each pair
    const mostLikesEntry = [...hash.entries()].reduce((acc,cur) => cur[1] > acc[1] ? cur : acc)

    return ({
        author: mostLikesEntry[0],
        likes: mostLikesEntry[1]
    })
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
}