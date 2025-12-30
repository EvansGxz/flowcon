import { ThemeProvider } from './context/ThemeContext';
import FlowCanvas from './components/canvas/FlowCanvas';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <FlowCanvas />
      </div>
    </ThemeProvider>
  );
}

export default App;
