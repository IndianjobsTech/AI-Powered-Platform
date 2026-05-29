import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import api from '../lib/api';
import LoadingScreen from '../components/LoadingScreen';
import EmptyState from '../components/EmptyState';

interface Conversation {
  from_number: string;
  to_number: string;
  content: string;
  created_at: string;
  direction: string;
  status: string;
  lead_id?: string;
  lead_name?: string;
  lead_status?: string;
}

export default function WhatsAppScreen() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.getBusinesses();
      const biz = res.data.data?.[0];
      if (biz) {
        setBusinessId(biz.id);
        const convRes = await api.getConversations(biz.id);
        setConversations(convRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMessages = async (fromNumber: string) => {
    try {
      const res = await api.getMessages(businessId!, { fromNumber });
      setMessages(res.data.data || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;
    try {
      await api.sendMessage(businessId!, {
        to: selectedContact,
        text: newMessage.trim(),
      });
      setNewMessage('');
      loadMessages(selectedContact);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleSelectChat = (conv: Conversation) => {
    setSelectedContact(conv.from_number);
    loadMessages(conv.from_number);
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (loading) return <LoadingScreen />;

  if (!businessId) {
    return (
      <EmptyState
        icon="💬"
        title="No Messages"
        message="Set up your business to start messaging"
        actionLabel="Get Started"
        onAction={() => {}}
      />
    );
  }

  if (selectedContact) {
    const activeConv = conversations.find((c) => c.from_number === selectedContact);
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedContact(null)}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.chatTitle}>
            {activeConv?.lead_name || activeConv?.from_number || 'Chat'}
          </Text>
          <View style={styles.backButton} />
        </View>

        <FlatList
          data={messages}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => (
            <View style={[styles.messageBubble, item.direction === 'OUTBOUND' || item.direction === 'outbound' ? styles.outbound : styles.inbound]}>
              <Text style={[styles.messageText, item.direction === 'OUTBOUND' || item.direction === 'outbound' ? styles.outboundText : null]}>{item.content}</Text>
              <Text style={styles.messageTime}>{formatTime(item.createdAt)}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <Text style={styles.emptyText}>No messages yet. Start a conversation!</Text>
            </View>
          }
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>WhatsApp</Text>
        <Text style={styles.subtitle}>{conversations.length} conversations</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.from_number}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        renderItem={({ item }) => (            <TouchableOpacity style={styles.conversationItem} onPress={() => handleSelectChat(item)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(item.lead_name || item.from_number || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.conversationContent}>
              <View style={styles.conversationTop}>
                <Text style={styles.customerName}>{item.lead_name || item.from_number}</Text>
                <Text style={styles.time}>{formatTime(item.created_at)}</Text>
              </View>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.content || 'No messages yet'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="💬"
            title="No Conversations"
            message="Your WhatsApp conversations will appear here"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  list: {
    padding: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  conversationContent: {
    flex: 1,
  },
  conversationTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  time: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  lastMessage: {
    fontSize: 13,
    color: '#6B7280',
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  // Chat view
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 60,
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '500',
  },
  chatTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  inbound: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  outbound: {
    backgroundColor: '#2563EB',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#111827',
  },
  outboundText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#111827',
  },
  sendButton: {
    backgroundColor: '#2563EB',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginLeft: 8,
  },
  sendText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
