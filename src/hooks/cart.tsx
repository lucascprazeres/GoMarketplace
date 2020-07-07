import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStoragedOnCart = await AsyncStorage.getItem(
        '@GoMarketplace:cart',
      );

      if (productsStoragedOnCart) {
        setProducts(JSON.parse(productsStoragedOnCart));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async (id: string) => {
      const selectedProductIndex = products.findIndex(prod => prod.id === id);

      const selectedProduct = products[selectedProductIndex];

      const updatedProduct = {
        ...selectedProduct,
        quantity: selectedProduct.quantity + 1,
      };

      const updatedProducts = products;

      updatedProducts[selectedProductIndex] = updatedProduct;

      setProducts([...updatedProducts]);

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async (id: string) => {
      const selectedProductIndex = products.findIndex(prod => prod.id === id);

      const selectedProduct = products[selectedProductIndex];

      const updatedProducts = [...products];

      if (!selectedProduct.quantity) {
        return;
      }

      if (selectedProduct.quantity > 1) {
        selectedProduct.quantity -= 1;

        updatedProducts[selectedProductIndex] = selectedProduct;
      } else {
        updatedProducts.splice(selectedProductIndex, 1);
      }

      setProducts(updatedProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const findProductOnCart = products.find(prod => prod.id === product.id);

      if (findProductOnCart) {
        increment(product.id);
        return;
      }

      const updatedProducts = products;

      updatedProducts.push({ ...product, quantity: 1 });

      setProducts([...updatedProducts]);

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(updatedProducts),
      );
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
