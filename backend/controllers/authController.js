import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const { hash, compare } = bcrypt;
const { sign } = jwt;

// User registration
const register = async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashed = await hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, hashed]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    res.status(400).json({ error: 'Email may already exist' });
  }
};

// User login
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    if (!user || !(await compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS in production
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};

// User logout
const logout = (req, res) => {
  res.clearCookie('token').json({ message: 'Logged out' });
};

// Get current user
const user = async (req, res) => {
  try {
    const result = await db.query('SELECT id, email FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


export { register, login, logout, user };