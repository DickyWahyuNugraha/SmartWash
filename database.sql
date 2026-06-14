-- ==========================================
-- PostgreSQL Database Creation & Seed Script
-- For: Smartwash DB
-- ==========================================

-- Clean up existing tables if needed (uncomment if you want a fresh start)
-- DROP TABLE IF EXISTS public.bathing_sessions CASCADE;
-- DROP TABLE IF EXISTS public.drying_sessions CASCADE;
-- DROP TABLE IF EXISTS public.monitoring CASCADE;
-- DROP TABLE IF EXISTS public.control CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;
-- DROP TABLE IF EXISTS public.dry_mode CASCADE;
-- DROP TABLE IF EXISTS public.status CASCADE;
-- DROP TABLE IF EXISTS public.timer CASCADE;

-- ------------------------------------------
-- 1. Table: users
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    email character varying(100) UNIQUE NOT NULL,
    password character varying(255) NOT NULL,
    cat_name character varying(100) NOT NULL,
    cat_type character varying(50),
    age integer,
    age_unit character varying(20),
    weight double precision,
    gender character varying(10) DEFAULT 'jantan'::character varying,
    fur_type character varying(20) DEFAULT 'short'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tipe_bulu integer DEFAULT 0
);

-- ------------------------------------------
-- 2. Table: bathing_sessions
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.bathing_sessions (
    id SERIAL PRIMARY KEY,
    user_id integer REFERENCES public.users(id) ON DELETE CASCADE,
    cat_name character varying(100),
    temperature double precision,
    status character varying(50) DEFAULT 'active'::character varying,
    start_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    end_time timestamp without time zone
);

-- ------------------------------------------
-- 3. Table: control
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.control (
    id SERIAL PRIMARY KEY,
    command character varying(50) DEFAULT 'idle'::character varying,
    tipe_bulu integer DEFAULT 0,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_id integer REFERENCES public.users(id) ON DELETE CASCADE,
    fur_type character varying(20) DEFAULT 'short'::character varying
);

-- ------------------------------------------
-- 4. Table: dry_mode
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.dry_mode (
    id SERIAL PRIMARY KEY,
    kipas integer,
    lampu integer
);

-- ------------------------------------------
-- 5. Table: drying_sessions
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.drying_sessions (
    id SERIAL PRIMARY KEY,
    user_id integer REFERENCES public.users(id) ON DELETE CASCADE,
    cat_name character varying(100),
    temperature double precision,
    status character varying(50) DEFAULT 'active'::character varying,
    start_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    end_time timestamp without time zone
);

-- ------------------------------------------
-- 6. Table: monitoring
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.monitoring (
    id SERIAL PRIMARY KEY,
    suhu_air double precision,
    suhu_ruangan double precision,
    berat_beban double precision,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_id integer REFERENCES public.users(id) ON DELETE CASCADE
);

-- ------------------------------------------
-- 7. Table: status
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.status (
    id SERIAL PRIMARY KEY,
    state character varying(50),
    system character varying(50),
    deteksi_bulu character varying(50),
    pompa1 character varying(10),
    pompa2 character varying(10),
    kipas character varying(10),
    lampu character varying(10),
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------
-- 8. Table: timer
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.timer (
    id SERIAL PRIMARY KEY,
    mode integer,
    pompa1 integer,
    pompa2 integer,
    pompa1_fase3 integer,
    kipas integer,
    lampu integer
);

-- ==========================================
-- DEFAULT SEED DATA INSERTS
-- ==========================================

-- Seed Dry Mode Default values
INSERT INTO public.dry_mode (id, kipas, lampu) 
VALUES (1, 30000, 30000)
ON CONFLICT (id) DO NOTHING;

-- Seed Default Status
INSERT INTO public.status (id, state, system, deteksi_bulu, pompa1, pompa2, kipas, lampu, updated_at) 
VALUES (1, 'IDLE', 'ready', 'Standby', 'off', 'off', 'off', 'off', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Seed Default Timers (Mode 1 & Mode 2 durations)
INSERT INTO public.timer (id, mode, pompa1, pompa2, pompa1_fase3, kipas, lampu) 
VALUES 
(1, 1, 5000, 5000, 5000, 15000, 15000),
(2, 2, 8000, 8000, 8000, 20000, 20000)
ON CONFLICT (id) DO NOTHING;

-- Seed Default Dummy User (Garry)
INSERT INTO public.users (id, email, password, cat_name, cat_type, age, age_unit, weight, fur_type, created_at, tipe_bulu)
VALUES (1, 'garry@example.com', 'password123', 'Garry', 'Persia', 10, 'months', 3.5, 'long', CURRENT_TIMESTAMP, 1)
ON CONFLICT (id) DO NOTHING;

-- Seed Default Control state
INSERT INTO public.control (id, command, tipe_bulu, updated_at, user_id, fur_type)
VALUES (1, 'idle', 0, CURRENT_TIMESTAMP, 1, 'short')
ON CONFLICT (id) DO NOTHING;

-- Synchronize sequence indexes after explicit ID insertions
SELECT setval('public.dry_mode_id_seq', COALESCE((SELECT MAX(id) FROM public.dry_mode), 1), true);
SELECT setval('public.status_id_seq', COALESCE((SELECT MAX(id) FROM public.status), 1), true);
SELECT setval('public.timer_id_seq', COALESCE((SELECT MAX(id) FROM public.timer), 1), true);
SELECT setval('public.users_id_seq', COALESCE((SELECT MAX(id) FROM public.users), 1), true);
SELECT setval('public.control_id_seq', COALESCE((SELECT MAX(id) FROM public.control), 1), true);