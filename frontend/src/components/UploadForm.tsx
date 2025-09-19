import { useState } from "react";

interface UploadFormProps {
  onUpload: () => void;
}

const UploadForm = ({ onUpload }: UploadFormProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFiles = (selected: FileList | null) => {
    if (selected) {
      setFiles((prev) => [...prev, ...Array.from(selected)]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return alert("Please select at least one file!");

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        alert("Upload result:\n" + JSON.stringify(result, null, 2));
        setFiles([]);
        onUpload();
      } else {
        const text = await res.text();
        alert("Upload failed: " + text);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 mb-6"
    >
     
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-400 rounded-lg p-6 text-center cursor-pointer"
      >
        Drag & Drop files here or click below
      </div>

      <input
        type="file"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="border px-3 py-2 rounded"
      />

    
      {files.length > 0 && (
        <ul className="text-sm">
          {files.map((f, i) => (
            <li key={i}>{f.name}</li>
          ))}
        </ul>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>
    </form>
  );
};

export default UploadForm;
