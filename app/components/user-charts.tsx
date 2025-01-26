"use client"


import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

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

  const chartConfig = {
    situps: {
      label: "Situps",
      color: "hsl(174, 100%, 40%)",
    },
    pushups: {
      label: "Pushups",
      color: "hsl(210, 100%, 40%)",
    },
  } satisfies ChartConfig

  return (
    <div className="container mx-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((user) => (
        <Card key={user.id} className="w-full rounded-lg shadow-lg p-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{user.name}&apos;s Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData[user.id] && chartData[user.id].length > 0 ? (
              <div className="h-[200px] w-full">
                <ChartContainer config={chartConfig}>
                  <LineChart
                    accessibilityLayer
                    data={chartData[user.id]}
                    margin={{
                      top: 10,  
                      right: 10,
                      bottom: 10,
                      left: 2, 
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      tickFormatter={(value) => {
                        const [day, month, year] = value.split('/');
                        return `${day}/${month}`;
                      }}
                    />
                    <YAxis />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Line
                      dataKey="situps"
                      type="monotone"
                      stroke="hsl(174, 100%, 40%)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      dataKey="pushups"
                      type="monotone"
                      stroke="hsl(210, 100%, 40%)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <ChartLegend 
                      content={<ChartLegendContent />} 
                      wrapperStyle={{
                        paddingBottom: '5px', 
                        paddingTop: '0px', 
                        fontSize: '12px',
                      }}  
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="justify-center text-center">
                <Badge variant="secondary">No entries found!</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
