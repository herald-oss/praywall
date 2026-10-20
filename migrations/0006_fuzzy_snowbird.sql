-- Backfill before tightening constraints (defaults already prevented NULLs,
-- this only guards against rows written by hand).
UPDATE "prayers" SET "intercessor_count" = 0 WHERE "intercessor_count" IS NULL;--> statement-breakpoint
UPDATE "prayers" SET "goal_reached" = false WHERE "goal_reached" IS NULL;--> statement-breakpoint
ALTER TABLE "prayers" ALTER COLUMN "intercessor_count" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "prayers" ALTER COLUMN "goal_reached" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "intercessions_prayer_user_unique" ON "intercessions" USING btree ("prayer_id","user_id") WHERE "intercessions"."user_id" is not null;--> statement-breakpoint
CREATE INDEX "intercessions_visitor_created_idx" ON "intercessions" USING btree ("visitor_id","created_at");--> statement-breakpoint
CREATE INDEX "intercessions_user_id_idx" ON "intercessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "prayers_wall_idx" ON "prayers" USING btree ("intercessor_count","created_at" DESC NULLS LAST) WHERE "prayers"."archived_at" is null;--> statement-breakpoint
CREATE INDEX "prayers_user_id_idx" ON "prayers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "prayers_visitor_id_idx" ON "prayers" USING btree ("visitor_id");