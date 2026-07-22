import { useState } from 'react';
import OSShell from './components/OSShell';
import OS2Shell from './components/OS2Shell';
import { companyData } from './data/structure';

function App() {
  const [mode, setMode] = useState<'os1' | 'os2'>('os1');

  if (mode === 'os2') {
    return <OS2Shell onExitOS2={() => setMode('os1')} />;
  }

  return <OSShell companyData={companyData} onEnterOS2={() => setMode('os2')} />;
}

export default App;
