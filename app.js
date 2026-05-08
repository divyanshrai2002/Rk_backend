const express = require('express')
const app = express()
const db = require('./db')
const formRouter = require('./router/form')
const loginRouter = require('./login')
const blog = require('./Blog')
require('dotenv').config();
const cors = require('cors')

app.use(express.json())
app.use(cors());

app.use('/api', formRouter)
app.use('/api/admin', loginRouter)
app.use('/api', blog)
app.get('/welcome', (req, res) => {
    res.send("Welcome Users")

})

app.listen('3003', () => { console.log("App is running on port 3003") })