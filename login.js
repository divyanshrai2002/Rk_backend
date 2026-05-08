const express = require('express');
const router = express.Router();
const authVerification = require('./middleware/authVerification')
const db = require('./db');
const jwt = require('jsonwebtoken');
router.post('/login', async (req, res) => {


    const { email, password } = req.body;
    if (!email || !password) {
        return res
            .status(200)
            .json({ error: "All fields are required: email, password" });
    }


    try {

        const [results] = await db.query(
            'SELECT * FROM admin WHERE email = ? AND password = ?',
            [email, password]
        );

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = results[0];
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        const data = {
            id: user.id,
            email: user.email,
            name: user.name,
            profile: user.profile,
            token: token
        }
        return res.json({ message: 'Login successful', data });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Database error', details: err });
    }
});


module.exports = router;