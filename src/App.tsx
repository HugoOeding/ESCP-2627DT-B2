import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<main className="mx-auto max-w-[480px] p-4" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
