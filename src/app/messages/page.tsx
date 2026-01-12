
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError, useCollection } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, doc, updateDoc, onSnapshot, Unsubscribe, limit, getDocs } from 'firebase/firestore';
import { Loader2, SendHorizonal, CheckCheck, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNowStrict } from 'date-fns';
import type { Booking, Message } from '@/lib/types';
import { Badge } from '@/components/ui/badge';


interface Conversation extends Booking {
    lastMessage?: string;
    unreadCount?: number;
    lastMessageTimestamp?: number;
}

function ConversationList({ conversations, activeBookingId, setActiveBookingId }: {
    conversations: Conversation[],
    activeBookingId: string | null,
    setActiveBookingId: (id: string) => void
}) {
    const { user } = useUser();

    if (conversations.length === 0) {
        return (
            <div className="md:col-span-1 lg:col-span-1 border-r p-4">
                 <h1 className="text-2xl font-bold font-headline p-4 border-b -m-4 mb-4">
                    Messages
                </h1>
                <p className="text-center text-muted-foreground mt-8">No conversations yet.</p>
            </div>
        )
    }

    return (
        <div className="md:col-span-1 lg:col-span-1 border-r">
            <h1 className="text-2xl font-bold font-headline p-4 border-b">
                Messages
            </h1>
            <div className="flex flex-col">
                {conversations.map((booking) => {
                    const otherParty = user?.uid === booking.guestId ? booking.host : booking.guest;
                    return (
                        <div
                            key={booking.id}
                            className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/50 ${booking.id === activeBookingId ? "bg-accent/80" : ""}`}
                            onClick={() => setActiveBookingId(booking.id)}
                        >
                            <Avatar>
                                <AvatarImage src={otherParty?.photoURL} alt={otherParty?.name} />
                                <AvatarFallback>{otherParty?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 truncate">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold">{otherParty?.name}</h3>
                                    {booking.unreadCount && booking.unreadCount > 0 && (
                                        <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center">{booking.unreadCount}</Badge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{booking.listing?.title}</p>
                                <p className="text-sm text-muted-foreground truncate italic">
                                  {booking.lastMessage || 'No messages yet'}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ChatWindow({ activeBooking }: { activeBooking: Booking | null }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const [newMessage, setNewMessage] = React.useState('');
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const messagesQuery = useMemoFirebase(
        () => activeBooking ? query(collection(firestore, `bookings/${activeBooking.id}/messages`), orderBy('createdAt', 'asc')) : null,
        [activeBooking, firestore]
    );
    const { data: messages, isLoading } = useCollection<Message>(messagesQuery);
    
    const otherParty = user?.uid === activeBooking?.guestId ? activeBooking?.host : activeBooking?.guest;

    // Mark messages as read effect
    React.useEffect(() => {
        if (!messages || !user || !firestore) return;
        messages.forEach(message => {
            if (message.receiverId === user.uid && !message.isRead) {
                const messageRef = doc(firestore, `bookings/${message.bookingId}/messages`, message.id);
                updateDoc(messageRef, { isRead: true }).catch(err => {
                     const permissionError = new FirestorePermissionError({
                        path: messageRef.path,
                        operation: 'update',
                        requestResourceData: { isRead: true },
                    });
                    errorEmitter.emit('permission-error', permissionError);
                });
            }
        });
    }, [messages, user, firestore]);

     // Scroll to bottom effect
    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeBooking || !user || !firestore || newMessage.trim() === '') return;

        const messagesColRef = collection(firestore, `bookings/${activeBooking.id}/messages`);
        const messageData = {
            bookingId: activeBooking.id,
            senderId: user.uid,
            receiverId: user.uid === activeBooking.guestId ? activeBooking.hostId : activeBooking.guestId,
            guestId: activeBooking.guestId,
            hostId: activeBooking.hostId,
            listingId: activeBooking.listingId,
            text: newMessage,
            createdAt: serverTimestamp(),
            isRead: false,
        };

        try {
            await addDoc(messagesColRef, messageData);
            setNewMessage('');
        } catch (error) {
             const permissionError = new FirestorePermissionError({
                path: messagesColRef.path,
                operation: 'create',
                requestResourceData: messageData,
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    };
    
    if (!activeBooking) {
        return (
            <div className="md:col-span-2 lg:col-span-3 flex flex-col h-full items-center justify-center text-muted-foreground">
                <p>Select a conversation to start messaging.</p>
            </div>
        );
    }

    return (
        <div className="md:col-span-2 lg:col-span-3 flex flex-col h-full">
            <div className="p-4 border-b flex items-center gap-4">
                <Avatar>
                    <AvatarImage src={otherParty?.photoURL} alt={otherParty?.name} />
                    <AvatarFallback>{otherParty?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="text-xl font-semibold">{otherParty?.name}</h2>
                    <p className="text-sm text-muted-foreground">{activeBooking.listing?.title}</p>
                </div>
            </div>
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                {isLoading && <div className="flex justify-center"><Loader2 className="animate-spin" /></div>}
                {!isLoading && messages?.map(msg => {
                    const isSender = msg.senderId === user?.uid;
                    return (
                        <div key={msg.id} className={`flex items-end gap-2 ${isSender ? 'justify-end' : ''}`}>
                             {!isSender && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={otherParty?.photoURL} alt={otherParty?.name} />
                                    <AvatarFallback>{otherParty?.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                            )}
                            <div className={`p-3 rounded-lg max-w-md ${isSender ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                <p>{msg.text}</p>
                                <div className={`flex items-center gap-1 mt-1 ${isSender ? 'justify-end' : 'justify-start'}`}>
                                     <p className="text-xs opacity-70">
                                        {msg.createdAt ? formatDistanceToNowStrict(msg.createdAt.toDate()) : '...'}
                                    </p>
                                    {isSender && (
                                        msg.isRead ? <CheckCheck className="h-4 w-4 text-blue-500" /> : <Check className="h-4 w-4" />
                                    )}
                                </div>
                            </div>
                            {isSender && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
                                    <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    );
                })}
                 <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t mt-auto">
                <form onSubmit={handleSendMessage} className="relative">
                    <Input
                        placeholder="Type a message..."
                        className="pr-12"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <Button type="submit" size="icon" variant="ghost" className="absolute top-1/2 right-1 -translate-y-1/2">
                        <SendHorizonal className="h-5 w-5 text-primary" />
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default function MessagesPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();
    const [activeBookingId, setActiveBookingId] = React.useState<string | null>(searchParams.get('bookingId'));
    const [conversations, setConversations] = React.useState<Map<string, Conversation>>(new Map());
    
    // -- Separate Queries for guest bookings and host reservations --
    const guestQuery = useMemoFirebase(
      () => user ? query(collection(firestore, 'bookings'), where('guestId', '==', user.uid)) : null,
      [user, firestore]
    );
    const hostQuery = useMemoFirebase(
      () => user ? query(collection(firestore, 'bookings'), where('hostId', '==', user.uid)) : null,
      [user, firestore]
    );

    const { data: guestBookings, isLoading: isGuestBookingsLoading } = useCollection<Booking>(guestQuery);
    const { data: hostBookings, isLoading: isHostBookingsLoading } = useCollection<Booking>(hostQuery);

    const isLoading = isUserLoading || isGuestBookingsLoading || isHostBookingsLoading;

    React.useEffect(() => {
      const allBookings = [...(guestBookings || []), ...(hostBookings || [])];
      const uniqueBookings = Array.from(new Map(allBookings.map(item => [item.id, item])).values());
      
      const unsubscribes: Unsubscribe[] = [];

      uniqueBookings.forEach(booking => {
          const lastMsgQuery = query(collection(firestore, `bookings/${booking.id}/messages`), orderBy('createdAt', 'desc'), limit(1));
          const unreadQuery = query(collection(firestore, `bookings/${booking.id}/messages`), where('receiverId', '==', user!.uid), where('isRead', '==', false));

          const unsubLastMsg = onSnapshot(lastMsgQuery, (snap) => {
              const lastMsg = snap.docs[0]?.data() as Message;
              setConversations(prev => {
                  const newConversations = new Map(prev);
                  const currentConvo = newConversations.get(booking.id) || { ...booking };
                  currentConvo.lastMessage = lastMsg?.text || 'No messages yet';
                  currentConvo.lastMessageTimestamp = lastMsg?.createdAt?.toMillis() || booking.createdAt.toMillis();
                  newConversations.set(booking.id, currentConvo);
                  return newConversations;
              });
          });

          const unsubUnread = onSnapshot(unreadQuery, (snap) => {
              setConversations(prev => {
                  const newConversations = new Map(prev);
                  const currentConvo = newConversations.get(booking.id) || { ...booking };
                  currentConvo.unreadCount = snap.size;
                  newConversations.set(booking.id, currentConvo);
                  return newConversations;
              });
          });
          
          unsubscribes.push(unsubLastMsg, unsubUnread);
      });
      
      // Initial state for bookings without messages
      setConversations(prev => {
        const newConversations = new Map(prev);
        uniqueBookings.forEach(booking => {
            if (!newConversations.has(booking.id)) {
                newConversations.set(booking.id, {
                    ...booking,
                    lastMessage: 'No messages yet',
                    lastMessageTimestamp: booking.createdAt.toMillis(),
                    unreadCount: 0,
                });
            }
        });
        return newConversations;
      });

      return () => unsubscribes.forEach(unsub => unsub());

    }, [guestBookings, hostBookings, firestore, user]);
    
    // Set initial active booking ID
    React.useEffect(() => {
        if (!activeBookingId && conversations.size > 0) {
            const firstConvo = Array.from(conversations.values()).sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0))[0];
            if (firstConvo) {
                setActiveBookingId(firstConvo.id);
            }
        }
    }, [conversations, activeBookingId]);

    const sortedConversations = React.useMemo(() => {
        return Array.from(conversations.values()).sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
    }, [conversations]);

    const activeBooking = React.useMemo(() => {
        return conversations.get(activeBookingId || '') || null;
    }, [conversations, activeBookingId]);
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-12 w-12" /></div>
    }

    if (!user) {
        return <div className="container mx-auto py-8 text-center"><p>Please log in to view your messages.</p></div>
    }

    return (
        <div className="container mx-auto py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-[calc(100vh-150px)] border rounded-lg">
                <ConversationList conversations={sortedConversations} activeBookingId={activeBookingId} setActiveBookingId={setActiveBookingId} />
                <ChatWindow activeBooking={activeBooking} />
            </div>
        </div>
    );
}

    
