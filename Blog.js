const express = require('express')
const db = require('./db')
const verifyToken = require('./middleware/authVerification')
const verifyApiKey = require('./middleware/apiKeyVerifiaton')
const router = express.Router();

router.post('/post-blog', verifyToken, async (req, res) => {

    try {
        const { topic, heading, content, conclusions } = req.body;


        if (!topic || !heading || !content || !conclusions) {
            return res.status(400).json({
                status: false,
                message: "Please provide topic, heading, content and conclusion"
            });
        }


        const updated = await db.query(
            'INSERT INTO blog (topic, heading, content, conclusions) VALUES (?, ?, ?, ?)',
            [topic, heading, content, conclusions]
        );

        if (!updated) {
            res.json
                ({
                    message: "Error in storing data"
                })
        }
        else {
            res.status(201).json({
                status: true,
                message: "Blog posted successfully"
            })
        }
    }
    catch (err) {
        res.status(500).json({
            status: false,
            message: "Server Error"
        })
    }
})
router.get('/single-blog/:id', verifyApiKey, async (req, res) => {

    try {

        const id = req.params.id;

        const blogData = await db.query(
            'SELECT * FROM blog WHERE id = ?',
            [id]
        );

        if (blogData[0].length === 0) {
            return res.status(404).json({
                status: false,
                message: "Blog not found"
            });
        }


        const commentsData = await db.query(
            'SELECT id, name, comment, created_at FROM comments WHERE blog_id = ? ORDER BY id DESC',
            [id]
        );
        t
        const blog = blogData[0][0];

        // attach comments
        blog.comments = commentsData[0];

        blog.comments_count = commentsData[0].length;

        res.status(200).json({
            status: true,
            data: blog
        });

    } catch (err) {

        res.status(500).json({
            status: false,
            message: "Server Error"
        });

    }

});


router.get('/get-blog', async (req, res) => {

    try {


        const blogsData = await db.query(
            'SELECT * FROM blog ORDER BY id DESC'
        );

        const blogs = blogsData[0];

        for (let blog of blogs) {

            const commentsData = await db.query(
                'SELECT id, name, comment, created_at FROM comments WHERE blog_id = ? ORDER BY id DESC',
                [blog.id]
            );

            blog.comments = commentsData[0];

            blog.comments_count = commentsData[0].length;
        }

        res.status(200).json({
            status: true,
            total: blogs.length,
            data: blogs
        });

    } catch (err) {

        res.status(500).json({
            status: false,
            message: "Server Error"
        });

    }

});
router.delete('/delete-post/:id', verifyToken, async (req, res) => {
    try {
        const id = req.params.id;

        if (!id) {
            return res.status(400).json({
                status: false,
                message: "Please provide id"
            });
        }

        const search = await db.query(
            'SELECT * FROM blog WHERE id = ?',
            [id]
        );

        if (search[0].length === 0) {
            return res.status(404).json({
                status: false,
                message: "Blog not found"
            });
        }

        const removed = await db.query(
            'DELETE FROM blog WHERE id = ?',
            [id]
        );

        res.status(200).json({
            status: true,
            message: "Blog deleted successfully",
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            message: "Server Error"
        })
    }

})

router.put('/update-blog/:id', verifyToken, async (req, res) => {
    try {

        const id = req.params.id;

        const { topic, heading, content, conclusions } = req.body;

        const search = await db.query(
            'SELECT * FROM blog WHERE id = ?',
            [id]
        );

        if (search[0].length === 0) {
            return res.status(404).json({
                status: false,
                message: "Blog not found"
            });
        }

        await db.query(
            'UPDATE blog SET topic=?, heading=?, content=?, conclusions=? WHERE id=?',
            [topic, heading, content, conclusions, id]
        );

        res.status(200).json({
            status: true,
            message: "Blog updated successfully"
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            message: "Server Error"
        });
    }
});

router.post('/add-comment/:blogId', verifyApiKey, async (req, res) => {

    try {

        const blogId = req.params.blogId;

        const { name, comment } = req.body;

        if (!comment) {
            return res.status(400).json({
                status: false,
                message: "Comment is required"
            });
        }

        const blog = await db.query(
            'SELECT * FROM blog WHERE id = ?',
            [blogId]
        );

        if (blog[0].length === 0) {
            return res.status(404).json({
                status: false,
                message: "Blog not found"
            });
        }

        await db.query(
            'INSERT INTO comments (blog_id, name, comment) VALUES (?, ?, ?)',
            [blogId, name, comment]
        );

        res.status(201).json({
            status: true,
            message: "Comment added successfully"
        });

    } catch (err) {

        res.status(500).json({
            status: false,
            message: "Server Error"
        });

    }

});

module.exports = router