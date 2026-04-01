ALTER TABLE "prayers" ALTER COLUMN "is_anonymous" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "prayers" ADD COLUMN "display_name" text;