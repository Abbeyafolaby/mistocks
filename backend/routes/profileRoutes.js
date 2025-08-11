    import { Router } from 'express';
    import bcrypt from 'bcrypt';
    import db from '../db.js';
    import authMiddleware from '../middleware/authMiddleware.js';

    const { hash, compare } = bcrypt;
    const router = Router();

    // Get user profile
    router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await db.query(
        'SELECT id, email, username, created_at FROM users WHERE id = $1',
        [req.user.id]
        );
        
        if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ message: 'Server error' });
    }
    });

    // Update username
    router.put('/username', authMiddleware, async (req, res) => {
    try {
        const { username } = req.body;

        // Validate username
        if (!username || username.length < 3 || username.length > 50) {
        return res.status(400).json({ 
            message: 'Username must be between 3 and 50 characters' 
        });
        }

        // Check if username is already taken by another user
        const existingUser = await db.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, req.user.id]
        );

        if (existingUser.rows.length > 0) {
        return res.status(400).json({ 
            message: 'Username is already taken' 
        });
        }

        // Update username
        const result = await db.query(
        'UPDATE users SET username = $1 WHERE id = $2 RETURNING id, email, username',
        [username, req.user.id]
        );

        res.json({
        message: 'Username updated successfully',
        user: result.rows[0]
        });
    } catch (err) {
        console.error('Update username error:', err);
        res.status(500).json({ message: 'Server error' });
    }
    });

    // Update email
    router.put('/email', authMiddleware, async (req, res) => {
    try {
        const { email, currentPassword } = req.body;

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ 
            message: 'Please provide a valid email address' 
        });
        }

        // Verify current password
        const user = await db.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
        const isPasswordValid = await compare(currentPassword, user.rows[0].password);
        
        if (!isPasswordValid) {
        return res.status(400).json({ 
            message: 'Current password is incorrect' 
        });
        }

        // Check if email is already taken
        const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, req.user.id]
        );

        if (existingUser.rows.length > 0) {
        return res.status(400).json({ 
            message: 'Email is already registered' 
        });
        }

        // Update email
        const result = await db.query(
        'UPDATE users SET email = $1 WHERE id = $2 RETURNING id, email, username',
        [email, req.user.id]
        );

        res.json({
        message: 'Email updated successfully',
        user: result.rows[0]
        });
    } catch (err) {
        console.error('Update email error:', err);
        res.status(500).json({ message: 'Server error' });
    }
    });

    // Change password
    router.put('/password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate new password
        if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ 
            message: 'New password must be at least 6 characters long' 
        });
        }

        // Get current password from database
        const user = await db.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
        
        // Verify current password
        const isPasswordValid = await compare(currentPassword, user.rows[0].password);
        if (!isPasswordValid) {
        return res.status(400).json({ 
            message: 'Current password is incorrect' 
        });
        }

        // Hash new password
        const hashedPassword = await hash(newPassword, 10);

        // Update password
        await db.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, req.user.id]
        );

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('Update password error:', err);
        res.status(500).json({ message: 'Server error' });
    }
    });

    // Get user statistics
    router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const stats = await db.query(`
        SELECT 
            COUNT(*) as total_investments,
            SUM(quantity * purchase_price) as total_invested,
            SUM(CASE WHEN current_price IS NOT NULL THEN quantity * current_price ELSE 0 END) as current_value,
            COUNT(CASE WHEN current_price IS NOT NULL THEN 1 END) as investments_with_price
        FROM investments 
        WHERE user_id = $1
        `, [req.user.id]);

        const topPerformers = await db.query(`
        SELECT 
            symbol,
            company_name,
            ((current_price - purchase_price) / purchase_price * 100) as performance_percent
        FROM investments 
        WHERE user_id = $1 AND current_price IS NOT NULL
        ORDER BY performance_percent DESC
        LIMIT 3
        `, [req.user.id]);

        res.json({
        ...stats.rows[0],
        top_performers: topPerformers.rows
        });
    } catch (err) {
        console.error('Get stats error:', err);
        res.status(500).json({ message: 'Server error' });
    }
    });

    export default router;