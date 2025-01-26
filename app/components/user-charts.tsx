"use client"


import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"

interface User {
  id: string;
  name: string;
}

interface FitnessEntry {
  id: string;
  userId: string;
  situps: number;
  pushups: number;
  timestamp: Timestamp;
}

interface TotalStats {
  totalEntriesToday: number;
  totalSitupsToday: number;
  totalPushupsToday: number;
  mostSitupsToday: { user: string; count: number };
  mostPushupsToday: { user: string; count: number };
}

export default function UserCharts() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [entriesMap, setEntriesMap] = useState<Record<string, FitnessEntry[]>>({});
  const [totals, setTotals] = useState<TotalStats>({
    totalEntriesToday: 0,
    totalSitupsToday: 0,
    totalPushupsToday: 0,
    mostSitupsToday: { user: "", count: 0 },
    mostPushupsToday: { user: "", count: 0 },
  });

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 95) {
            return prev + 7;
          } else {
            clearInterval(interval);
            return prev;
          }
        });
      }, 300);

      setTimeout(() => {
        setProgress(100);
        setIsLoading(false); 
      }, 3500);

      return () => clearInterval(interval);
    }
  }, [isLoading]);

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
      let totalEntries = 0;
      let totalSitups = 0;
      let totalPushups = 0;
      let mostSitups = { user: "", count: 0 };
      let mostPushups = { user: "", count: 0 };

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

        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const todayEntries = entriesList.filter((entry) => entry.timestamp.toDate() >= startOfDay);
        if (todayEntries.length > 0) totalEntries += 1;

        todayEntries.forEach((entry) => {
          totalSitups += entry.situps;
          totalPushups += entry.pushups;
          if (entry.situps > mostSitups.count) {
            mostSitups = { user: user.name, count: entry.situps };
          }
          if (entry.pushups > mostPushups.count) {
            mostPushups = { user: user.name, count: entry.pushups };
          }
        });
      }

      setEntriesMap(entries);
      setTotals({
        totalEntriesToday: totalEntries,
        totalSitupsToday: totalSitups,
        totalPushupsToday: totalPushups,
        mostSitupsToday: mostSitups,
        mostPushupsToday: mostPushups,
      });
    };

    if (users.length > 0) {
      fetchEntries();
    }
  }, [users]);

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
    <div className={`relative ${isLoading ? "overflow-hidden" : ""}`}>
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 bg-white bg-opacity-50 z-10 flex justify-center items-center">
          <div className="w-4/5 max-w-xs py-2">
            <Progress value={progress} max={100} className="w-full h-2 rounded-full bg-blue-200" />
          </div>
        </div>
      )}

      <div className={isLoading ? "blur-sm" : ""}>
        {/* Your main content goes here, this will be blurred during loading */}
        <div className="container mx-auto p-4">
          <div className="mt-2 flex justify-center space-x-2">
            <Card className="w-full max-w-xs p-1 shadow-lg rounded-xl border">
              <CardHeader className="text-center pt-1 pb-1">
                <CardTitle className="text-base font-semibold text-gray-800">
                  Total Entries Today
                </CardTitle>
              </CardHeader>
              <CardContent className="p-1">
                <div className="flex flex-col items-center space-y-1">
                  <p className="text-sm font-semibold text-blue-600">{totals.totalEntriesToday}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="w-full max-w-xs p-1 shadow-lg rounded-xl border">
              <CardHeader className="text-center pt-1 pb-1">
                <CardTitle className="text-base font-semibold text-gray-800">
                  Total Pushups Today
                </CardTitle>
              </CardHeader>
              <CardContent className="p-1">
                <div className="flex flex-col items-center space-y-1">
                  <p className="text-sm font-semibold text-blue-600">{totals.totalPushupsToday}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="w-full max-w-xs p-1 shadow-lg rounded-xl border">
              <CardHeader className="text-center pt-1 pb-1">
                <CardTitle className="text-base font-semibold text-gray-800">
                  Total Situps Today
                </CardTitle>
              </CardHeader>
              <CardContent className="p-1">
                <div className="flex flex-col items-center space-y-1">
                  <p className="text-sm font-semibold text-blue-600">{totals.totalSitupsToday}</p>
                </div>
              </CardContent>
            </Card>

            {/* Add the other two cards here */}
            <Card className="w-full max-w-xs p-1 shadow-lg rounded-xl border">
              <CardHeader className="text-center pt-1 pb-1">
                <CardTitle className="text-base font-semibold text-gray-800">
                  Most Pushups Today
                </CardTitle>
              </CardHeader>
              <CardContent className="p-1">
                <div className="flex flex-col items-center space-y-1">
                  <p className="text-sm font-semibold text-blue-600">
                    {totals.mostPushupsToday.user}: {totals.mostPushupsToday.count} reps
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="w-full max-w-xs p-1 shadow-lg rounded-xl border">
              <CardHeader className="text-center pt-1 pb-1">
                <CardTitle className="text-base font-semibold text-gray-800">
                  Most Situps Today
                </CardTitle>
              </CardHeader>
              <CardContent className="p-1">
                <div className="flex flex-col items-center space-y-1">
                  <p className="text-sm font-semibold text-blue-600">
                    {totals.mostSitupsToday.user}: {totals.mostSitupsToday.count} reps
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>


          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                              const [day, month] = value.split('/');
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
        </div>
      </div>
    </div>
  );
}