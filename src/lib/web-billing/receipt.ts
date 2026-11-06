import {z} from 'zod';
export const paymentReceiptSchema=z.object({
 orderId:z.string().uuid(),sessionId:z.string().startsWith('cs_').min(4),intentId:z.string().startsWith('pi_').min(4),
 amount:z.number().int().positive(),currency:z.literal('eur'),live:z.boolean(),refunded:z.boolean(),
});
