import { useEffect, useState } from "react";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("No token found. Please log in first.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:8080/users/", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.detail || "Failed to fetch users");
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err.message || "Unexpected error while fetching users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Users</h1>

      {loading && <p>Loading users...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <ul style={{ marginTop: "1rem" }}>
          {users.map((user) => (
            <li key={user.id}>
              {user.username} — {user.email}
            </li>
          ))}
          {users.length === 0 && <p>No users found.</p>}
        </ul>
      )}
    </div>
  );
}

