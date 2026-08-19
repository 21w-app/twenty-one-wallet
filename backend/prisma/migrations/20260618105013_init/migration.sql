-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('ios', 'android');

-- CreateTable
CREATE TABLE "ArkWallet" (
    "vtxo_script_hex" TEXT NOT NULL,
    "ark_static_address" TEXT NOT NULL,
    "last_funds_cursor" TEXT,
    "last_polled_at" TIMESTAMP(3),
    "last_vtxo_reminder_at" TIMESTAMP(3),
    "earliest_expires_at_seconds" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArkWallet_pkey" PRIMARY KEY ("vtxo_script_hex")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" UUID NOT NULL,
    "vtxo_script_hex" TEXT NOT NULL,
    "expo_push_token" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "app_version" TEXT,
    "native_build" TEXT,
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthChallenge" (
    "id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "expires_at_seconds" BIGINT NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Device_vtxo_script_hex_idx" ON "Device"("vtxo_script_hex");

-- CreateIndex
CREATE INDEX "Device_expo_push_token_idx" ON "Device"("expo_push_token");

-- CreateIndex
CREATE INDEX "AuthChallenge_expires_at_seconds_idx" ON "AuthChallenge"("expires_at_seconds");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_vtxo_script_hex_fkey" FOREIGN KEY ("vtxo_script_hex") REFERENCES "ArkWallet"("vtxo_script_hex") ON DELETE CASCADE ON UPDATE CASCADE;
