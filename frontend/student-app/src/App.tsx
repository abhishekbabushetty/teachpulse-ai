import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Join } from './Join';
import Meet from './Meet';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/join" element={<Join />} />
        <Route path="/meet/:sessionId" element={<Meet />} />
        <Route path="*" element={<Navigate to="/join" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
