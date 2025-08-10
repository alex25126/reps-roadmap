import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from "@/components/app/Dashboard";
import PlanBuilder from "@/components/app/PlanBuilder";
import ProgressCharts from "@/components/app/ProgressCharts";
import Hyperspeed from "@/components/visual/Hyperspeed";
import { hyperspeedPresets } from "@/components/visual/hyperspeedPresets";

const Index = () => {
  return (
    <div className="relative min-h-screen app-bg">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <Hyperspeed effectOptions={hyperspeedPresets.one as any} />
      </div>
      <nav className="sticky top-0 z-10 nav-glass">
        <div className="container mx-auto flex h-12 sm:h-14 items-center justify-between px-4">
          <a href="/" className="font-semibold text-sm sm:text-base">Gym Planner</a>
          <div className="hidden sm:flex gap-2">
            <a href="#dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</a>
            <a href="#plan" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Plan</a>
            <a href="#progress" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Progress</a>
          </div>
        </div>
      </nav>
      <Tabs defaultValue="dashboard" className="container mx-auto py-4 sm:py-6 px-4">
        <TabsList className="glass w-full sm:w-auto grid grid-cols-3 sm:flex">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" id="dashboard"><Dashboard /></TabsContent>
        <TabsContent value="plan"><PlanBuilder /></TabsContent>
        <TabsContent value="progress" id="progress"><ProgressCharts /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
