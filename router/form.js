const express = require('express');
const router = express.Router();

const db = require('../db');
const XLSX = require('xlsx');
const fs = require('fs');

const upload = require('../middleware/multer');
const verifyToken = require('../middleware/authVerification');
const verifyApiKey = require('../middleware/apiKeyVerifiaton');

const { sendConfirmationOtp } = require('../services/mailer');

router.post('/contacts', async (req, res) => {

    try {

        const {
            fullname,
            email,
            phone,
            choose_option,
            message
        } = req.body;

        // Validation
        if (!fullname || !email) {
            return res.status(400).json({
                status: false,
                message: "Fullname and email are required"
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: false,
                message: "Invalid email format"
            });
        }

        // Check existing email
        const checkEmailSql =
            'SELECT id, otp, expiration FROM formdata WHERE email = ?';

        const [existingData] = await db.query(checkEmailSql, [email]);

        // Existing user
        if (existingData.length > 0) {

            const otp = Math.floor(100000 + Math.random() * 900000);

            const expiration =
                new Date(Date.now() + 10 * 60 * 1000);

            await db.query(
                'UPDATE formdata SET otp = ?, expiration = ? WHERE id = ?',
                [otp, expiration, existingData[0].id]
            );

            await sendConfirmationOtp(email, otp);

            return res.status(200).json({
                status: true,
                message: "OTP sent successfully",
                insertId: existingData[0].id
            });
        }

        // Insert new record
        const insertSql = `
            INSERT INTO formdata
            (fullname, email, phone, choose_option, message)
            VALUES (?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(insertSql, [
            fullname,
            email,
            phone,
            choose_option,
            message
        ]);

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000);

        const expiration =
            new Date(Date.now() + 10 * 60 * 1000);

        // Save OTP
        await db.query(
            'UPDATE formdata SET otp = ?, expiration = ? WHERE id = ?',
            [otp, expiration, result.insertId]
        );

        // Send OTP
        await sendConfirmationOtp(email, otp);

        return res.status(201).json({
            status: true,
            message: "OTP sent successfully",
            insertId: result.insertId
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            status: false,
            message: "Server error",
            error: error.message
        });
    }
});


router.post('/verify-otp', verifyApiKey, async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(200).json({ error: 'email , otp are required' });
    }
    const sql = 'SELECT * FROM formdata WHERE email = ? AND otp = ? AND expiration > NOW()';
    try {


        const [result] = await db.query(sql, [email, otp]);


        if (result.length === 0) {
            return res.status(400).json({ error: 'Invalid OTP or OTP expired' });
        }

        const storedOtp = result[0].otp;
        const expiration = new Date(result[0].expiration);



        if (String(otp) === String(storedOtp) && expiration.getTime() > new Date().getTime()) {
            const updateOtpSql = 'UPDATE formdata SET otp = NULL WHERE email = ?';
            await db.query(updateOtpSql, [email])
            res.json({ message: 'OTP verified successfully' });
        } else {
            res.status(400).json({ error: 'Incorrect OTP or OTP expired' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ─────────────────────────────────────────────
// GET /fetch-form-data
// Fetch all form data
// ─────────────────────────────────────────────
router.get('/fetch-form-data', verifyToken, async (req, res) => {

    try {

        const [data] = await db.query(
            'SELECT * FROM formdata ORDER BY id DESC'
        );

        return res.status(200).json({
            status: true,
            message: "Data fetched successfully",
            count: data.length,
            data
        });

    } catch (error) {

        return res.status(500).json({
            status: false,
            message: "Server error",
            error: error.message
        });
    }
});


// ─────────────────────────────────────────────
// PUT /update-form-data/:id
// Update form data
// ─────────────────────────────────────────────
router.put('/update-form-data/:id', verifyToken, async (req, res) => {

    try {

        const { id } = req.params;

        const {
            fullname,
            email,
            phone,
            choose_option,
            message
        } = req.body;
        const [existing] = await db.query(
            'SELECT * FROM formdata WHERE id = ?',
            [id]
        );

        if (!existing) {
            return res.status(404).json({
                status: false,
                message: "Record not found"
            });
        }

        await db.query(`UPDATE formdata SET fullname = ?,
        email = ?,
        phone = ?,
        choose_option = ?,
        message = ?
    WHERE id = ?
    `,
            [
                fullname,
                email,
                phone,
                choose_option,
                message,
                id
            ]
        );

        return res.status(200).json({
            status: true,
            message: "Data updated successfully"
        });

    } catch (error) {

        return res.status(500).json({
            status: false,
            message: "Server error",
            error: error.message
        });
    }
});


// ─────────────────────────────────────────────
// DELETE /delete-form-data/:id
// Delete form data
// ─────────────────────────────────────────────
router.delete('/delete-form-data/:id', verifyToken, async (req, res) => {

    try {

        const { id } = req.params;

        // Check existing record
        const [existing] = await db.query(
            'SELECT * FROM formdata WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                status: false,
                message: "Record not found"
            });
        }

        // Delete query
        await db.query(
            'DELETE FROM formdata WHERE id = ?',
            [id]
        );

        return res.status(200).json({
            status: true,
            message: "Data deleted successfully"
        });

    } catch (error) {

        return res.status(500).json({
            status: false,
            message: "Server error",
            error: error.message
        });
    }
});


router.post('/add-manual', verifyToken, async (req, res) => {

    try {

        const {
            fullname,
            email,
            phone,
            choose_option,
            message
        } = req.body;

        // Validation
        if (!fullname || !email) {
            return res.status(400).json({
                status: false,
                message: "Fullname and email are required"
            });
        }

        // Insert data
        const sql = `
    INSERT INTO formdata
    (fullname, email, phone, choose_option, message)
    VALUES (?, ?, ?, ?, ?)`;

        const [result] = await db.query(sql, [
            fullname,
            email,
            phone,
            choose_option,
            message
        ]);

        const insertId = result.insertId;
        return res.status(201).json({
            status: true,
            message: "Contact added successfully",
            insertId
        });

    } catch (error) {

        return res.status(500).json({
            status: false,
            message: "Server error",
            error: error.message
        });
    }
});



router.post(
    '/import-contacts',
    verifyToken,
    upload.single('file'),
    async (req, res) => {

        try {

            // Check file
            if (!req.file) {
                return res.status(400).json({
                    status: false,
                    message: "Please upload an Excel file"
                });
            }

            // Read Excel
            const workbook = XLSX.readFile(req.file.path);

            const sheetName = workbook.SheetNames[0];

            const data = XLSX.utils.sheet_to_json(
                workbook.Sheets[sheetName]
            );

            // Empty file check
            if (data.length === 0) {

                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(400).json({
                    status: false,
                    message: "Excel file is empty"
                });
            }

            // Prepare insert values
            const values = [];

            for (let row of data) {

                // Skip empty rows
                if (
                    !row.fullname &&
                    !row.email &&
                    !row.phone &&
                    !row.choose_option &&
                    !row.message
                ) {
                    continue;
                }

                values.push([
                    row.fullname || null,
                    row.email || null,
                    row.phone || null,
                    row.choose_option || null,
                    row.message || null
                ]);
            }

            // No valid data
            if (values.length === 0) {

                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(400).json({
                    status: false,
                    message: "No valid data found"
                });
            }

            // Insert into DB
            await db.query(
                `
                INSERT INTO formdata
                (fullname, email, phone, choose_option, message)
                VALUES ?
                `,
                [values]
            );

            // Delete uploaded file
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            return res.status(200).json({
                status: true,
                message: "Contacts imported successfully",
                totalInserted: values.length
            });

        } catch (error) {

            console.log(error);

            // Delete file on error
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            return res.status(500).json({
                status: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }
);

module.exports = router;