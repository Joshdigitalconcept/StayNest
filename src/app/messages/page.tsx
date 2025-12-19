'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  findUserById,
  findImageById,
} from "@/lib/placeholder-data";
import { SendHorizonal } from "lucide-react";
import { useUser } from "@/firebase";

export default function MessagesPage() {
  const { user } = useUser();
  const conversations = [
    {
      userId: "user-1",
      lastMessage: "Sounds great! See you then.",
      timestamp: "10:42 AM",
    },
    {
      userId: "user-2",
      lastMessage: "I had a question about the wifi...",
      timestamp: "Yesterday",
    },
    {
      userId: "user-3",
      lastMessage: "Thank you for the wonderful stay!",
      timestamp: "3d ago",
    },
  ];

  const activeConversationUser = findUserById("user-1");
  const activeConversationAvatar = findImageById(
    activeConversationUser?.avatarId || ""
  );

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 h-[calc(100vh-150px)]">
        <div className="md:col-span-1 lg:col-span-1 border-r">
          <h1 className="text-2xl font-bold font-headline p-4 border-b">
            Messages
          </h1>
          <div className="flex flex-col">
            {conversations.map((convo, index) => {
              const user = findUserById(convo.userId);
              const avatar = findImageById(user?.avatarId || "");
              return (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/50 ${index === 0 ? "bg-accent/80" : ""}`}
                >
                  <Avatar>
                    {avatar && <AvatarImage src={avatar.imageUrl} alt={user?.name} />}
                    <AvatarFallback>
                      {user?.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 truncate">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">{user?.name}</h3>
                      <p className="text-xs text-muted-foreground">{convo.timestamp}</p>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="md:col-span-2 lg:col-span-3 flex flex-col h-full">
          <div className="p-4 border-b flex items-center gap-4">
            <Avatar>
              {activeConversationAvatar && (
                <AvatarImage
                  src={activeConversationAvatar.imageUrl}
                  alt={activeConversationUser?.name}
                />
              )}
              <AvatarFallback>
                {activeConversationUser?.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold">
              {activeConversationUser?.name}
            </h2>
          </div>
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div className="flex items-end gap-2">
              <Avatar className="h-8 w-8">
                {activeConversationAvatar && <AvatarImage src={activeConversationAvatar.imageUrl} alt={activeConversationUser?.name} />}
                <AvatarFallback>{activeConversationUser?.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="bg-muted p-3 rounded-lg max-w-xs">
                <p>Hi there! Just wanted to confirm my check-in time for next Friday.</p>
              </div>
            </div>
            <div className="flex items-end gap-2 justify-end">
              <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-xs">
                <p>Hi! Your check-in is confirmed for 3 PM next Friday. We look forward to hosting you!</p>
              </div>
               <Avatar className="h-8 w-8">
                 {user?.photoURL && <AvatarImage src={user.photoURL} alt="My avatar" />}
                <AvatarFallback>{user?.displayName?.charAt(0) || 'ME'}</AvatarFallback>
              </Avatar>
            </div>
             <div className="flex items-end gap-2">
              <Avatar className="h-8 w-8">
                {activeConversationAvatar && <AvatarImage src={activeConversationAvatar.imageUrl} alt={activeConversationUser?.name} />}
                <AvatarFallback>{activeConversationUser?.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="bg-muted p-3 rounded-lg max-w-xs">
                <p>Sounds great! See you then.</p>
              </div>
            </div>
          </div>
          <div className="p-4 border-t mt-auto">
            <div className="relative">
              <Input
                placeholder="Type a message..."
                className="pr-12"
              />
              <Button size="icon" variant="ghost" className="absolute top-1/2 right-1 -translate-y-1/2">
                <SendHorizonal className="h-5 w-5 text-primary" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
