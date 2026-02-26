
-- Allow users to delete their own orders ONLY if status is 'criado' or 'aguardando_pagamento'
CREATE POLICY "Users can delete own unpaid orders"
  ON public.orders FOR DELETE
  USING (
    auth.uid() = user_id 
    AND status IN ('criado', 'aguardando_pagamento')
  );

-- Also allow deleting related order_items for unpaid orders
CREATE POLICY "Users can delete own unpaid order items"
  ON public.order_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
      AND orders.status IN ('criado', 'aguardando_pagamento')
    )
  );
