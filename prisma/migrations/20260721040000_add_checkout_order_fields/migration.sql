-- Add the Upay mobile banking option used by the checkout flow.
ALTER TYPE "PaymentMethod" ADD VALUE 'UPAY';

-- Store coupon information collected during checkout.
ALTER TABLE "Order" ADD COLUMN "couponCode" TEXT;

-- Preserve the exact cart option/price details submitted with each order.
ALTER TABLE "OrderItem" ADD COLUMN "productOptionId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "productOptionName" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "productOptionType" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "originalUnitPrice" INTEGER;

-- Store the merchant payment number shown to the customer at checkout.
ALTER TABLE "PaymentSubmission" ADD COLUMN "paymentNumber" TEXT;

CREATE INDEX "OrderItem_productOptionId_idx" ON "OrderItem"("productOptionId");