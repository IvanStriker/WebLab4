CREATE TYPE IF NOT EXISTS user_role AS ENUM ('ADMIN', 'USER');

CREATE TYPE IF NOT EXISTS country_list AS ENUM('Россия', 'Беларусь', 'Китай');

CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY CHECK (id > 0), name VARCHAR NOT NULL, group_name VARCHAR(5) NOT NULL CHECK(group_name ~ '^[A-Z][0-9]{4}$'), dormitory INTEGER CHECK (dormitory > 0), room INTEGER CHECK (room > 0), movein_date DATE, country country_list, notes VARCHAR(500));

CREATE TABLE IF NOT EXISTS users (id BIGSERIAL PRIMARY KEY, username VARCHAR(32) NOT NULL UNIQUE, email VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(60) NOT NULL, role user_role NOT NULL, created_at TIMESTAMP NOT NULL);

CREATE TABLE IF NOT EXISTS refresh_tokens (id BIGSERIAL PRIMARY KEY, token_id VARCHAR(36) NOT NULL UNIQUE, user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE, expires_at TIMESTAMP NOT NULL);
