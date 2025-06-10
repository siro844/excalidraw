-- DropForeignKey
ALTER TABLE "chat" DROP CONSTRAINT "chat_roomId_fkey";

-- AddForeignKey
ALTER TABLE "chat" ADD CONSTRAINT "chat_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("roomId") ON DELETE RESTRICT ON UPDATE CASCADE;
