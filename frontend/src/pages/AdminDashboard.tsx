import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:8080/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: `{ totalStorageUsage uploadsPerUser { email uploads } }` }),
    })
      .then((res) => res.json())
      .then((data) => setStats(data.data));
  }, []);

  return (
    <div className="p-6 grid gap-6 grid-cols-1 md:grid-cols-2">
      <div className="bg-white shadow p-4 rounded">
        <h2 className="font-bold text-lg">Total Storage</h2>
        <p>{stats.totalStorageUsage} bytes</p>
      </div>

      <div className="bg-white shadow p-4 rounded">
        <h2 className="font-bold text-lg mb-2">Uploads per User</h2>
        <BarChart width={400} height={250} data={stats.uploadsPerUser || []}>
          <XAxis dataKey="email" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="uploads" fill="#8884d8" />
        </BarChart>
      </div>
    </div>
  );
};

export default AdminDashboard;
