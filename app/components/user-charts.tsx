"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react"; // Import React
import { db } from "../firebase";
import { collection, getDocs, query, orderBy, Timestamp, where, limit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";
import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
// Import Select components
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"; // Optional: for better accessibility


// --- Interfaces ---
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

interface ChartDataPoint {
    date: string;
    situps: number;
    pushups: number;
}

interface TotalStats {
    totalEntriesToday: number;
    totalSitupsToday: number;
    totalPushupsToday: number;
    mostSitupsToday: { user: string; count: number };
    mostPushupsToday: { user: string; count: number };
    usersWithoutEntriesToday: string[];
}

// --- Constants ---
// Define available duration options
const DURATION_OPTIONS = [30, 60, 90];
const DEFAULT_DURATION = 30; // Default selection

// --- Chart Config ---
const chartConfig = {
  situps: {
    label: "Situps",
    color: "hsl(174, 100%, 40%)",
  },
  pushups: {
    label: "Pushups",
    color: "hsl(210, 100%, 40%)",
  },
} satisfies ChartConfig;// Keep your existing chartConfig

// --- Helper Functions ---
const getStartOfDay = (date: Date): Date => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getDaysAgo = (days: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(0, 0, 0, 0); // Start of that day
    return date;
}

// --- Memoized User Chart Card ---
interface UserChartCardProps {
    user: User;
    data: ChartDataPoint[];
    config: ChartConfig;
    duration: number;
}

const UserChartCard = React.memo(({ user, data, config, duration }: UserChartCardProps) => {
    // console.log(`Rendering chart for ${user.name}`);
    return (
        <Card key={user.id} className="w-full rounded-lg shadow-lg p-2">
            <CardHeader className="p-2 sm:p-3 md:p-4">
                <CardTitle className="text-sm sm:text-base md:text-lg font-semibold">
                    {/* Update title to use duration prop */}
                    {user.name}&apos;s Progress ({duration} Days)
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-2 md:p-3">
                {data && data.length > 0 ? (
                     <div className="w-full h-[200px] sm:h-[250px]">
                        <ChartContainer config={config}>
                            {/* ... rest of the chart implementation ... */}
                             <LineChart
                                accessibilityLayer
                                data={data}
                                margin={{ top: 10, right: 5, bottom: 2, left: -30 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={6}
                                    fontSize={10}
                                    interval="preserveStartEnd"
                                />
                                <YAxis domain={['auto', 'auto']} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                                <Line
                                    dataKey="situps"
                                    type="monotone"
                                    stroke={config.situps.color}
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line
                                    dataKey="pushups"
                                    type="monotone"
                                    stroke={config.pushups.color}
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <ChartLegend
                                    content={<ChartLegendContent />}
                                    wrapperStyle={{
                                        paddingTop: '10px',
                                        fontSize: '12px',
                                    }}
                                />
                            </LineChart>
                        </ChartContainer>
                    </div>
                ) : (
                    <div className="flex justify-center items-center h-[200px] sm:h-[250px]">
                        <Badge variant="secondary">No entries found for this period!</Badge>
                    </div>
                )}
            </CardContent>
        </Card>
    );
});
UserChartCard.displayName = "UserChartCard";


// --- Main Component ---
export default function UserCharts() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [rawEntriesMap, setRawEntriesMap] = useState<Record<string, FitnessEntry[]>>({});
    // State for the selected chart duration
    const [selectedDuration, setSelectedDuration] = useState<number>(DEFAULT_DURATION);

    // Fetch Users (remains the same)
    useEffect(() => {
        const fetchUsers = async () => {
            // ... (keep existing user fetching logic)
             try {
                const usersCollection = collection(db, "users");
                const userSnapshot = await getDocs(usersCollection);
                const userList = userSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    name: doc.data().name as string,
                }));
                setUsers(userList);
            } catch (err) {
                console.error("Error fetching users:", err);
                setError("Failed to load user data.");
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, []);

    // Fetch Entries Concurrently - Now depends on selectedDuration
    useEffect(() => {
        if (users.length === 0) return;

        const fetchAllEntries = async () => {
            setIsLoading(true);
            setError(null);
            // Use selectedDuration here
            const startDate = getDaysAgo(selectedDuration);

            try {
                const entriesPromises = users.map(async (user) => {
                    const entriesQuery = query(
                        collection(db, "users", user.id, "fitness_entries"),
                        where("timestamp", ">=", Timestamp.fromDate(startDate)),
                        orderBy("timestamp", "asc")
                    );
                    const entriesSnapshot = await getDocs(entriesQuery);
                    const entriesList = entriesSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        userId: user.id,
                        timestamp: doc.data().timestamp as Timestamp,
                        situps: doc.data().situps as number,
                        pushups: doc.data().pushups as number,
                    }));
                    return { userId: user.id, entries: entriesList };
                });

                const results = await Promise.all(entriesPromises);

                const entriesMap: Record<string, FitnessEntry[]> = {};
                results.forEach(result => {
                    entriesMap[result.userId] = result.entries;
                });

                setRawEntriesMap(entriesMap);

            } catch (err) {
                console.error(`Error fetching fitness entries for ${selectedDuration} days:`, err);
                setError("Failed to load fitness data.");
                setRawEntriesMap({}); // Clear potentially stale data on error
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllEntries();
    // Add selectedDuration to dependency array
    }, [users, selectedDuration]);

    // Calculate Totals (remains mostly the same, depends on rawEntriesMap which changes with duration)
    const totals = useMemo<TotalStats>(() => {
       // ... (keep existing totals calculation logic)
        let totalSitups = 0;
        let totalPushups = 0;
        let mostSitups = { user: "N/A", count: 0 };
        let mostPushups = { user: "N/A", count: 0 };
        const usersWithEntriesToday = new Set<string>();

        const todayStart = getStartOfDay(new Date());
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);

        Object.entries(rawEntriesMap).forEach(([userId, entries]) => {
            const user = users.find(u => u.id === userId);
            if (!user) return;

            const todayEntries = entries.filter(entry => {
                const entryDate = entry.timestamp.toDate();
                return entryDate >= todayStart && entryDate < todayEnd;
            });

            if (todayEntries.length > 0) {
                usersWithEntriesToday.add(userId);
                todayEntries.forEach(entry => {
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
        });

        const usersWithoutEntriesToday = users
            .filter(user => !usersWithEntriesToday.has(user.id))
            .map(user => user.name);

        return {
            totalEntriesToday: usersWithEntriesToday.size,
            totalSitupsToday: totalSitups,
            totalPushupsToday: totalPushups,
            mostSitupsToday: mostSitups,
            mostPushupsToday: mostPushups,
            usersWithoutEntriesToday: usersWithoutEntriesToday,
        };
    }, [rawEntriesMap, users]);

    // Prepare Chart Data (remains the same, depends on rawEntriesMap)
    const chartData = useMemo<Record<string, ChartDataPoint[]>>(() => {
       // ... (keep existing chart data preparation logic)
        const formattedData: Record<string, ChartDataPoint[]> = {};
        const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit' });

        Object.entries(rawEntriesMap).forEach(([userId, entries]) => {
            formattedData[userId] = entries.map(entry => ({
                date: dateFormatter.format(entry.timestamp.toDate()),
                situps: entry.situps,
                pushups: entry.pushups,
            }));
        });
        return formattedData;
    }, [rawEntriesMap]);

    // Data for the top summary cards (remains the same)
    const cardData = useMemo(() => [
       // ... (keep existing card data logic)
        { title: "Total Entries Today", value: isLoading ? <Skeleton className="h-4 w-[50px]" /> : totals.totalEntriesToday },
        { title: "Total Pushups Today", value: isLoading ? <Skeleton className="h-4 w-[50px]" /> : totals.totalPushupsToday },
        { title: "Total Situps Today", value: isLoading ? <Skeleton className="h-4 w-[50px]" /> : totals.totalSitupsToday },
        { title: "Most Pushups Today", value: isLoading ? <Skeleton className="h-4 w-[120px]" /> : `${totals.mostPushupsToday.user}: ${totals.mostPushupsToday.count} reps` },
        { title: "Most Situps Today", value: isLoading ? <Skeleton className="h-4 w-[120px]" /> : `${totals.mostSitupsToday.user}: ${totals.mostSitupsToday.count} reps` },
    ], [totals, isLoading]);

    // Handler for dropdown change
    const handleDurationChange = (value: string) => {
        setSelectedDuration(Number(value));
    };

    return (
        <div>
            <div className="container mx-auto p-1">
                {/* Error Display */}
                {error && (
                    <Card className="mb-4 bg-destructive/10 border-destructive">
                       {/* ... (error display) ... */}
                    </Card>
                )}

                 {/* Add Duration Selector */}
                 <div className="mb-4 flex items-center space-x-2 justify-center sm:justify-start">
                    <Label htmlFor="duration-select" className="text-sm font-medium">Chart Range:</Label>
                    <Select
                        value={selectedDuration.toString()} // Select expects string value
                        onValueChange={handleDurationChange}

                    >
                        <SelectTrigger id="duration-select" className="w-[120px]">
                            <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                            {DURATION_OPTIONS.map(days => (
                                <SelectItem key={days} value={days.toString()}>
                                    {days} Days
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Summary Cards */}
                <ScrollArea className="w-full whitespace-nowrap rounded-xl border mb-4">
                   {/* ... (keep existing summary cards section) ... */}
                   <div className="flex justify-center space-x-2 p-2">
                        {cardData.map((card, index) => (
                           <Card key={index} className="w-full max-w-[200px] min-w-[150px] p-1 shadow-lg rounded-xl border flex-shrink-0">
                                <CardHeader className="text-center pt-1 pb-1">
                                    {card.title === "Total Entries Today" && !isLoading && totals.usersWithoutEntriesToday.length > 0 ? (
                                         <Popover>
                                            <PopoverTrigger asChild>
                                                <button className="text-xs sm:text-sm font-semibold text-gray-800 hover:text-blue-600">
                                                    {card.title}
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="p-2 ml-2 w-48 text-sm">
                                                <p className="font-semibold text-xs text-gray-700">Users without entries today:</p>
                                                <ul className="list-disc list-inside pl-1 text-gray-600 text-[10px]">
                                                    {totals.usersWithoutEntriesToday.map((user, i) => (
                                                        <li key={i}>{user}</li>
                                                    ))}
                                                </ul>
                                            </PopoverContent>
                                        </Popover>
                                    ) : (
                                        <CardTitle className="text-xs sm:text-sm font-semibold text-gray-800">
                                            {card.title}
                                        </CardTitle>
                                    )}
                                </CardHeader>
                                <CardContent className="p-1">
                                    <div className="flex flex-col items-center space-y-1">
                                        <p className="text-sm font-semibold text-blue-600">{card.value}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>

                {/* User Charts Grid */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {isLoading && Object.keys(rawEntriesMap).length === 0 ? ( // Show skeletons if loading initial data or switching duration
                        // Use users length if available, otherwise fallback to a default number
                        Array.from({ length: users.length > 0 ? users.length : 3 }).map((_, index) => (
                           <Card key={`skeleton-${index}`} className="w-full rounded-lg shadow-lg p-2">
                                <CardHeader className="p-2 sm:p-3 md:p-4">
                                     {/* Show user name if known during reload */}
                                     {users[index] ? (
                                         <CardTitle className="text-sm sm:text-base md:text-lg font-semibold">
                                            {users[index].name}&apos;s Progress ({selectedDuration} Days)
                                        </CardTitle>
                                     ) : (
                                         <Skeleton className="h-5 w-3/5 mb-2" />
                                     )}

                                </CardHeader>
                                <CardContent className="p-0 sm:p-2 md:p-3">
                                    <Skeleton className="h-[200px] sm:h-[250px] w-full" />
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        // Render actual cards
                        users.map((user) => (
                            <UserChartCard
                                key={user.id}
                                user={user}
                                data={chartData[user.id] || []}
                                config={chartConfig}
                                duration={selectedDuration} // Pass selectedDuration
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}