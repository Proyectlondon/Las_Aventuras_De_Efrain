const { Client } = require('pg');

const connectionString = "postgresql://postgres:EfrainProyect486*@db.qxaarvegcovglavrfoba.supabase.co:5432/postgres";

const sql = `
-- 1. Crear tabla de cuentos
CREATE TABLE IF NOT EXISTS stories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  word text NOT NULL,
  reference text,
  lesson text,
  verses text[],
  age_group text,
  language text DEFAULT 'es'
);

-- 2. Configurar Seguridad (RLS)
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- 3. Crear Políticas (usando DO blocks para evitar errores si ya existen)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir lectura pública') THEN
        CREATE POLICY "Permitir lectura pública" ON stories FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir inserción pública') THEN
        CREATE POLICY "Permitir inserción pública" ON stories FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir borrado público') THEN
        CREATE POLICY "Permitir borrado público" ON stories FOR DELETE USING (true);
    END IF;
END $$;
`;

async function setupDatabase() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Conectado a Supabase...");
    await client.query(sql);
    console.log("✅ Tabla y políticas creadas con éxito.");
  } catch (err) {
    console.error("❌ Error configurando la base de datos:", err);
  } finally {
    await client.end();
  }
}

setupDatabase();
