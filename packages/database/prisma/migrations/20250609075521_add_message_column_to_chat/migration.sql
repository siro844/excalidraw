/*
  Warnings:

  - Added the required column `message` to the `chat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "chat" ADD COLUMN     "message" TEXT NOT NULL;
