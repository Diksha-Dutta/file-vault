// src/App.tsx
import Header from "./components/Header";
import UploadForm from "./components/UploadForm";
import FileList from "./components/FileList";
import { useState } from "react";

function App() {
  const [refresh, setRefresh] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto p-6">
        <UploadForm onUpload={() => setRefresh(!refresh)} />
        <FileList key={refresh ? 1 : 0} />
      </main>
    </div>
  );
}

export default App;
