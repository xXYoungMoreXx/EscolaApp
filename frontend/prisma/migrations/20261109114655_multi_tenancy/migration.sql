-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Guardian" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "schoolId" TEXT;

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_code_key" ON "School"("code");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: todo dado existente pertence à escola seed única.
INSERT INTO "School" ("id", "name", "code", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Escola Demo', 'ESCOLA-001', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE "User"      SET "schoolId" = (SELECT "id" FROM "School" WHERE "code" = 'ESCOLA-001') WHERE "role" != 'ADMIN';
UPDATE "Student"   SET "schoolId" = (SELECT "id" FROM "School" WHERE "code" = 'ESCOLA-001');
UPDATE "Teacher"   SET "schoolId" = (SELECT "id" FROM "School" WHERE "code" = 'ESCOLA-001');
UPDATE "Guardian"  SET "schoolId" = (SELECT "id" FROM "School" WHERE "code" = 'ESCOLA-001');
UPDATE "Subject"   SET "schoolId" = (SELECT "id" FROM "School" WHERE "code" = 'ESCOLA-001');
UPDATE "Class"     SET "schoolId" = (SELECT "id" FROM "School" WHERE "code" = 'ESCOLA-001');
-- ADMIN existente vira admin global (sem escola): mantém schoolId NULL.
