ALTER TABLE "prayers" ADD COLUMN "client_request_id" text;--> statement-breakpoint
ALTER TABLE "prayers" ADD CONSTRAINT "prayers_client_request_id_unique" UNIQUE("client_request_id");