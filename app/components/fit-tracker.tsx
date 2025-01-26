"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { db } from "../firebase"
import { FaTrashAlt } from "react-icons/fa"
import { Calendar as CalendarIcon, TrendingUp, TrendingDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip as ToolTip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { collection, query, getDocs, addDoc, orderBy, Timestamp, deleteDoc, doc } from "firebase/firestore"

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

export default function FitTracker() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [situps, setSitups] = useState<string>("")
  const [pushups, setPushups] = useState<string>("")
  const [entries, setEntries] = useState<FitnessEntry[]>([])
  const [date, setDate] = useState<Date>()

  const setDefaultDate = () => {
    setDate(new Date());
  };

  const { toast } = useToast()

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, "users")
      const userSnapshot = await getDocs(usersCollection)
      const userList = userSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }))
      setUsers(userList)
    }

    fetchUsers()
  }, [])

  useEffect(() => {
    const fetchEntries = async () => {
      if (!selectedUserId) return

      const entriesQuery = query(
        collection(db, "users", selectedUserId, "fitness_entries"),
        orderBy("timestamp", "desc"),
      )

      const entriesSnapshot = await getDocs(entriesQuery)
      const entriesList = entriesSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as unknown as FitnessEntry,
      )

      setEntries(entriesList)
    }

    fetchEntries()
  }, [selectedUserId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedUserId && situps && pushups) {
      const newEntry: Omit<FitnessEntry, "id"> = {
        userId: selectedUserId,
        situps: Number.parseInt(situps),
        pushups: Number.parseInt(pushups),
        timestamp: date ? Timestamp.fromDate(date) : Timestamp.now(),
      }

      await addDoc(collection(db, "users", selectedUserId, "fitness_entries"), newEntry)

      // Refresh entries
      const entriesQuery = query(
        collection(db, "users", selectedUserId, "fitness_entries"),
        orderBy("timestamp", "desc"),
      )
      const entriesSnapshot = await getDocs(entriesQuery)
      const entriesList = entriesSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as unknown as FitnessEntry,
      )
      setEntries(entriesList)

      setSitups("")
      setPushups("")
      toast({
        duration: 2000,
        title: "MTR added!"
      })
      setDate(undefined)
    }
  }

  const chartData = useMemo(() => {
    return entries
      .map((entry) => ({
        date: entry.timestamp.toDate().toLocaleDateString(),
        situps: entry.situps,
        pushups: entry.pushups,
      }))
      .reverse()
  }, [entries])

  const handleDelete = async (entryId: string) => {
    try {
      const entryRef = doc(db, "users", selectedUserId, "fitness_entries", entryId)
      await deleteDoc(entryRef)
  
      // Refresh the entries list after deletion
      const entriesQuery = query(
        collection(db, "users", selectedUserId, "fitness_entries"),
        orderBy("timestamp", "desc"),
      )
      const entriesSnapshot = await getDocs(entriesQuery)
      const entriesList = entriesSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as unknown as FitnessEntry,
      )
      setEntries(entriesList)
      toast({
        duration: 2000,
        variant: "destructive",
        title: "MTR deleted!"
      })
    } catch (error) {
      console.error("Error deleting entry: ", error)
      toast({
        duration: 2000,
        variant: "destructive",
        title: "Error!",
        description: `Error deleting record: ${error}`
      })
    }
  }

  const totalsLast7Days = useMemo(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const fourteenDaysAgo = new Date(sevenDaysAgo);
    fourteenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
    const last7DaysTotals = { pushups: 0, situps: 0 };
  
    const prev7DaysTotals = { pushups: 0, situps: 0 };
  
    entries.forEach((entry) => {
      const entryDate = entry.timestamp.toDate();
  
      if (entryDate >= sevenDaysAgo && entryDate <= today) {
        last7DaysTotals.pushups += entry.pushups;
        last7DaysTotals.situps += entry.situps;
      } else if (entryDate >= fourteenDaysAgo && entryDate < sevenDaysAgo) {
        prev7DaysTotals.pushups += entry.pushups;
        prev7DaysTotals.situps += entry.situps;
      }
    });
  
    const calculatePercentageChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };
  
    const pushupsPercentageChange = calculatePercentageChange(
      last7DaysTotals.pushups,
      prev7DaysTotals.pushups
    );
  
    const situpsPercentageChange = calculatePercentageChange(
      last7DaysTotals.situps,
      prev7DaysTotals.situps
    );
  
    return {
      last7DaysTotals,
      prev7DaysTotals,
      pushupsPercentageChange,
      situpsPercentageChange,
    };
  }, [entries]);

  return (
    <div className="container mx-auto p-4">
      <div className="mt-2 flex space-x-4 justify-center">
        <Card className="w-full max-w-xs p-2 shadow-lg rounded-xl border">
          <CardHeader className="text-center pb-1">
            <CardTitle className="text-base font-semibold text-gray-800">
              Total Situps (7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="flex flex-col items-center space-y-1">
              <p className="text-xl font-bold text-blue-600">
                {totalsLast7Days.last7DaysTotals.situps}
              </p>
              <TooltipProvider>
                <ToolTip>
                  <TooltipTrigger>
                    <div className="flex items-center space-x-1 text-gray-500">
                      {totalsLast7Days.situpsPercentageChange >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <p
                        className={`text-xs font-medium ${
                          totalsLast7Days.situpsPercentageChange >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {totalsLast7Days.situpsPercentageChange.toFixed(2)}%
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {totalsLast7Days.last7DaysTotals.situps} reps vs{" "}
                      {totalsLast7Days.prev7DaysTotals.situps} reps
                    </p>
                  </TooltipContent>
                </ToolTip>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
        <Card className="w-full max-w-xs p-2 shadow-lg rounded-xl border">
          <CardHeader className="text-center pb-1">
            <CardTitle className="text-base font-semibold text-gray-800">
              Total Pushups (7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="flex flex-col items-center space-y-1">
              <p className="text-xl font-bold text-blue-600">
                {totalsLast7Days.last7DaysTotals.pushups}
              </p>
              <TooltipProvider>
                <ToolTip>
                  <TooltipTrigger>
                    <div className="flex items-center space-x-1 text-gray-500">
                      {totalsLast7Days.pushupsPercentageChange >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <p
                        className={`text-xs font-medium ${
                          totalsLast7Days.pushupsPercentageChange >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {totalsLast7Days.pushupsPercentageChange.toFixed(2)}%
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {totalsLast7Days.last7DaysTotals.pushups} reps vs{" "}
                      {totalsLast7Days.prev7DaysTotals.pushups} reps
                    </p>
                  </TooltipContent>
                </ToolTip>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-2 w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>AWG PLT1 MTR Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="user">Name</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId} onOpenChange={setDefaultDate} required>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Select a cadet" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] md:max-h-[300px] lg:max-h-[400px] max-w-[80vw]">
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="situps">Situps</Label>
              <Input
                id="situps"
                type="number"
                placeholder="Max number of situps (60s)"
                value={situps}
                onChange={(e) => setSitups(e.target.value)}
                min="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pushups">Pushups</Label>
              <Input
                id="pushups"
                type="number"
                placeholder="Max number of pushups (60s)"
                value={pushups}
                onChange={(e) => setPushups(e.target.value)}
                min="0"
                required
              />
            </div>
            <p className="text-sm">Date</p>
            <div className="space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full mt-0 justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    required
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button type="submit" className="w-full">
              Submit
            </Button>
          </form>

          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{users.find((u) => u.id === selectedUserId)?.name}&apos;s Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
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
              </CardContent>
            </Card>
          )}


          <div className="space-y-4">
            {entries && entries.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Situps</TableHead>
                    <TableHead>Pushups</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.situps}</TableCell>
                      <TableCell>{entry.pushups}</TableCell>
                      <TableCell>{entry.timestamp.toDate().toLocaleString()}</TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleDelete(entry.id)}
                          className="bg-white hover:bg-gray-50 text-red-600 hover:text-red-800"
                          aria-label="Delete Entry"
                        >
                          <FaTrashAlt />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center">
                <Badge variant="secondary">No entries found!</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

