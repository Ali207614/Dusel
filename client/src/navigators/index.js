import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Launch, Login, Home, Order, Invoice, Return, ReturnAdd } from '../screens';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Launch />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/order" element={<Order />} />

        <Route path="/invoice/:id" element={<Invoice />} />
        <Route path="/invoice/:id/draft" element={<Invoice />} />

        <Route path="/invoice/:id/total" element={<Invoice />} />
        <Route path="/invoice/:id/draft/total" element={<Invoice />} />

        <Route path="/order/:id" element={<Order />} />
        <Route path="/order/:id/draft" element={<Order />} />

        <Route path="/return" element={<Return />} />
        <Route path="/return-manage" element={<ReturnAdd />} />
        <Route path="/return-manage/:id" element={<ReturnAdd />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
