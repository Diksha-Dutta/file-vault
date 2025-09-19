// src/components/UploadForm.tsx
import { useState } from "react";

interface UploadFormProps {
  onUpload: () => void;
}

const UploadForm = ({ onUpload }: UploadFormProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Please select a file!");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("File uploaded successfully!");
        setFile(null);
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
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4 mb-6">
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="border px-3 py-2 rounded w-full sm:w-auto"
      />
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
