ALTER TABLE "ArkWallet" ADD COLUMN "signer_taproot_address" TEXT;

UPDATE "ArkWallet" SET "signer_taproot_address" = '' WHERE "signer_taproot_address" IS NULL;

ALTER TABLE "ArkWallet" ALTER COLUMN "signer_taproot_address" SET NOT NULL;
