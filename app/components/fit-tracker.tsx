"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { db } from "../firebase"
import { FaTrashAlt } from "react-icons/fa"
import { Calendar as CalendarIcon, TrendingUp, TrendingDown,Check, ChevronsUpDown, XIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
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
  const [userName, setUserName] = useState("John Doe");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [defaultComboBoxOpen, setDefaultComboBoxOpen] = useState(false)
  const [selectComboBoxOpen, setSelectComboBoxOpen] = useState(false)
  const [alertDialogOpen, setAlertDialogOpen] = useState(false)
  const [entryIdToDelete, setEntryIdToDelete] = useState<string | null>(null)

  const { toast } = useToast()

  const handleUserSelection = (userId: string) => {
    setSelectedUserId(userId);
    localStorage.setItem("selectedUserId", userId);
    // setIsDialogOpen(false);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, "users");
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      
      setUsers(userList);
      setDate(new Date());
  
      const savedUserId = localStorage.getItem("selectedUserId");
      if (savedUserId && userList.some(user => user.id === savedUserId)) {
        setSelectedUserId(savedUserId);
        const username  = userList.find((u) => u.id === savedUserId)?.name;
        if (username) {
          setUserName(username)
        }
      } else {
        setIsDialogOpen(true);
      }
    };
  
    fetchUsers();
  }, []);

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
    <div className="container mx-auto p-1">
      <div className="mt-2 flex space-x-4 justify-center">
        <Card className="w-full max-w-xs p-2 shadow-lg rounded-xl border">
          <CardHeader className="text-center pb-1">
            <CardTitle className="text-base font-semibold text-gray-800">
              Total Situps(7D)
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
              Total Pushups(7D)
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
            <div className="flex flex-col space-y-2">
              <Label htmlFor="user">Name</Label>
              <Popover open={selectComboBoxOpen} onOpenChange={setSelectComboBoxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={selectComboBoxOpen}
                    className=" justify-between"
                  >
                    {selectedUserId ? users.find((user) => user.id === selectedUserId)?.name: "Select a cadet"}
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-md p-0">
                  <Command>
                    <CommandInput placeholder="Search cadet..." className="h-9" />
                    <CommandList className="max-h-[250px]">
                      <CommandEmpty>No cadet found.</CommandEmpty>
                      <CommandGroup>
                        {users.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.name}
                            onSelect={() => {
                              setSelectedUserId(user.id);
                              setSelectComboBoxOpen(false);
                            }}
                          >
                            {user.name}
                            <Check className={user.id === selectedUserId ? "ml-auto opacity-100" : "ml-auto opacity-0"} />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
        </CardContent>
      </Card>
      {chartData.length > 0 && (
        <Card className="mt-2 w-full max-w-4xl mx-auto">
          <CardHeader className="p-2 sm:p-3 md:p-4">
            <CardTitle className="text-sm sm:text-base md:text-lg font-semibold">{users.find((u) => u.id === selectedUserId)?.name}&apos;s Progress</CardTitle>
          </CardHeader>
          <CardContent className="p-1 sm:p-2 md:p-3">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ChartContainer config={chartConfig}>
                  <LineChart
                    accessibilityLayer
                    data={chartData}
                    margin={{
                      top: 10,
                      right: 5,
                      bottom: 2,
                      left: -30,
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
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}


      <div className="space-y-4">
        <Card className="mt-2 w-full max-w-4xl mx-auto">
          <CardContent className="p-1 sm:p-2 md:p-3">
            {entries && entries.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold text-center">Date</TableHead>
                    <TableHead className="font-bold">Situps</TableHead>
                    <TableHead className="font-bold">Pushups</TableHead>
                    <TableHead className="font-bold"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="p-2 text-center">{entry.timestamp.toDate().toLocaleString()}</TableCell>
                      <TableCell className="p-2 text-center">{entry.situps}</TableCell>
                      <TableCell className="p-2 text-center">{entry.pushups}</TableCell>
                      <TableCell className="p-2 text-center">
                        <Button
                          onClick={() => {
                            setEntryIdToDelete(entry.id); 
                            setAlertDialogOpen(true);}}
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
          </CardContent>
        </Card>
      </div>
      <div className="fixed bottom-4 right-4 z-50 bg-gray-50 text-black text-[8px] p-1 rounded shadow-lg cursor-pointer" onClick={() => setIsDialogOpen(true)}>
        <span className="font-semibold">{userName}</span>
      </div>
      <Dialog open={isDialogOpen}>
        <DialogContent className="w-full max-w-[95%] sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle>Select Your Default User</DialogTitle>
            <DialogClose onClick={() => setIsDialogOpen(false)} className="absolute top-3 right-4 z-50 text-gray-600">
              <XIcon className="h-3 w-4" />
            </DialogClose>
          </DialogHeader>
          <div className="space-y-4">
            <Popover open={defaultComboBoxOpen} onOpenChange={setDefaultComboBoxOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={defaultComboBoxOpen} className="w-full justify-between">
                  {selectedUserId
                    ? users.find((user) => user.id === selectedUserId)?.name
                    : "Select a user..."}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-md p-0">
                <Command>
                  <CommandInput placeholder="Search user..." className="h-9" />
                  <CommandList className="max-h-[250px]">
                    <CommandEmpty>No user found.</CommandEmpty>
                    <CommandGroup>
                      {users.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={user.name}
                          onSelect={() => {
                            handleUserSelection(user.id)
                            setDefaultComboBoxOpen(false)
                          }}
                        >
                          {user.name}
                          <Check className={`ml-auto ${selectedUserId === user.id ? "opacity-100" : "opacity-0"}`} />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)} disabled={!selectedUserId}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={alertDialogOpen}>
        <AlertDialogContent className="w-full max-w-sm md:max-w-md rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              entry and remove the data!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setEntryIdToDelete(null);setAlertDialogOpen(false)}}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
            className="bg-red-600 hover:bg-red-500"
              onClick={() => {
                if (entryIdToDelete) {
                  handleDelete(entryIdToDelete)
                  setAlertDialogOpen(false)
                }
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

