import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SecurityShield } from "@/components/SecurityShield";
import AtacadoPage from "./pages/AtacadoPage";
import NotFound from "./pages/NotFound";

const App = () => (
  <>
    <SecurityShield />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AtacadoPage />} />
        <Route path="/atacado" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </>
);

export default App;
