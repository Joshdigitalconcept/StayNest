'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { Loader2, SendHorizonal, CheckCheck, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNowStrict } from 'date-fns';
import type { Booking, Message, User as UserType } from '@/lib/types';

function ConversationList({ conversations, activeBookingId, setActiveBookingId }: {
    conversations: Booking[],
    activeBookingId: string | null,
    setActiveBookingId: (id: string) => void
}) {
    const { user } = useUser();

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
                                <h3 className="font-semibold">{otherParty?.name}</h3>
                                <p className="text-sm text-muted-foreground truncate">{booking.listing?.title}</p>
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

    const guestBookingsQuery = useMemoFirebase(
        () => user ? query(collection(firestore, 'bookings'), where('guestId', '==', user.uid)) : null,
        [user, firestore]
    );
    const hostBookingsQuery = useMemoFirebase(
        () => user ? query(collection(firestore, 'bookings'), where('hostId', '==', user.uid)) : null,
        [user, firestore]
    );

    const { data: guestBookings, isLoading: isGuestBookingsLoading } = useCollection<Booking>(guestBookingsQuery);
    const { data: hostBookings, isLoading: isHostBookingsLoading } = useCollection<Booking>(hostBookingsQuery);
    
    const conversations = React.useMemo(() => {
        const allBookings = [...(guestBookings || []), ...(hostBookings || [])];
        const uniqueBookings = Array.from(new Map(allBookings.map(item => [item.id, item])).values());
        // Show conversations for confirmed or pending bookings, or declined bookings that have messages.
        // For simplicity, we can show all non-past bookings. A more advanced filter could be added.
        return uniqueBookings.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    }, [guestBookings, hostBookings]);
    
    const activeBooking = React.useMemo(() => {
        return conversations.find(c => c.id === activeBookingId) || null;
    }, [conversations, activeBookingId]);

    React.useEffect(() => {
        if (!activeBookingId && conversations.length > 0) {
            setActiveBookingId(conversations[0].id);
        }
    }, [conversations, activeBookingId]);

    const isLoading = isUserLoading || isGuestBookingsLoading || isHostBookingsLoading;
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-12 w-12" /></div>
    }

    if (!user) {
        return <div className="container mx-auto py-8 text-center"><p>Please log in to view your messages.</p></div>
    }

    return (
        <div className="container mx-auto py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 h-[calc(100vh-150px)] border rounded-lg">
                {conversations.length > 0 ? (
                    <>
                        <ConversationList conversations={conversations} activeBookingId={activeBookingId} setActiveBookingId={setActiveBookingId} />
                        <ChatWindow activeBooking={activeBooking} />
                    </>
                ) : (
                    <div className="col-span-full flex items-center justify-center text-muted-foreground h-full">
                       <p>You have no active conversations. Conversations appear after a booking is confirmed.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
