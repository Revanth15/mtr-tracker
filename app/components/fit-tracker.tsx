"use client";

import React, { useState, useEffect, useMemo } from "react"; // Import React
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { db } from "../firebase";
import { FaTrashAlt } from "react-icons/fa";
import { Calendar as CalendarIcon, TrendingUp, TrendingDown, Check, ChevronsUpDown, XIcon } from "lucide-react"; // Added Clock
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
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
} from "@/components/ui/popover";
import {
    Tooltip as ToolTip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
// Import Tabs components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { toast, useToast } from "@/hooks/use-toast";
import { collection, query, getDocs, addDoc, orderBy, Timestamp, deleteDoc, doc } from "firebase/firestore";

// --- Interfaces ---
interface User {
    id: string;
    name: string;
}

// For Max Reps (Existing)
interface FitnessEntryMaxReps {
    id: string;
    type: 'maxReps'; // Add type identifier
    userId: string;
    situps: number;
    pushups: number;
    timestamp: Timestamp;
}

// For Timed Reps (New)
interface FitnessEntryTimed {
    id: string;
    type: 'timed'; // Add type identifier
    userId: string;
    situpTime: number; // Total seconds
    pushupTime: number; // Total seconds
    timestamp: Timestamp;
}

// Union type for entries state
type FitnessEntry = FitnessEntryMaxReps | FitnessEntryTimed;

// Training type selection
type TrainingType = 'maxReps' | 'timed';

// --- Helper Function ---
const formatSecondsToMMSS = (totalSeconds: number): string => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// const populateUsersIfEmpty = async () => {
//     const usersCollection = collection(db, "users01");
//     const snapshot = await getDocs(usersCollection);
  
//     // If there are already users, do nothing
//     if (!snapshot.empty) {
//       console.log("Users already exist in database. Skipping auto-populate.");
//       return;
//     }
  
//     console.log("No users found. Populating database with cadet list...");
  
//     const cadetNames = [
//       "1101 MUHAMMAD NUR SYAFIQ BIN SUWANDI",
//       "1102 MOHAMED SHAFIQ BIN MOHAMED ZAINI",
//       "1103 HENG JIAN AN",
//       "1104 RISHVIN NAIR VINOTH KUMAR",
//       "1105 LIM JIA PANG",
//       "1106 MUHAMMAD RIDHALFI BIN MUHAMMAD RIDUAN",
//       "1107 LOU JIA YING",
//       "1109 THINESKUMAR KRISHNAN",
//       "1110 AQIL ZUFAYRI BIN A RAMLI",
//       "1111 THEY SHUN HI",
//       "1112 NAING MIN HTET",
//       "1113 MUHAMMAD FATREES BIN MOHAMED SAMSOR",
//       "1114 ELIJAH ETHAN DAVID",
//       "1202 MUHAMMAD HAZIQ BIN MASWAN",
//       "1203 NGE YAO YONG",
//       "1204 SOLIHIN SHAH BIN ISA",
//       "1205 CALEB EDE",
//       "1207 MUHAMMAD HAZIQ BIN RAHIZAM",
//       "1208 QIU ZHIXIAN",
//       "1209 SRIRAM BALASUBRAMIANAN",
//       "1210 MOHAMED ANSAR MOHAMED ANWER ALI",
//       "1211 NABEEL NERGIZ",
//       "1212 YAP YONG QUAN",
//       "1213 CHIA XIN RONG",
//       "1214 ERIK LAU SHAO FENG",
//       "1302 THIRUNISHVAREN S/O THIRUMENI SIVANANTHAM",
//       "1304 AFI FAKRULLAH BIN MOHAMMAD",
//       "1305 MUHAMMAD RANIEL BIN SAIFUL AHMAD",
//       "1307 MUHAMMAD RYHAN BIN MASUNI",
//       "1309 MUHAMMAD SYAKIR NURHAZIQ BIN NURMAN",
//       "1310 JORDAN GOO YAO WEN",
//       "1312 LIU DONGYANG",
//       "1313 MOHAMAD RUZAINI RAYYAN BIN MOHAMAD RIDUWAN",
//       "1314 NG CHEN FONG",
//       "1401 DANIEL TEO AN YI",
//       "1402 SYED MOHAMED FADIL BIN SYED NASIR",
//       "1403 MOHD NUR HAKEEM BIN MOHAMED HISHAMADI",
//       "1404 NG XIN ZHI BECKHAM",
//       "1405 MUHAMMAD AFIQ BIN ABDULLAH",
//       "1406 ETHAN STEPHEN",
//       "1407 MUHAMMAD RAFIQUE DANIEL BIN ABDULLAH",
//       "1408 OOI WOEI YOU",
//       "1409 SAI KARTHIK KRISHNAMOORTHY",
//       "1410 MUHAMMAD ASTYAR BIN MUHAMMAD RAZI",
//       "1411 HARRISON LOW XUEJUN",
//       "1412 YAP HAN YANG",
//       "1413 MOHAMED DALVI KALIMULA MOHAMED HIBATULLAH",
//       "1414 NGERN JING YI , COEN"
//     ];
  
//     const batchPromises = cadetNames.map(name => 
//       addDoc(usersCollection, { 
//         name: name.trim(),
//         createdAt: Timestamp.now()
//       })
//     );
  
//     try {
//       await Promise.all(batchPromises);
//       toast({ 
//         title: "Success", 
//         description: `${cadetNames.length} cadets added to database!` 
//       });
//       console.log("All cadets successfully added!");
//     } catch (error) {
//       console.error("Error adding cadets:", error);
//       toast({ 
//         variant: "destructive", 
//         title: "Failed to populate users", 
//         description: "Check console for details." 
//       });
//     }
//   };


export default function FitTracker() {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [userName, setUserName] = useState("..."); // Default loading name

    // State for selected training type
    const [selectedTrainingType, setSelectedTrainingType] = useState<TrainingType>('maxReps');

    // State for Max Reps inputs
    const [situps, setSitups] = useState<string>("");
    const [pushups, setPushups] = useState<string>("");

    // State for Timed inputs (MM:SS)
    const [situpMinutes, setSitupMinutes] = useState<string>("");
    const [situpSeconds, setSitupSeconds] = useState<string>("");
    const [pushupMinutes, setPushupMinutes] = useState<string>("");
    const [pushupSeconds, setPushupSeconds] = useState<string>("");

    // State for entries (now holds union type)
    const [entries, setEntries] = useState<FitnessEntry[]>([]);
    const [date, setDate] = useState<Date>(new Date()); // Default to today
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Dialog/Popover states
    const [isUserSelectDialogOpen, setIsUserSelectDialogOpen] = useState<boolean>(false);
    const [defaultComboBoxOpen, setDefaultComboBoxOpen] = useState(false);
    const [selectComboBoxOpen, setSelectComboBoxOpen] = useState(false);
    const [alertDialogOpen, setAlertDialogOpen] = useState(false);
    const [entryIdToDelete, setEntryIdToDelete] = useState<string | null>(null);

    const { toast } = useToast();

    // useEffect(() => {
    //     populateUsersIfEmpty();
    // }, []);

    // --- User Handling ---
    const handleUserSelection = (userId: string) => {
        const selectedUser = users.find(u => u.id === userId);
        if (selectedUser) {
            setSelectedUserId(userId);
            setUserName(selectedUser.name);
            localStorage.setItem("selectedUserId", userId);
            localStorage.setItem("selectedUserName", selectedUser.name); // Store name too
        }
    };

    useEffect(() => {
        const fetchUsersAndSetInitial = async () => {
            try {
                const usersCollection = collection(db, "users01");
                const userSnapshot = await getDocs(usersCollection);
                const userList = userSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    name: doc.data().name as string,
                }));
                setUsers(userList);

                const savedUserId = localStorage.getItem("selectedUserId");
                const savedUserName = localStorage.getItem("selectedUserName");

                if (savedUserId && userList.some(user => user.id === savedUserId)) {
                    setSelectedUserId(savedUserId);
                    setUserName(savedUserName || userList.find(u => u.id === savedUserId)?.name || "User");
                } else if (userList.length > 0) {
                    // If no saved user, prompt selection, but only if users exist
                     setIsUserSelectDialogOpen(true);
                     setUserName("Select User"); // Prompt name
                } else {
                     setUserName("No Users"); // Handle case with no users in DB
                     setIsLoading(false); // Not loading if no users
                }
                // Don't set isLoading false here, wait for entries

            } catch (error) {
                 console.error("Error fetching users:", error);
                 toast({ variant: "destructive", title: "Error fetching users" });
                 setIsLoading(false);
            }
        };

        fetchUsersAndSetInitial();
    }, []); // Fetch users once on mount

    // --- Entry Fetching (depends on user and type) ---
    useEffect(() => {
        const fetchEntries = async () => {
            if (!selectedUserId) {
                 setEntries([]); // Clear entries if no user selected
                 setIsLoading(false);
                 return;
            }

            setIsLoading(true);
            const collectionName = selectedTrainingType === 'maxReps'
                ? "fitness_entries"
                : "fitness_entries_timed";

            try {
                const entriesQuery = query(
                    collection(db, "users01", selectedUserId, collectionName),
                    orderBy("timestamp", "desc")
                );

                const entriesSnapshot = await getDocs(entriesQuery);
                const entriesList = entriesSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    // Add the 'type' identifier when fetching
                    return {
                        id: doc.id,
                        type: selectedTrainingType, // Assign based on current selection
                        ...data,
                    } as FitnessEntry; // Assert as the union type
                });
                setEntries(entriesList);
            } catch (error) {
                console.error("Error fetching entries:", error);
                toast({ variant: "destructive", title: `Error fetching ${collectionName}` });
                setEntries([]); // Clear entries on error
            } finally {
                setIsLoading(false);
            }
        };

        // Fetch entries immediately if user is already selected,
        // otherwise it will fetch when user/type changes.
        if(selectedUserId) {
            fetchEntries();
        } else {
            setIsLoading(false); // Not loading if no user selected yet
        }

    }, [selectedUserId, selectedTrainingType, toast]); // Re-fetch when user OR type changes

    // --- Form Submission ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId) {
            toast({ variant: "destructive", title: "Please select a user first." });
            return;
        }
        if (!date) {
             toast({ variant: "destructive", title: "Please select a date." });
            return;
        }

        const submissionTimestamp = Timestamp.fromDate(date);
        let success = false;

        try {
             setIsLoading(true); // Indicate activity during submission

             if (selectedTrainingType === 'maxReps') {
                if (situps && pushups && !isNaN(parseInt(situps)) && !isNaN(parseInt(pushups))) {
                    const newEntry: Omit<FitnessEntryMaxReps, "id" | "type"> = {
                        userId: selectedUserId,
                        situps: parseInt(situps),
                        pushups: parseInt(pushups),
                        timestamp: submissionTimestamp,
                    };
                    await addDoc(collection(db, "users01", selectedUserId, "fitness_entries"), newEntry);
                    setSitups("");
                    setPushups("");
                    success = true;
                } else {
                    toast({ variant: "destructive", title: "Invalid input for Max Reps." });
                }
            } else { // 'timed'
                 const sitM = parseInt(situpMinutes);
                 const sitS = parseInt(situpSeconds);
                 const pushM = parseInt(pushupMinutes);
                 const pushS = parseInt(pushupSeconds);

                 // Basic Validation
                 if (!isNaN(sitM) && !isNaN(sitS) && sitS >= 0 && sitS < 60 && sitM >= 0 &&
                     !isNaN(pushM) && !isNaN(pushS) && pushS >= 0 && pushS < 60 && pushM >= 0)
                 {
                    const situpTotalSeconds = sitM * 60 + sitS;
                    const pushupTotalSeconds = pushM * 60 + pushS;

                    const newEntry: Omit<FitnessEntryTimed, "id" | "type"> = {
                        userId: selectedUserId,
                        situpTime: situpTotalSeconds,
                        pushupTime: pushupTotalSeconds,
                        timestamp: submissionTimestamp,
                    };
                    await addDoc(collection(db, "users01", selectedUserId, "fitness_entries_timed"), newEntry);
                    setSitupMinutes("");
                    setSitupSeconds("");
                    setPushupMinutes("");
                    setPushupSeconds("");
                    success = true;
                 } else {
                      toast({ variant: "destructive", title: "Invalid input for Timed Reps.", description: "Ensure minutes are >= 0 and seconds are between 0-59." });
                 }
            }

            if (success) {
                 // Manually add the new entry to the start of the list for immediate UI update
                 // Note: This assumes the structure matches perfectly and might drift if fetches fail later
                 // A full refetch is safer but slower UX. Choose based on preference.
                // --- Start Refetch Logic ---
                const collectionName = selectedTrainingType === 'maxReps' ? "fitness_entries" : "fitness_entries_timed";
                const entriesQuery = query(
                    collection(db, "users01", selectedUserId, collectionName),
                    orderBy("timestamp", "desc")
                );
                 const entriesSnapshot = await getDocs(entriesQuery);
                 const entriesList = entriesSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    type: selectedTrainingType,
                    ...doc.data(),
                 }) as FitnessEntry);
                 setEntries(entriesList);
                 // --- End Refetch Logic ---

                toast({ duration: 2000, title: "Entry added!" });
                setDate(new Date()); // Reset date picker to today
            }
        } catch (error) {
             console.error("Error submitting entry:", error);
             toast({ variant: "destructive", title: "Submission Error", description: `${error}` });
        } finally {
             setIsLoading(false);
        }
    };

    // --- Deletion ---
    const handleDelete = async (entryId: string) => {
        if (!selectedUserId || !entryId) return;

        // Determine collection based on the *currently selected type*
        // This assumes the table only shows entries of the selected type
        const collectionName = selectedTrainingType === 'maxReps'
            ? "fitness_entries"
            : "fitness_entries_timed";

        try {
            setIsLoading(true);
            const entryRef = doc(db, "users01", selectedUserId, collectionName, entryId);
            await deleteDoc(entryRef);

            // Remove locally for instant feedback
            setEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));

            toast({ duration: 2000, variant: "destructive", title: "Entry deleted!" });
        } catch (error) {
            console.error("Error deleting entry: ", error);
            toast({ duration: 2000, variant: "destructive", title: "Error!", description: `Error deleting record: ${error}` });
             // Refetch on error to ensure consistency
            const entriesQuery = query(collection(db, "users01", selectedUserId, collectionName), orderBy("timestamp", "desc"));
            const entriesSnapshot = await getDocs(entriesQuery);
            const entriesList = entriesSnapshot.docs.map((doc) => ({ id: doc.id, type: selectedTrainingType, ...doc.data() }) as FitnessEntry);
            setEntries(entriesList);
        } finally {
            setIsLoading(false);
            setEntryIdToDelete(null); // Clear the ID after attempt
            setAlertDialogOpen(false); // Close dialog
        }
    };

    // --- Chart Data and Config ---
    const chartConfigMaxReps = {
        situps: { label: "Situps (Count)", color: "hsl(174, 100%, 40%)" },
        pushups: { label: "Pushups (Count)", color: "hsl(210, 100%, 40%)" },
    } satisfies ChartConfig;

    const chartConfigTimed = {
        situpTime: { label: "Situp Time (s)", color: "hsl(34, 100%, 50%)" }, // Different colors maybe
        pushupTime: { label: "Pushup Time (s)", color: "hsl(270, 100%, 60%)" },
    } satisfies ChartConfig;

    const currentChartConfig = selectedTrainingType === 'maxReps' ? chartConfigMaxReps : chartConfigTimed;

    const chartData = useMemo(() => {
        const formatted = entries
            .map((entry) => {
                if (entry.type === 'maxReps') {
                    return {
                        date: entry.timestamp.toDate().toLocaleDateString(),
                        situps: entry.situps,
                        pushups: entry.pushups,
                    };
                } else if (entry.type === 'timed') {
                    return {
                        date: entry.timestamp.toDate().toLocaleDateString(),
                        situpTime: entry.situpTime, // Use time in seconds for chart
                        pushupTime: entry.pushupTime,
                    };
                }
                return null; // Should not happen if type is set correctly
            })
            .filter(item => item !== null); // Remove any nulls

         // Reverse *after* mapping to ensure correct chronological order for charts
        return formatted.reverse();
    }, [entries]); // Depends only on entries

    // --- 7 Day Totals (Only for Max Reps) ---
    const totalsLast7Days = useMemo(() => {
        if (selectedTrainingType !== 'maxReps') {
             return null; // Don't calculate for timed mode
        }

        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0); // Start of 7 days ago
        const fourteenDaysAgo = new Date(sevenDaysAgo);
        fourteenDaysAgo.setDate(sevenDaysAgo.getDate() - 7); // Start of 14 days ago

        const last7DaysTotals = { pushups: 0, situps: 0 };
        const prev7DaysTotals = { pushups: 0, situps: 0 };

        // Filter entries to only include MaxReps type for calculation
        (entries as FitnessEntryMaxReps[]).filter(e => e.type === 'maxReps').forEach((entry) => {
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
            if (previous === 0) return current > 0 ? Infinity : 0; // Handle division by zero (Infinity indicates increase from zero)
            return ((current - previous) / previous) * 100;
        };

        const pushupsPercentageChange = calculatePercentageChange(last7DaysTotals.pushups, prev7DaysTotals.pushups);
        const situpsPercentageChange = calculatePercentageChange(last7DaysTotals.situps, prev7DaysTotals.situps);

        const formatPercentage = (change: number) => {
             if (change === Infinity) return "+∞%";
             return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
        }

        return {
            last7DaysTotals,
            prev7DaysTotals,
            pushupsPercentageChange,
            situpsPercentageChange,
            formattedPushupsChange: formatPercentage(pushupsPercentageChange),
            formattedSitupsChange: formatPercentage(situpsPercentageChange)
        };
    }, [entries, selectedTrainingType]); // Depends on entries and type

    const truncateName = (name: string | undefined, maxLength: number) => {
      if (!name) return "";
      if (name.length > maxLength) {
        return name.substring(0, maxLength) + "...";
      }
      return name;
    };
    
    const displayedName = selectedUserId
    ? truncateName(users.find((user) => user.id === selectedUserId)?.name, 100) 
    : "Select Cadet...";
    // --- Render ---
    return (
        <div className="container mx-auto p-1 pb-16"> {/* Add padding bottom */}

            {/* --- 7-Day Summary Cards (Conditional) --- */}
            {selectedTrainingType === 'maxReps' && totalsLast7Days && (
                <div className="mt-2 mb-4 flex flex-wrap justify-center gap-2 sm:gap-4">
                     {/* Situps Card */}
                    <Card className="w-full max-w-[180px] p-2 shadow-lg rounded-xl border">
                         <CardHeader className="text-center pb-1 pt-1">
                            <CardTitle className="text-sm font-semibold text-gray-800">
                                Situps (7D)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-1">
                             <div className="flex flex-col items-center space-y-1">
                                <p className="text-lg font-bold text-blue-600">
                                    {totalsLast7Days.last7DaysTotals.situps}
                                </p>
                                <TooltipProvider delayDuration={100}>
                                    <ToolTip>
                                         <TooltipTrigger>
                                             <div className="flex items-center space-x-1 text-gray-500">
                                                 {totalsLast7Days.situpsPercentageChange >= 0 ? (
                                                     <TrendingUp className="h-4 w-4 text-green-500" />
                                                 ) : (
                                                     <TrendingDown className="h-4 w-4 text-red-500" />
                                                 )}
                                                 <p className={`text-xs font-medium ${totalsLast7Days.situpsPercentageChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                     {totalsLast7Days.formattedSitupsChange}
                                                 </p>
                                             </div>
                                         </TooltipTrigger>
                                         <TooltipContent>
                                             <p className="text-xs">
                                                vs {totalsLast7Days.prev7DaysTotals.situps} reps (prev 7 days)
                                             </p>
                                         </TooltipContent>
                                     </ToolTip>
                                 </TooltipProvider>
                             </div>
                         </CardContent>
                     </Card>
                     {/* Pushups Card */}
                     <Card className="w-full max-w-[180px] p-2 shadow-lg rounded-xl border">
                          <CardHeader className="text-center pb-1 pt-1">
                            <CardTitle className="text-sm font-semibold text-gray-800">
                                Pushups (7D)
                            </CardTitle>
                        </CardHeader>
                         <CardContent className="p-1">
                              <div className="flex flex-col items-center space-y-1">
                                <p className="text-lg font-bold text-blue-600">
                                    {totalsLast7Days.last7DaysTotals.pushups}
                                </p>
                                <TooltipProvider delayDuration={100}>
                                    <ToolTip>
                                         <TooltipTrigger>
                                            {/* ... Trend icon and percentage ... */}
                                              <div className="flex items-center space-x-1 text-gray-500">
                                                 {totalsLast7Days.pushupsPercentageChange >= 0 ? (
                                                     <TrendingUp className="h-4 w-4 text-green-500" />
                                                 ) : (
                                                     <TrendingDown className="h-4 w-4 text-red-500" />
                                                 )}
                                                 <p className={`text-xs font-medium ${totalsLast7Days.pushupsPercentageChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                     {totalsLast7Days.formattedPushupsChange}
                                                 </p>
                                             </div>
                                         </TooltipTrigger>
                                         <TooltipContent>
                                             <p className="text-xs">
                                                 vs {totalsLast7Days.prev7DaysTotals.pushups} reps (prev 7 days)
                                             </p>
                                         </TooltipContent>
                                     </ToolTip>
                                 </TooltipProvider>
                              </div>
                          </CardContent>
                      </Card>
                </div>
            )}

            {/* --- Input Card with Tabs --- */}
            <Card className="mt-2 w-full max-w-4xl mx-auto">
                <CardHeader>
                    {/* User Selector */}
                     <div className="flex items-center justify-between mb-2">
                         <CardTitle>Log MTR Training Entry</CardTitle>
                     </div>
                     <Popover open={selectComboBoxOpen} onOpenChange={setSelectComboBoxOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={selectComboBoxOpen}
                                    className="w-full justify-between text-sm"
                                    disabled={isLoading && users.length === 0} // Disable if loading users
                                >
                                    {displayedName}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                             <PopoverContent className="w-[200px] p-0">
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
                                                         handleUserSelection(user.id);
                                                         setSelectComboBoxOpen(false);
                                                     }}
                                                 >
                                                     {user.name}
                                                     <Check className={cn("ml-auto h-4 w-4", user.id === selectedUserId ? "opacity-100" : "opacity-0")} />
                                                 </CommandItem>
                                             ))}
                                         </CommandGroup>
                                     </CommandList>
                                 </Command>
                             </PopoverContent>
                         </Popover>
                     {/* End User Selector */}
                </CardHeader>
                <CardContent>
                    <Tabs value={selectedTrainingType} onValueChange={(value: string) => setSelectedTrainingType(value as TrainingType)}>
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="maxReps">Max Reps (60s)</TabsTrigger>
                            <TabsTrigger value="timed">Timed 60 Reps</TabsTrigger>
                        </TabsList>

                        {/* --- FORM --- */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                             {/* Inputs change based on Tab */}
                             <TabsContent value="maxReps" className="space-y-4 m-0">
                                 <div className="space-y-1">
                                     <Label htmlFor="situps-max">Situps</Label>
                                     <Input id="situps-max" type="number" placeholder="Max situps in 60s" value={situps} onChange={(e) => setSitups(e.target.value)} min="0" required={selectedTrainingType === 'maxReps'} />
                                 </div>
                                 <div className="space-y-1">
                                     <Label htmlFor="pushups-max">Pushups</Label>
                                     <Input id="pushups-max" type="number" placeholder="Max pushups in 60s" value={pushups} onChange={(e) => setPushups(e.target.value)} min="0" required={selectedTrainingType === 'maxReps'} />
                                 </div>
                             </TabsContent>

                             <TabsContent value="timed" className="space-y-4 m-0">
                                 {/* Situp Time Input */}
                                 <div className="space-y-1">
                                      <Label htmlFor="situp-minutes">Situp Time (for 60 reps)</Label>
                                      <div className="flex items-center space-x-2">
                                        <Input id="situp-minutes" type="number" placeholder="MM" value={situpMinutes} onChange={(e) => setSitupMinutes(e.target.value)} min="0" className="w-16" required={selectedTrainingType === 'timed'} />
                                        <span className="font-bold">:</span>
                                        <Input id="situp-seconds" type="number" placeholder="SS" value={situpSeconds} onChange={(e) => setSitupSeconds(e.target.value)} min="0" max="59" className="w-16" required={selectedTrainingType === 'timed'} />
                                      </div>
                                 </div>
                                 {/* Pushup Time Input */}
                                  <div className="space-y-1">
                                      <Label htmlFor="pushup-minutes">Pushup Time (for 60 reps)</Label>
                                      <div className="flex items-center space-x-2">
                                        <Input id="pushup-minutes" type="number" placeholder="MM" value={pushupMinutes} onChange={(e) => setPushupMinutes(e.target.value)} min="0" className="w-16" required={selectedTrainingType === 'timed'} />
                                        <span className="font-bold">:</span>
                                        <Input id="pushup-seconds" type="number" placeholder="SS" value={pushupSeconds} onChange={(e) => setPushupSeconds(e.target.value)} min="0" max="59" className="w-16" required={selectedTrainingType === 'timed'} />
                                      </div>
                                 </div>
                             </TabsContent>

                             {/* Date Picker (Common to both) */}
                              <div className="space-y-1">
                                 <Label htmlFor="date-picker-button">Date</Label>
                                 <Popover>
                                     <PopoverTrigger asChild id="date-picker-button">
                                         <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                             <CalendarIcon className="mr-2 h-4 w-4" />
                                             {date ? format(date, "PPP") : <span>Pick a date</span>}
                                         </Button>
                                     </PopoverTrigger>
                                     <PopoverContent className="w-auto p-0">
                                         <Calendar mode="single" selected={date} onSelect={(d) => setDate(d || new Date())} initialFocus required />
                                     </PopoverContent>
                                 </Popover>
                             </div>

                            {/* Submit Button (Common) */}
                            <Button type="submit" className="w-full" disabled={isLoading || !selectedUserId}>
                                {isLoading ? "Submitting..." : "Submit Entry"}
                            </Button>
                        </form>
                        {/* --- END FORM --- */}
                    </Tabs>
                </CardContent>
            </Card>

            {/* --- Chart (Conditional Data Keys) --- */}
             {chartData.length > 0 && (
                <Card className="mt-4 w-full max-w-4xl mx-auto">
                    <CardHeader className="p-2 sm:p-3 md:p-4">
                         <CardTitle className="text-sm sm:text-base md:text-lg font-semibold">
                             {users.find((u) => u.id === selectedUserId)?.name}&apos;s Progress
                             ({selectedTrainingType === 'maxReps' ? 'Max Reps' : 'Time/60 Reps'})
                         </CardTitle>
                     </CardHeader>
                     <CardContent className="p-1 sm:p-2 md:p-3">
                        <div className="h-[300px] w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                 <ChartContainer config={currentChartConfig}>
                                    {/* Key props change */}
                                     <LineChart accessibilityLayer data={chartData} margin={{ top: 10, right: 10, bottom: 2, left: -20 }}>
                                         <CartesianGrid strokeDasharray="3 3" />
                                         <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={10} interval="preserveStartEnd" tickFormatter={(value) => value.substring(0, 5)} /* Simplified date format */ />
                                         <YAxis fontSize={10} tickMargin={5} label={{ value: selectedTrainingType === 'timed' ? 'Time (seconds)' : 'Reps', angle: -90, position: 'insideLeft', offset: -5, style:{fontSize:'10px'}}}/>
                                         <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

                                        {selectedTrainingType === 'maxReps' ? (
                                            <>
                                                <Line
                                                    dataKey="situps"
                                                    type="monotone"
                                                    stroke={chartConfigMaxReps.situps.color}
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                                <Line
                                                    dataKey="pushups"
                                                    type="monotone"
                                                    stroke={chartConfigMaxReps.pushups.color}
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                            </>
                                        ) : ( // selectedTrainingType === 'timed'
                                            <>
                                                <Line
                                                    dataKey="situpTime"
                                                    type="monotone"
                                                    stroke={chartConfigTimed.situpTime.color}
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                                <Line
                                                    dataKey="pushupTime"
                                                    type="monotone"
                                                    stroke={chartConfigTimed.pushupTime.color}
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                            </>
                                        )}

                                         <ChartLegend content={<ChartLegendContent />} wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                                     </LineChart>
                                 </ChartContainer>
                             </ResponsiveContainer>
                         </div>
                     </CardContent>
                </Card>
             )}

            {/* --- History Table (Conditional Columns) --- */}
            <Card className="mt-4 w-full max-w-4xl mx-auto">
                 <CardHeader className="p-2 sm:p-3 md:p-4">
                     <CardTitle className="text-base font-semibold">Entry History ({selectedTrainingType === 'maxReps' ? 'Max Reps' : 'Time/60 Reps'})</CardTitle>
                 </CardHeader>
                <CardContent className="p-1 sm:p-2 md:p-3">
                    {isLoading && entries.length === 0 ? (
                        <div className="text-center py-4">Loading entries...</div>
                    ) : !isLoading && entries.length === 0 ? (
                        <div className="text-center py-4">
                            <Badge variant="secondary">No entries found for this mode!</Badge>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="p-2 text-xs sm:text-sm text-center">Date</TableHead>
                                    {/* Conditional Headers */}
                                    {selectedTrainingType === 'maxReps' ? (
                                        <>
                                            <TableHead className="p-2 text-xs sm:text-sm text-center">Situps</TableHead>
                                            <TableHead className="p-2 text-xs sm:text-sm text-center">Pushups</TableHead>
                                        </>
                                    ) : (
                                         <>
                                            <TableHead className="p-2 text-xs sm:text-sm text-center">Situp Time</TableHead>
                                            <TableHead className="p-2 text-xs sm:text-sm text-center">Pushup Time</TableHead>
                                        </>
                                    )}
                                    <TableHead className="p-2 w-[50px]"></TableHead> {/* Delete Button column */}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {entries.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell className="p-1 sm:p-2 text-xs text-center">{format(entry.timestamp.toDate(), "dd/MM/yy hh:mm a")}</TableCell>
                                        {/* Conditional Cells */}
                                        {entry.type === 'maxReps' ? (
                                            <>
                                                <TableCell className="p-1 sm:p-2 text-xs text-center">{entry.situps}</TableCell>
                                                <TableCell className="p-1 sm:p-2 text-xs text-center">{entry.pushups}</TableCell>
                                            </>
                                        ) : (
                                            <>
                                                <TableCell className="p-1 sm:p-2 text-xs text-center">{formatSecondsToMMSS(entry.situpTime)}</TableCell>
                                                <TableCell className="p-1 sm:p-2 text-xs text-center">{formatSecondsToMMSS(entry.pushupTime)}</TableCell>
                                            </>
                                        )}
                                        <TableCell className="p-1 sm:p-2 text-center">
                                            <Button
                                                variant="ghost" size="sm" // More subtle delete button
                                                onClick={() => { setEntryIdToDelete(entry.id); setAlertDialogOpen(true); }}
                                                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 h-auto"
                                                aria-label="Delete Entry"
                                            >
                                                <FaTrashAlt className="h-3 w-3"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* --- Fixed User Indicator / Changer --- */}
            {selectedUserId && (
                 <div
                    className="fixed bottom-4 right-4 z-50 bg-background border rounded-md shadow-lg cursor-pointer px-3 py-1 flex items-center space-x-2"
                    onClick={() => setIsUserSelectDialogOpen(true)} // Re-open the main dialog
                    title="Change User"
                 >
                     <span className="text-xs font-medium text-foreground">{userName}</span>
                     <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
                 </div>
            )}

            {/* --- Default User Selection Dialog --- */}
             <Dialog open={isUserSelectDialogOpen} onOpenChange={setIsUserSelectDialogOpen}>
                 <DialogContent className="w-full max-w-[95%] sm:max-w-md rounded-lg">
                     <DialogHeader>
                        <DialogTitle>Select Your User</DialogTitle>
                         {/* Optional Close Button */}
                         <DialogClose asChild>
                           <Button variant="ghost" size="sm" className="absolute top-3 right-3 px-1 py-1 h-auto text-muted-foreground hover:bg-muted" onClick={() => setIsUserSelectDialogOpen(false)} disabled={!selectedUserId}><XIcon className="h-4 w-4" /></Button>
                        </DialogClose>
                     </DialogHeader>
                     <div className="py-4"> {/* Add padding */}
                        <Popover open={defaultComboBoxOpen} onOpenChange={setDefaultComboBoxOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" aria-expanded={defaultComboBoxOpen} className="w-full justify-between">
                                    {selectedUserId ? users.find((user) => user.id === selectedUserId)?.name : "Select a user..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                             <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
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
                                                         handleUserSelection(user.id);
                                                         setDefaultComboBoxOpen(false);
                                                         // Don't close the main dialog here, let the footer button do it
                                                     }}
                                                 >
                                                     {user.name}
                                                     <Check className={cn("ml-auto h-4 w-4", selectedUserId === user.id ? "opacity-100" : "opacity-0")} />
                                                 </CommandItem>
                                             ))}
                                         </CommandGroup>
                                     </CommandList>
                                 </Command>
                             </PopoverContent>
                        </Popover>
                     </div>
                     <DialogFooter>
                         <Button onClick={() => setIsUserSelectDialogOpen(false)} disabled={!selectedUserId}>
                            Confirm User
                         </Button>
                     </DialogFooter>
                 </DialogContent>
             </Dialog>

            {/* --- Delete Confirmation Dialog --- */}
             <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
                 <AlertDialogContent>
                     <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                             This action cannot be undone. This will permanently delete the selected entry.
                         </AlertDialogDescription>
                    </AlertDialogHeader>
                     <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setEntryIdToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                             className="bg-red-600 hover:bg-red-400/90"
                             onClick={() => { if (entryIdToDelete) { handleDelete(entryIdToDelete); } }}
                         >
                            Delete
                         </AlertDialogAction>
                     </AlertDialogFooter>
                 </AlertDialogContent>
             </AlertDialog>
        </div>
    );
}