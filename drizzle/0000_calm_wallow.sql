CREATE TYPE "public"."result_visibility" AS ENUM('always', 'after_vote', 'after_close');--> statement-breakpoint
CREATE TABLE "date_options" (
	"id" text PRIMARY KEY NOT NULL,
	"meeting_id" text NOT NULL,
	"date" date NOT NULL,
	CONSTRAINT "date_options_meeting_id_date_unique" UNIQUE("meeting_id","date")
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(80) NOT NULL,
	"host" varchar(30) NOT NULL,
	"description" varchar(500),
	"location" varchar(100),
	"thumbnail_id" text,
	"is_anonymous" boolean NOT NULL,
	"allow_multiple" boolean NOT NULL,
	"result_visibility" "result_visibility" NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"closed_at" timestamp with time zone,
	"confirmed_option_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meetings_ends_after_starts" CHECK ("meetings"."ends_at" > "meetings"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "vote_selections" (
	"vote_id" text NOT NULL,
	"option_id" text NOT NULL,
	CONSTRAINT "vote_selections_vote_id_option_id_pk" PRIMARY KEY("vote_id","option_id")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" text PRIMARY KEY NOT NULL,
	"meeting_id" text NOT NULL,
	"voter_token" text NOT NULL,
	"name" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "votes_meeting_id_voter_token_unique" UNIQUE("meeting_id","voter_token"),
	CONSTRAINT "votes_meeting_id_name_unique" UNIQUE("meeting_id","name")
);
--> statement-breakpoint
ALTER TABLE "date_options" ADD CONSTRAINT "date_options_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_confirmed_option_id_date_options_id_fk" FOREIGN KEY ("confirmed_option_id") REFERENCES "public"."date_options"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_selections" ADD CONSTRAINT "vote_selections_vote_id_votes_id_fk" FOREIGN KEY ("vote_id") REFERENCES "public"."votes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_selections" ADD CONSTRAINT "vote_selections_option_id_date_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."date_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;