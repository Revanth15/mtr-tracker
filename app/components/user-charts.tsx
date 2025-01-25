"use client"


import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface User {
  id: string
  name: string
}

interface FitnessEntry {
  id: string
  userId: string
  situps: number
  pushups: number
  timestamp: Timestamp
}

export default function UserCharts() {
  const [users, setUsers] = useState<User[]>([]);
  const [entriesMap, setEntriesMap] = useState<Record<string, FitnessEntry[]>>({});

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, "users");
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setUsers(userList);
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchEntries = async () => {
      const entries: Record<string, FitnessEntry[]> = {};

      for (const user of users) {
        const entriesQuery = query(
          collection(db, "users", user.id, "fitness_entries"),
          orderBy("timestamp", "desc")
        );
        const entriesSnapshot = await getDocs(entriesQuery);
        const entriesList = entriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FitnessEntry[];
        entries[user.id] = entriesList;
      }

      setEntriesMap(entries);
    };

    if (users.length > 0) {
      fetchEntries();
    }
  }, [users]);

  const chartData = useMemo(() => {
    return Object.keys(entriesMap).reduce((acc, userId) => {
      acc[userId] = entriesMap[userId]
        .map((entry) => ({
          date: entry.timestamp.toDate().toLocaleDateString(),
          situps: entry.situps,
          pushups: entry.pushups,
        }))
        .reverse();
      return acc;
    }, {} as Record<string, { date: string; situps: number; pushups: number }[]>);
  }, [entriesMap]);

  return (
    <div className="container mx-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((user) => (
        <Card key={user.id} className="w-full">
          <CardHeader>
            <CardTitle className="text-md">{user.name}'s Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData[user.id] && chartData[user.id].length > 0 ? (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData[user.id]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="situps" stroke="#8884d8" name="Situps" />
                    <Line type="monotone" dataKey="pushups" stroke="#82ca9d" name="Pushups" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-xs text-muted">No entries found for {user.name}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
