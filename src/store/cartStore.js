import { create } from 'zustand';
import { getCart } from '../api/cart';

const useCartStore = create((set) => ({
  count: 0,
  loading: false,

  fetchCount: async () => {
    set({ loading: true });
    try {
      const res = await getCart();
      const items = res.data || [];
      const total = items.reduce((sum, i) => sum + i.quantity, 0);
      set({ count: total });
    } catch {
      set({ count: 0 });
    } finally {
      set({ loading: false });
    }
  },

  setCount: (count) => set({ count }),
}));

export default useCartStore;
