import { useState, useEffect } from "react"
import { ref, onValue } from "firebase/database"
import { db } from "../firebase"

export function useNames() {
  const [names, setNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const namesRef = ref(db, "names")
      const unsubscribe = onValue(
        namesRef,
        (snapshot) => {
          const data = snapshot.val()
          if (data) {
            // If data is an object with name properties
            if (typeof data === "object") {
              setNames(Object.values(data))
            } else if (Array.isArray(data)) {
              // If data is directly an array
              setNames(data)
            }
          } else {
            // If no data exists yet, initialize with empty array
            setNames([])
          }
          setLoading(false)
        },
        (error) => {
          setError(error.message)
          setLoading(false)
        },
      )

      return () => unsubscribe()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setLoading(false)
    }
  }, [])

  return { names, loading, error }
}

