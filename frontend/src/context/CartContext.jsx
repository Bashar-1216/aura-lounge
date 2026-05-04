import { createContext, useContext, useReducer, useCallback } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.findIndex(
        i => i.id === action.payload.id && i.customization === action.payload.customization
      );
      if (existing >= 0) {
        const items = [...state.items];
        items[existing].quantity += action.payload.quantity;
        return { ...state, items };
      }
      return { ...state, items: [...state.items, action.payload] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((_, i) => i !== action.payload) };
    case 'UPDATE_QTY': {
      const items = [...state.items];
      items[action.payload.index].quantity = Math.max(1, action.payload.quantity);
      return { ...state, items };
    }
    case 'CLEAR':
      return { ...state, items: [] };
    case 'SET_TABLE':
      return { ...state, tableId: action.payload };
    default:
      return state;
  }
};

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], tableId: null });

  const addItem = useCallback((item) => dispatch({ type: 'ADD_ITEM', payload: item }), []);
  const removeItem = useCallback((index) => dispatch({ type: 'REMOVE_ITEM', payload: index }), []);
  const updateQty = useCallback((index, quantity) => dispatch({ type: 'UPDATE_QTY', payload: { index, quantity } }), []);
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);
  const setTable = useCallback((id) => dispatch({ type: 'SET_TABLE', payload: id }), []);

  const totalPrice = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ ...state, totalPrice, totalItems, addItem, removeItem, updateQty, clearCart, setTable }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
