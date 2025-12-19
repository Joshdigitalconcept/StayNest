import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { findImageById } from "@/lib/placeholder-data";
import { Edit } from "lucide-react";

export default function ProfilePage() {
  const avatarImage = findImageById("avatar-1");

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                {avatarImage && <AvatarImage src={avatarImage.imageUrl} alt="User Avatar" />}
                <AvatarFallback className="text-3xl">U</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">Sarah Lee</CardTitle>
              <CardDescription>Joined in 2023</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-3">
          <Tabs defaultValue="bookings">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bookings">My Bookings</TabsTrigger>
              <TabsTrigger value="properties">My Properties</TabsTrigger>
            </TabsList>
            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <CardTitle>My Bookings</CardTitle>
                  <CardDescription>
                    View your past and upcoming trips.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-12">
                  <h3 className="text-lg font-semibold text-muted-foreground">
                    You have no upcoming bookings.
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Start exploring to find your next adventure!
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="properties">
              <Card>
                <CardHeader>
                  <CardTitle>My Properties</CardTitle>
                  <CardDescription>
                    Manage your listings and view guest requests.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-12">
                   <h3 className="text-lg font-semibold text-muted-foreground">
                    You have no properties listed.
                  </h3>
                  <Button asChild className="mt-4">
                    <a href="#">Become a Host</a>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
