    import { Router } from 'express';
    import db from '../db.js';
    import authMiddleware from '../middleware/authMiddleware.js';

    const { query } = db;
    const router = Router();

    // Add an investment
    router.post('/', authMiddleware, async (req, res) => {
    try {
        const { date, symbol, company_name, quantity, purchase_price, current_price } = req.body;

        const result = await query(
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
        const result = await query(
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

    export default router;
