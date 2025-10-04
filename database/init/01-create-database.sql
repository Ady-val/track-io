
CREATE DATABASE track_io;

\c track_io;

CREATE TABLE raw_signals (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_raw_signals_external_id ON raw_signals(external_id);
CREATE INDEX idx_raw_signals_created_at ON raw_signals(created_at);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_raw_signals_updated_at 
    BEFORE UPDATE ON raw_signals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
