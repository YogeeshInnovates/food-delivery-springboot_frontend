import { create } from 'zustand';
import { getCart } from '../api/cart';

const useCartStore = create((set, get) => ({
  count: 0,
  loading: false,
  cartRestaurantId: null,

  fetchCount: async () => {
    set({ loading: true });
    try {
      const res = await getCart();
      const items = res.data || [];
      const total = items.reduce((sum, i) => sum + i.quantity, 0);
      const restaurantId = items.length > 0 ? items[0].restaurantId : null;
      set({ count: total, cartRestaurantId: restaurantId });
      return items;
    } catch {
      set({ count: 0, cartRestaurantId: null });
      return [];
    } finally {
      set({ loading: false });
    }
  },

  incrementCount: (qty = 1) => set((state) => ({ count: state.count + qty })),

  setCount: (count) => set({ count }),

  setCartRestaurantId: (restaurantId) => set({ cartRestaurantId: restaurantId }),
}));

export default useCartStore;
