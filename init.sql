-- Initialize database for Bitcoin Price Service
-- This script is run when the PostgreSQL container starts

-- Create the database if it doesn't exist (this is handled by POSTGRES_DB env var)
-- CREATE DATABASE IF NOT EXISTS bitcoin_price_db;

-- Connect to the database
\c bitcoin_price_db;

-- Create extension for UUID generation if needed in future
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create prices table (Sequelize will also create this, but good to have as backup)
CREATE TABLE IF NOT EXISTS prices (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    bid_price DECIMAL(20,8) NOT NULL,
    ask_price DECIMAL(20,8) NOT NULL,
    mid_price DECIMAL(20,8) NOT NULL,
    original_bid_price DECIMAL(20,8) NOT NULL,
    original_ask_price DECIMAL(20,8) NOT NULL,
    commission DECIMAL(5,4) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_prices_symbol_timestamp ON prices (symbol, timestamp);
CREATE INDEX IF NOT EXISTS idx_prices_timestamp ON prices (timestamp);
CREATE INDEX IF NOT EXISTS idx_prices_symbol_created_at ON prices (symbol, "createdAt");

-- Create a function to update the updatedAt column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updatedAt
CREATE TRIGGER update_prices_updated_at 
    BEFORE UPDATE ON prices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- INSERT INTO prices (symbol, bid_price, ask_price, mid_price, original_bid_price, original_ask_price, commission, timestamp)
-- VALUES ('BTCUSDT', 49950.00000000, 50150.10000000, 50050.05000000, 50000.00000000, 50100.00000000, 0.0001, CURRENT_TIMESTAMP);

-- Create user for the application (optional, if you want separate user)
-- CREATE USER bitcoin_price_user WITH PASSWORD 'bitcoin_price_password';
-- GRANT ALL PRIVILEGES ON DATABASE bitcoin_price_db TO bitcoin_price_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bitcoin_price_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bitcoin_price_user;