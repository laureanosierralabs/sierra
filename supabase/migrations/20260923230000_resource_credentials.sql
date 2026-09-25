-- Credenciales de acceso por recurso.
-- La contraseña se guarda CIFRADA (AES-256-GCM); la clave vive fuera de la
-- base, en el entorno del servidor. Ver lib/landing/cifrado.ts.

alter table project_resources
  add column if not exists username text,
  add column if not exists secret_encrypted text;
