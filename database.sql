-- Create UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    username VARCHAR(50)
);

-- Create investments table
CREATE TABLE IF NOT EXISTS investments (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    purchase_price NUMERIC(12,2) NOT NULL CHECK (purchase_price >= 0),
    current_price NUMERIC(12,2) CHECK (current_price IS NULL OR current_price >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_symbol ON investments(symbol);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Optional: Prevent duplicate investments for same user, symbol, date
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_investments_user_symbol_date'
    ) THEN
        CREATE UNIQUE INDEX idx_investments_user_symbol_date
        ON investments(user_id, symbol, date);
    END IF;
END $$;
