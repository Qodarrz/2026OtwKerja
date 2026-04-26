-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isKtpVerified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserDetail" ADD COLUMN     "ktpAddress" TEXT,
ADD COLUMN     "ktpBirthDate" TIMESTAMP(3),
ADD COLUMN     "ktpBirthPlace" TEXT,
ADD COLUMN     "ktpFullName" TEXT,
ADD COLUMN     "ktpGender" TEXT,
ADD COLUMN     "ktpImageUrl" TEXT,
ADD COLUMN     "nik" TEXT;
