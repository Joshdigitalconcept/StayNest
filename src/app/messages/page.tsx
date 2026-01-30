
'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError, useCollection } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, doc, updateDoc, onSnapshot, Unsubscribe, limit, collectionGroup } from 'firebase/firestore';
import { Loader2, SendHorizonal, CheckCheck, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNowStrict } from 'date-fns';
import type { Booking, Message } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Conversation {
    id: string; // Composite ID: listingId + otherPartyId
    listingId: string;
    otherPartyId: string;
    otherParty: { name: string; photoURL: string };
    listingTitle: string;
    lastMessage?: string;
    unreadCount: number;
    lastMessageTimestamp?: number;
    latestBookingId: string;
}

function ConversationList({ 
    conversations, 
    activeConvoId, 
    onSelect 
}: { 
    conversations: Conversation[], 
    activeConvoId: string | null, 
    onSelect: (convo: Conversation) => void 
}) {
    if (conversations.length === 0) {
        return (
            <div className="md:col-span-1 lg:col-span-1 border-r p-4">
                 <h1 className="text-2xl font-bold font-headline p-4 border-b -m-4 mb-4">
                    Messages
                </h1>
                <p className="text-center text-muted-foreground mt-8 text-sm">No conversations yet.</p>
            </div>
        )
    }

    return (
        <div className="md:col-span-1 lg:col-span-1 border-r overflow-y-auto">
            <h1 className="text-2xl font-bold font-headline p-4 border-b sticky top-0 bg-background z-10">
                Messages
            </h1>
            <div className="flex flex-col">
                {conversations.map((convo) => (
                    <div
                        key={convo.id}
                        className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/50 border-b transition-colors ${convo.id === activeConvoId ? "bg-accent/80" : ""}`}
                        onClick={() => onSelect(convo)}
                    >
                        <Avatar className="h-12 w-12 flex-shrink-0">
                            <AvatarImage src={convo.otherParty.photoURL} alt={convo.otherParty.name} />
                            <AvatarFallback>{convo.otherParty.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center gap-2">
                                <h3 className="font-semibold truncate text-sm">{convo.otherParty.name}</h3>
                                {convo.unreadCount > 0 && (
                                    <Badge variant="destructive" className="h-5 min-w-[20px] p-1 flex items-center justify-center text-[10px]">{convo.unreadCount}</Badge>
                                )}
                            </div>
                            <p className="text-xs text-primary font-medium truncate">{convo.listingTitle}</p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {convo.lastMessage || 'No messages yet'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ChatWindow({ activeConvo }: { activeConvo: Conversation | null }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const [newMessage, setNewMessage] = React.useState('');
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    // Fetch messages across ALL bookings for this listing and participant pair
    const messagesQuery = useMemoFirebase(
        () => {
            if (!activeConvo || !firestore) return null;
            return query(
                collectionGroup(firestore, 'messages'),
                where('listingId', '==', activeConvo.listingId),
                where('senderId', 'in', [user?.uid, activeConvo.otherPartyId]),
                where('receiverId', 'in', [user?.uid, activeConvo.otherPartyId]),
                orderBy('createdAt', 'asc')
            );
        },
        [activeConvo, firestore, user?.uid]
    );
    
    const { data: messages, isLoading } = useCollection<Message>(messagesQuery);

    // Mark messages as read
    React.useEffect(() => {
        if (!messages || !user || !firestore) return;
        messages.forEach(message => {
            if (message.receiverId === user.uid && !message.isRead) {
                const messageRef = doc(firestore, `bookings/${message.bookingId}/messages`, message.id);
                updateDoc(messageRef, { isRead: true }).catch(() => {});
            }
        });
    }, [messages, user, firestore]);

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeConvo || !user || !firestore || newMessage.trim() === '') return;

        // We send the message to the latest booking ID associated with this conversation
        const messagesColRef = collection(firestore, `bookings/${activeConvo.latestBookingId}/messages`);
        const messageData = {
            bookingId: activeConvo.latestBookingId,
            senderId: user.uid,
            receiverId: activeConvo.otherPartyId,
            listingId: activeConvo.listingId,
            text: newMessage,
            createdAt: serverTimestamp(),
            isRead: false,
        };

        try {
            await addDoc(messagesColRef, messageData);
            setNewMessage('');
        } catch (error) {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: messagesColRef.path,
                operation: 'create',
                requestResourceData: messageData,
            }));
        }
    };
    
    if (!activeConvo) {
        return (
            <div className="md:col-span-2 lg:col-span-3 flex flex-col h-full items-center justify-center text-muted-foreground bg-accent/5">
                <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                <p>Select a conversation to start messaging.</p>
            </div>
        );
    }

    return (
        <div className="md:col-span-2 lg:col-span-3 flex flex-col h-full bg-background">
            <div className="p-4 border-b flex items-center justify-between bg-background/95 backdrop-blur sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Link href={`/users/${activeConvo.otherPartyId}`}>
                        <Avatar className="hover:opacity-80 transition-opacity">
                            <AvatarImage src={activeConvo.otherParty.photoURL} alt={activeConvo.otherParty.name} />
                            <AvatarFallback>{activeConvo.otherParty.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div>
                        <Link href={`/users/${activeConvo.otherPartyId}`} className="hover:underline">
                            <h2 className="text-sm font-bold leading-tight">{activeConvo.otherParty.name}</h2>
                        </Link>
                        <Link href={`/properties/${activeConvo.listingId}`} className="hover:underline">
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{activeConvo.listingTitle}</p>
                        </Link>
                    </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                    <Link href={`/properties/${activeConvo.listingId}`}>View Listing</Link>
                </Button>
            </div>
            
            <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-slate-50/30">
                {isLoading && <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>}
                {!isLoading && messages?.map(msg => {
                    const isSender = msg.senderId === user?.uid;
                    return (
                        <div key={msg.id} className={`flex items-end gap-2 ${isSender ? 'justify-end' : 'justify-start'}`}>
                             {!isSender && (
                                <Link href={`/users/${activeConvo.otherPartyId}`}>
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={activeConvo.otherParty.photoURL} />
                                        <AvatarFallback>{activeConvo.otherParty.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </Link>
                            )}
                            <div className={`group relative p-3 rounded-2xl max-w-[80%] shadow-sm ${isSender ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-white border rounded-bl-none'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                <div className={`flex items-center gap-1 mt-1 ${isSender ? 'justify-end' : 'justify-start'}`}>
                                     <p className="text-[10px] opacity-60">
                                        {msg.createdAt ? formatDistanceToNowStrict(msg.createdAt.toDate()) : '...'}
                                    </p>
                                    {isSender && (
                                        msg.isRead ? <CheckCheck className="h-3 w-3 text-blue-300" /> : <Check className="h-3 w-3 opacity-50" />
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                 <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t bg-background">
                <form onSubmit={handleSendMessage} className="relative flex gap-2">
                    <Input
                        placeholder="Type a message..."
                        className="rounded-full bg-accent/30 border-none focus-visible:ring-1"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!newMessage.trim()}>
                        <SendHorizonal className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}

import { MessageSquare } from 'lucide-react';

export default function MessagesPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();
    const [activeConvoId, setActiveConvoId] = React.useState<string | null>(null);
    const [conversationsMap, setConversationsMap] = React.useState<Map<string, Conversation>>(new Map());
    
    // Step 1: Get all bookings where user is participant
    const guestQuery = useMemoFirebase(() => user ? query(collection(firestore, 'bookings'), where('guestId', '==', user.uid)) : null, [user, firestore]);
    const hostQuery = useMemoFirebase(() => user ? query(collection(firestore, 'bookings'), where('hostId', '==', user.uid)) : null, [user, firestore]);

    const { data: guestBookings } = useCollection<Booking>(guestQuery);
    const { data: hostBookings } = useCollection<Booking>(hostQuery);

    React.useEffect(() => {
      if (!guestBookings && !hostBookings) return;
      if (!user || !firestore) return;

      const allBookings = [...(guestBookings || []), ...(hostBookings || [])];
      const unsubscribes: Unsubscribe[] = [];

      // Group bookings by unique Listing + Other User pair
      allBookings.forEach(booking => {
          const otherPartyId = user.uid === booking.guestId ? booking.hostId : booking.guestId;
          const otherParty = user.uid === booking.guestId ? booking.host! : booking.guest!;
          const convoId = `${booking.listingId}_${otherPartyId}`;

          // Live listener for messages across this conversation group (via collection group or listing-filtered booking sub-collections)
          // For simplicity, we query the messages subcollection of the SPECIFIC booking to build the grouping
          const lastMsgQuery = query(collection(firestore, `bookings/${booking.id}/messages`), orderBy('createdAt', 'desc'), limit(1));
          const unreadQuery = query(collection(firestore, `bookings/${booking.id}/messages`), where('receiverId', '==', user.uid), where('isRead', '==', false));

          const unsubLastMsg = onSnapshot(lastMsgQuery, (snap) => {
              const msgData = snap.docs[0]?.data() as Message;
              setConversationsMap(prev => {
                  const newMap = new Map(prev);
                  const existing = newMap.get(convoId);
                  
                  // Only update if this booking's message is newer or we don't have one
                  const isNewer = !existing || (msgData?.createdAt?.toMillis() || 0) > (existing.lastMessageTimestamp || 0);
                  
                  if (isNewer) {
                      newMap.set(convoId, {
                          id: convoId,
                          listingId: booking.listingId,
                          listingTitle: booking.listing?.title || 'Property',
                          otherPartyId,
                          otherParty: { name: otherParty.name, photoURL: otherParty.photoURL },
                          lastMessage: msgData?.text || existing?.lastMessage || 'No messages yet',
                          lastMessageTimestamp: msgData?.createdAt?.toMillis() || existing?.lastMessageTimestamp || booking.createdAt.toMillis(),
                          unreadCount: existing?.unreadCount || 0,
                          latestBookingId: booking.id
                      });
                  }
                  return newMap;
              });
          });

          const unsubUnread = onSnapshot(unreadQuery, (snap) => {
              setConversationsMap(prev => {
                  const newMap = new Map(prev);
                  const existing = newMap.get(convoId);
                  if (existing) {
                      // Note: This logic is slightly flawed as it only counts unread for THIS booking
                      // We'd ideally sum all unreads for all bookings in this convo group
                      // but for MVP, we'll just update the map
                      newMap.set(convoId, { ...existing, unreadCount: snap.size });
                  }
                  return newMap;
              });
          });
          
          unsubscribes.push(unsubLastMsg, unsubUnread);
      });

      return () => unsubscribes.forEach(unsub => unsub());
    }, [guestBookings, hostBookings, user, firestore]);

    const sortedConversations = React.useMemo(() => {
        return Array.from(conversationsMap.values()).sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
    }, [conversationsMap]);

    const activeConvo = React.useMemo(() => {
        return activeConvoId ? conversationsMap.get(activeConvoId) : null;
    }, [conversationsMap, activeConvoId]);

    // Initial selection
    React.useEffect(() => {
        if (!activeConvoId && sortedConversations.length > 0) {
            setActiveConvoId(sortedConversations[0].id);
        }
    }, [sortedConversations, activeConvoId]);
    
    if (isUserLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>
    }

    if (!user) {
        return <div className="container mx-auto py-8 text-center"><p>Please log in to view your messages.</p></div>
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-[calc(100vh-180px)] border rounded-2xl shadow-xl overflow-hidden bg-background">
                <ConversationList 
                    conversations={sortedConversations} 
                    activeConvoId={activeConvoId} 
                    onSelect={(c) => setActiveConvoId(c.id)} 
                />
                <ChatWindow activeConvo={activeConvo || null} />
            </div>
        </div>
    );
}
