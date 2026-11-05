CREATE TABLE "subscriptions" (
	"user_id" text PRIMARY KEY NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"stripe_subscription_id" text,
	"status" text DEFAULT 'incomplete' NOT NULL,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Segunda trava, como em 0007_rls.sql, mas só de leitura: quem grava é o webhook, com o papel dono do banco.
GRANT SELECT ON subscriptions TO rumo_app;--> statement-breakpoint
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY dono ON subscriptions TO rumo_app
  USING (user_id = current_setting('app.user_id', true));
