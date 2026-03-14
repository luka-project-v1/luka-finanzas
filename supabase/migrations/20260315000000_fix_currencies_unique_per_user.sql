-- Allow each user to have their own USD and COP (and other currencies).
-- The previous unique index on "code" alone prevented multiple users from having default currencies.
-- Fixes: "No se pudieron crear las divisas predeterminadas" when creating a new user.

DROP INDEX IF EXISTS "currencies_code_key";

CREATE UNIQUE INDEX "currencies_user_id_code_key" ON "currencies"("user_id", "code");
