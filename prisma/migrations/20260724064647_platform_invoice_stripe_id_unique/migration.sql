-- Note: no DropIndex / ALTER COLUMN searchVector statements here — Prisma's
-- diff engine doesn't understand the hand-added generated tsvector column
-- from 0001_init and proposes spurious drops against it every time.

-- CreateIndex
CREATE UNIQUE INDEX "platform_invoices_stripeInvoiceId_key" ON "platform_invoices"("stripeInvoiceId");
