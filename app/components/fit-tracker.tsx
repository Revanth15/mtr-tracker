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

//testing

export default function FitTracker() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [situps, setSitups] = useState<string>("")
  const [pushups, setPushups] = useState<string>("")
  const [entries, setEntries] = useState<FitnessEntry[]>([])

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
        timestamp: Timestamp.now(),
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
    } catch (error) {
      console.error("Error deleting entry: ", error)
    }
  }

  const totalsLast7Days = useMemo(() => {
    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 7)
    
    return entries.reduce(
      (acc, entry) => {
        const entryDate = entry.timestamp.toDate()
  
        // If the entry is within the past 7 days
        if (entryDate >= sevenDaysAgo && entryDate <= today) {
          acc.pushups += entry.pushups
          acc.situps += entry.situps
        }
        return acc
      },
      { pushups: 0, situps: 0 }
    )
  }, [entries])

  return (
    <div className="container mx-auto p-4">
      <div className="mt-2 flex space-x-4 justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Total Situps (7days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p>{totalsLast7Days.situps}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Total Pushups (7days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p>{totalsLast7Days.pushups}</p>
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
              <Select value={selectedUserId} onValueChange={setSelectedUserId} required>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Select a cadet" />
                </SelectTrigger>
                <SelectContent>
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
              <p className="text-center">No entries found!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

