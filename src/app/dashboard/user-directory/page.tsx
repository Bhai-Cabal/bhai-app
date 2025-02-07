"use client";


import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserDirectory } from "@/components/UserDirectory";

const UserDirectoryPage = () => {

  return (
    <div className="space-y-8">
      {/* Tabs for Directory and Analytics */}
      <Tabs defaultValue="directory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="directory">User Directory</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="directory">
          <UserDirectory />
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Analytics</h2>
            <p className="text-muted-foreground">
              Detailed analytics coming soon...
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}



export default UserDirectoryPage;           