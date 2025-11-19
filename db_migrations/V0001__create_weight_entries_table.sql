CREATE TABLE IF NOT EXISTS weight_entries (
    id SERIAL PRIMARY KEY,
    weight_kg DECIMAL(5,2) NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entry_date)
);

CREATE INDEX idx_entry_date ON weight_entries(entry_date DESC);