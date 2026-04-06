-- Migration: Create loans table
-- Database: PostgreSQL
-- Created: 2026-04-06

-- Create enum for loan status if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loan_status') THEN
        CREATE TYPE loan_status AS ENUM ('ACTIVE', 'OUTSTANDING', 'APPROVED', 'DISBURSED');
    END IF;
END $$;

-- Create users table if it doesn't exist (required for foreign key)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    principal_amount NUMERIC(15, 2) NOT NULL,
    interest_rate NUMERIC(5, 2) NOT NULL,
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status loan_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional common fields for loan tracking
    outstanding_balance NUMERIC(15, 2) DEFAULT 0,
    monthly_payment NUMERIC(15, 2),
    term_months INTEGER,
    purpose VARCHAR(255),
    notes TEXT
);

-- Add CHECK constraint for interest rate reasonable bounds
ALTER TABLE loans 
ADD CONSTRAINT chk_interest_rate CHECK (interest_rate >= 0 AND interest_rate <= 100);

-- Add CHECK constraint for valid dates
ALTER TABLE loans 
ADD CONSTRAINT chk_dates CHECK (due_date > start_date);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date);

-- Comment for documentation
COMMENT ON TABLE loans IS 'Table storing loan records for the Self-Help Group application';
COMMENT ON COLUMN loans.principal_amount IS 'The original loan amount requested';
COMMENT ON COLUMN loans.interest_rate IS 'Annual interest rate as a percentage';
COMMENT ON COLUMN loans.status IS 'Current status of the loan: ACTIVE, OUTSTANDING, APPROVED, DISBURSED';

-- =====================================================
-- SEED DATA: Insert sample users and loans
-- =====================================================

-- First, ensure we have at least some users to reference
INSERT INTO users (id, username, email) VALUES
    (1, 'john_doe', 'john@example.com'),
    (2, 'jane_smith', 'jane@example.com'),
    (3, 'bob_wilson', 'bob@example.com'),
    (4, 'alice_johnson', 'alice@example.com'),
    (5, 'charlie_brown', 'charlie@example.com')
ON CONFLICT (id) DO NOTHING;

-- Seed loans with one record for each status

-- ACTIVE: Loan that is currently being repaid
INSERT INTO loans (
    id,
    user_id,
    principal_amount,
    interest_rate,
    start_date,
    due_date,
    status,
    outstanding_balance,
    monthly_payment,
    term_months,
    purpose
) VALUES 
(
    1,
    1,
    50000.00,
    12.00,
    '2026-01-15',
    '2027-01-15',
    'ACTIVE',
    45000.00,
    4500.00,
    12,
    'Business expansion'
);

-- OUTSTANDING: Loan with overdue payments
INSERT INTO loans (
    id,
    user_id,
    principal_amount,
    interest_rate,
    start_date,
    due_date,
    status,
    outstanding_balance,
    monthly_payment,
    term_months,
    purpose
) VALUES 
(
    2,
    2,
    75000.00,
    15.00,
    '2025-06-01',
    '2026-06-01',
    'OUTSTANDING',
    68000.00,
    6800.00,
    12,
    'Medical expenses'
);

-- APPROVED: Loan that has been approved but not yet disbursed
INSERT INTO loans (
    id,
    user_id,
    principal_amount,
    interest_rate,
    start_date,
    due_date,
    status,
    outstanding_balance,
    monthly_payment,
    term_months,
    purpose
) VALUES 
(
    3,
    3,
    100000.00,
    10.00,
    '2026-04-01',
    '2027-04-01',
    'APPROVED',
    0.00,
    9000.00,
    12,
    'Education fees'
);

-- DISBURSED: Loan that has been disbursed to the borrower
INSERT INTO loans (
    id,
    user_id,
    principal_amount,
    interest_rate,
    start_date,
    due_date,
    status,
    outstanding_balance,
    monthly_payment,
    term_months,
    purpose
) VALUES 
(
    4,
    4,
    25000.00,
    12.50,
    '2026-03-01',
    '2027-03-01',
    'DISBURSED',
    25000.00,
    2250.00,
    12,
    'Agricultural equipment'
);

-- Additional sample loans for testing

-- Another ACTIVE loan
INSERT INTO loans (
    user_id,
    principal_amount,
    interest_rate,
    start_date,
    due_date,
    status,
    outstanding_balance,
    monthly_payment,
    term_months,
    purpose
) VALUES 
(
    5,
    30000.00,
    11.00,
    '2026-02-15',
    '2027-02-15',
    'ACTIVE',
    28000.00,
    2600.00,
    12,
    'Home improvement'
);

-- Another DISBURSED loan
INSERT INTO loans (
    user_id,
    principal_amount,
    interest_rate,
    start_date,
    due_date,
    status,
    outstanding_balance,
    monthly_payment,
    term_months,
    purpose
) VALUES 
(
    2,
    60000.00,
    13.00,
    '2025-12-01',
    '2026-12-01',
    'DISBURSED',
    55000.00,
    5500.00,
    12,
    'Vehicle purchase'
);

-- =====================================================
-- VERIFICATION: Check the inserted data
-- =====================================================

-- Verify loans by status
-- SELECT status, COUNT(*), SUM(principal_amount) as total_principal 
-- FROM loans 
-- GROUP BY status 
-- ORDER BY status;

-- Select all loans with user details
-- SELECT 
--     l.id,
--     l.user_id,
--     u.username,
--     l.principal_amount,
--     l.interest_rate,
--     l.start_date,
--     l.due_date,
--     l.status,
--     l.outstanding_balance
-- FROM loans l
-- JOIN users u ON l.user_id = u.id
-- ORDER BY l.id;
