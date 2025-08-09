    import { Router } from 'express';
    import db from '../db.js';
    import authMiddleware from '../middleware/authMiddleware.js';

    const router = Router();

    // Add an investment
    router.post('/', authMiddleware, async (req, res) => {
    try {
        const { date, symbol, company_name, quantity, purchase_price, current_price } = req.body;

        const result = await db.query(
        `INSERT INTO investments 
        (user_id, date, symbol, company_name, quantity, purchase_price, current_price) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *`,
        [req.user.id, date, symbol, company_name, quantity, purchase_price, current_price]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
    });

    // Get investments for logged-in user with calculations
    router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await db.query(
        `SELECT *,
        (quantity * purchase_price) AS purchase_value,
        (quantity * current_price) AS current_value,
        ((quantity * current_price) - (quantity * purchase_price)) AS gain_loss_value,
        CASE 
            WHEN quantity * purchase_price = 0 THEN 0
            ELSE (((quantity * current_price) - (quantity * purchase_price)) / (quantity * purchase_price) * 100)
        END AS gain_loss_percent
        FROM investments
        WHERE user_id = $1
        ORDER BY date DESC`,
        [req.user.id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
    });

    // Update current price for a specific investment
    router.put('/:id/price', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { current_price } = req.body;
        
        // Validate input
        if (!current_price || isNaN(current_price) || current_price < 0) {
        return res.status(400).json({ message: 'Valid current price is required' });
        }

        // Update the investment (make sure it belongs to the authenticated user)
        const result = await db.query(
        `UPDATE investments 
        SET current_price = $1
        WHERE id = $2 AND user_id = $3 
        RETURNING *`,
        [current_price, id, req.user.id]
        );

        if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Investment not found or access denied' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
    });

    // Delete an investment
    router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
        `DELETE FROM investments 
        WHERE id = $1 AND user_id = $2 
        RETURNING id`,
        [id, req.user.id]
        );

        if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Investment not found or access denied' });
        }

        res.json({ message: 'Investment deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
    });

    export default router;