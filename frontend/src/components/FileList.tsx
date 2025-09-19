import { useEffect, useState } from "react";

interface File {
  id: number;
  filename: string;
  filepath: string;
  size: number;
  uploaded_at: string;
  download_url: string;
}

const FileList = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<File[]>([]);
  const [view, setView] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchFiles = async () => {
    try {
      const res = await fetch("http://localhost:8080/files");
      if (res.ok) {
        const data = await res.json();
        setFiles(data || []);
      } else {
        console.error("Failed to fetch files");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    let temp = files;

    if (search.trim() !== "") {
      temp = temp.filter((f) =>
        f.filename.toLowerCase().includes(search.toLowerCase())
      );
    }

   
    if (filter !== "all") {
      temp = temp.filter((f) => {
        if (filter === "small") return f.size < 1024 * 1024; 
        if (filter === "medium")
          return f.size >= 1024 * 1024 && f.size < 10 * 1024 * 1024; 
        if (filter === "large") return f.size >= 10 * 1024 * 1024; 
        return true;
      });
    }

    setFilteredFiles(temp);
  }, [files, search, filter]);

  const deleteFile = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      const res = await fetch(`http://localhost:8080/delete?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) fetchFiles();
      else alert("Failed to delete file.");
    } catch (err) {
      console.error(err);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <h2 className="text-2xl font-semibold">Uploaded Files</h2>

    
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-1 rounded"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="all">All sizes</option>
            <option value="small">Small (&lt;1MB)</option>
            <option value="medium">Medium (1–10MB)</option>
            <option value="large">Large (&gt;=10MB)</option>
          </select>
        </div>

     
        <div>
          <button
            className={`px-3 py-1 border rounded-l ${
              view === "table" ? "bg-blue-500 text-white" : ""
            }`}
            onClick={() => setView("table")}
          >
            Table
          </button>
          <button
            className={`px-3 py-1 border rounded-r ${
              view === "grid" ? "bg-blue-500 text-white" : ""
            }`}
            onClick={() => setView("grid")}
          >
            Grid
          </button>
        </div>
      </div>

      {filteredFiles.length === 0 ? (
        <p>No files found.</p>
      ) : view === "table" ? (
        <table className="w-full table-auto border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">Filename</th>
              <th className="px-4 py-2 border">Size</th>
              <th className="px-4 py-2 border">Uploaded At</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.map((file) => (
              <tr key={file.id} className="text-center hover:bg-gray-50">
                <td className="px-4 py-2 border">{file.filename}</td>
                <td className="px-4 py-2 border">{formatSize(file.size)}</td>
                <td className="px-4 py-2 border">
                  {new Date(file.uploaded_at).toLocaleString()}
                </td>
                <td className="px-4 py-2 border flex justify-center gap-2">
                  <a
                    href={file.download_url}
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => deleteFile(file.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="border p-4 rounded shadow hover:shadow-lg"
            >
              <h3 className="font-semibold">{file.filename}</h3>
              <p className="text-sm text-gray-500">{formatSize(file.size)}</p>
              <p className="text-sm text-gray-400">
                {new Date(file.uploaded_at).toLocaleString()}
              </p>
              <div className="flex gap-2 mt-2">
                <a
                  href={file.download_url}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download
                </a>
                <button
                  onClick={() => deleteFile(file.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileList;
