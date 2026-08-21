import React from 'react';
import ReactDOM from 'react-dom/client';
import ProductsPage from './pages/ProductsPage';
import './index.css';

ReactDOM.createRoot(document.getElementById('products-root')).render(
  <React.StrictMode>
    <ProductsPage />
  </React.StrictMode>
);
