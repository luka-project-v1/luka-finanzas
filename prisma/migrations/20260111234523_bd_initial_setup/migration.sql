-- CreateEnum
CREATE TYPE "BalanceNature" AS ENUM ('ASSET', 'LIABILITY');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'POSTED', 'VOID');

-- CreateEnum
CREATE TYPE "TransactionKind" AS ENUM ('NORMAL', 'TRANSFER', 'ADJUSTMENT', 'FEE', 'INTEREST');

-- CreateEnum
CREATE TYPE "BankAccountKind" AS ENUM ('SAVINGS', 'CHECKING');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "balance_nature" "BalanceNature" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "institution_name" TEXT,
    "external_id" TEXT,
    "opened_at" DATE,
    "closed_at" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_account_details" (
    "account_id" TEXT NOT NULL,
    "kind" "BankAccountKind" NOT NULL,
    "bank_name" TEXT,
    "masked_number" TEXT,
    "interest_rate_annual" DECIMAL(8,5),
    "monthly_fee" DECIMAL(18,2),
    "overdraft_limit" DECIMAL(18,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_account_details_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "credit_card_details" (
    "account_id" TEXT NOT NULL,
    "issuer" TEXT,
    "bank_name" TEXT,
    "last4" VARCHAR(4),
    "credit_limit" DECIMAL(18,2) NOT NULL,
    "management_fee" DECIMAL(18,2),
    "management_fee_period" TEXT,
    "interest_rate_annual" DECIMAL(8,5),
    "interest_rate_monthly" DECIMAL(8,5),
    "billing_cycle_day" INTEGER,
    "payment_due_day" INTEGER,
    "last_statement_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_card_details_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "entered_balance" DECIMAL(18,2) NOT NULL,
    "calculated_balance_before" DECIMAL(18,2) NOT NULL,
    "delta" DECIMAL(18,2) NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "signed_amount" DECIMAL(18,2) NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'POSTED',
    "kind" "TransactionKind" NOT NULL DEFAULT 'NORMAL',
    "category_id" TEXT,
    "description" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "posted_at" TIMESTAMP(3),
    "transfer_id" TEXT,
    "reconciliation_id" TEXT,
    "balance_after" DECIMAL(18,2),
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "from_account_id" TEXT NOT NULL,
    "to_account_id" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "from_transaction_id" TEXT,
    "to_transaction_id" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'POSTED',
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_tags" (
    "transaction_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "transaction_tags_pkey" PRIMARY KEY ("transaction_id","tag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "account_types_code_key" ON "account_types"("code");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE INDEX "accounts_account_type_id_idx" ON "accounts"("account_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_user_id_name_key" ON "accounts"("user_id", "name");

-- CreateIndex
CREATE INDEX "categories_user_id_idx" ON "categories"("user_id");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_user_id_name_key" ON "categories"("user_id", "name");

-- CreateIndex
CREATE INDEX "reconciliations_account_id_occurred_at_idx" ON "reconciliations"("account_id", "occurred_at");

-- CreateIndex
CREATE INDEX "reconciliations_user_id_occurred_at_idx" ON "reconciliations"("user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "transactions_account_id_status_occurred_at_idx" ON "transactions"("account_id", "status", "occurred_at");

-- CreateIndex
CREATE INDEX "transactions_user_id_occurred_at_idx" ON "transactions"("user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "transactions_category_id_idx" ON "transactions"("category_id");

-- CreateIndex
CREATE INDEX "transactions_transfer_id_idx" ON "transactions"("transfer_id");

-- CreateIndex
CREATE INDEX "transactions_reconciliation_id_idx" ON "transactions"("reconciliation_id");

-- CreateIndex
CREATE UNIQUE INDEX "transfers_from_transaction_id_key" ON "transfers"("from_transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "transfers_to_transaction_id_key" ON "transfers"("to_transaction_id");

-- CreateIndex
CREATE INDEX "transfers_from_account_id_occurred_at_idx" ON "transfers"("from_account_id", "occurred_at");

-- CreateIndex
CREATE INDEX "transfers_to_account_id_occurred_at_idx" ON "transfers"("to_account_id", "occurred_at");

-- CreateIndex
CREATE INDEX "tags_user_id_idx" ON "tags"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_user_id_name_key" ON "tags"("user_id", "name");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_account_type_id_fkey" FOREIGN KEY ("account_type_id") REFERENCES "account_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_account_details" ADD CONSTRAINT "bank_account_details_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_card_details" ADD CONSTRAINT "credit_card_details_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_reconciliation_id_fkey" FOREIGN KEY ("reconciliation_id") REFERENCES "reconciliations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_account_id_fkey" FOREIGN KEY ("from_account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_account_id_fkey" FOREIGN KEY ("to_account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_transaction_id_fkey" FOREIGN KEY ("from_transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_transaction_id_fkey" FOREIGN KEY ("to_transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_tags" ADD CONSTRAINT "transaction_tags_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_tags" ADD CONSTRAINT "transaction_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
