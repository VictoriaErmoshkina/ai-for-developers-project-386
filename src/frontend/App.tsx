import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './index.css';
import GuestPage from '@/pages/GuestPage';
import HostPage from '@/pages/HostPage';
import CalendarPage from '@/pages/CalendarPage';

function App() {
    return (
        <BrowserRouter>
            <main className="p-6">
                <Routes>
                    <Route path="/" element={<GuestPage/>}/>
                    <Route path="/admin" element={<HostPage/>}/>
                    <Route path="/calendar/:eventTypeId" element={<CalendarPage/>}/>
                </Routes>
            </main>
        </BrowserRouter>
    );
}

createRoot(document.getElementById('root')!).render(<App />);
