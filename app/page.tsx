import FitTracker from './components/fit-tracker'
import UserCharts from './components/user-charts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  return (
    <div className='m-2'>
      <Tabs defaultValue="home" className="w-full">
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value="home">Home</TabsTrigger>
          <TabsTrigger value="oView">Overall View</TabsTrigger>
        </TabsList>
        <TabsContent value="home">
          <FitTracker />
        </TabsContent>
        <TabsContent value="oView">
          <UserCharts />
        </TabsContent>
      </Tabs>
      <Toaster />
    </div>
  );
}
