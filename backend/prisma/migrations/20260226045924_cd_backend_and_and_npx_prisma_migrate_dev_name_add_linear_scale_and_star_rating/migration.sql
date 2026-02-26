/*
  Warnings:

  - The values [rating] on the enum `QuestionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "QuestionType_new" AS ENUM ('short_answer', 'long_answer', 'multiple_choice', 'multiple_choice_dropdown', 'page_break', 'text_block', 'linear_scale', 'star_rating');
ALTER TABLE "Question" ALTER COLUMN "type" TYPE "QuestionType_new" USING ("type"::text::"QuestionType_new");
ALTER TYPE "QuestionType" RENAME TO "QuestionType_old";
ALTER TYPE "QuestionType_new" RENAME TO "QuestionType";
DROP TYPE "public"."QuestionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "labelMax" TEXT,
ADD COLUMN     "labelMin" TEXT;
