// Current: LocalStorage only
// Improvement: Add Firebase/Supabase backend

// Add real-time database
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc } from 'firebase/firestore';

// Real-time message sync
const unsubscribe = onSnapshot(collection(db, `messages/${chatId}/conversation`),
  (snapshot) => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        displayNewMessage(change.doc.data());
      }
    });
  }
);
(function () {
  // ---------- STATE ----------
  let currentUser = null, currentChatId = null, currentChatUser = null, isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  let messages = JSON.parse(localStorage.getItem('wavechat_messages')) || {};
  let conversations = JSON.parse(localStorage.getItem('wavechat_conversations')) || {};
  const users = [
    { id: 'user1', name: 'John Doe', avatar: 'user-tie', status: 'online', lastSeen: 'now', email: 'john@example.com' },
    { id: 'user2', name: 'Alice Smith', avatar: 'user-graduate', status: 'online', lastSeen: '2m', email: 'alice@example.com' },
    { id: 'user3', name: 'Mike Johnson', avatar: 'user-ninja', status: 'away', lastSeen: '30m', email: 'mike@example.com' },
    { id: 'user4', name: 'Sarah Brown', avatar: 'user-astronaut', status: 'offline', lastSeen: '2h', email: 'sarah@example.com' }
  ];
  if (Object.keys(conversations).length === 0) users.forEach(u => { conversations[`conv_${u.id}`] = { userId: u.id, lastMessage: `Hello!`, lastMessageTime: new Date().toISOString(), unreadCount: 0 }; });
  if (Object.keys(messages).length === 0) {
    messages['conv_user1'] = [{ id: 1, text: 'Hey! How are you?', sender: 'user1', time: '10:30 AM', type: 'text' }];
    messages['conv_user2'] = [{ id: 1, text: 'Hi Alice!', sender: 'current', time: '9:15 AM', type: 'text' }];
    localStorage.setItem('wavechat_messages', JSON.stringify(messages));
  }
  localStorage.setItem('wavechat_conversations', JSON.stringify(conversations));

  let localStream = null, callTimerInterval = null, callSeconds = 0, isCallMuted = false, isVideoEnabled = true;
  // DOM
  const els = {
    sidebar: document.getElementById('sidebar'), overlay: document.getElementById('overlay'), themeToggle: document.getElementById('themeToggle'),
    authBtn: document.getElementById('authBtn'), onlineUsers: document.getElementById('onlineUsers'), conversationsList: document.getElementById('conversationsList'),
    welcomeScreen: document.getElementById('welcomeScreen'), chatMessages: document.getElementById('chatMessages'), messagesContainer: document.getElementById('messagesContainer'),
    currentUserAvatar: document.getElementById('currentUserAvatar'), currentUserDisplayName: document.getElementById('currentUserDisplayName'),
    currentUserEmail: document.getElementById('currentUserEmail'), currentUserStatus: document.getElementById('currentUserStatus'),
    chatUserName: document.getElementById('chatUserName'), chatUserAvatar: document.getElementById('chatUserAvatar'), chatUserStatus: document.getElementById('chatUserStatus'),
    chatUserStatusText: document.getElementById('chatUserStatusText'), messageInput: document.getElementById('messageInput'), sendButton: document.getElementById('sendButton'),
    attachBtn: document.getElementById('attachBtn'), audioCallBtn: document.getElementById('audioCallBtn'), videoCallBtn: document.getElementById('videoCallBtn'),
    attachmentMenu: document.getElementById('attachmentMenu'), searchInput: document.getElementById('searchInput'), onlineCount: document.getElementById('onlineCount'),
    authModal: document.getElementById('authModal'), loginEmail: document.getElementById('loginEmail'), loginPassword: document.getElementById('loginPassword'),
    registerName: document.getElementById('registerName'), registerEmail: document.getElementById('registerEmail'), registerPassword: document.getElementById('registerPassword'),
    incomingCallModal: document.getElementById('incomingCallModal'), incomingCallAvatar: document.getElementById('incomingCallAvatar'),
    incomingCallName: document.getElementById('incomingCallName'), incomingCallType: document.getElementById('incomingCallType'), callModal: document.getElementById('callModal'),
    callUserName: document.getElementById('callUserName'), callUserAvatar: document.getElementById('callUserAvatar'), callStatus: document.getElementById('callStatus'),
    localVideo: document.getElementById('localVideo'), remoteVideo: document.getElementById('remoteVideo'), callMuteBtn: document.getElementById('callMuteBtn'),
    callVideoBtn: document.getElementById('callVideoBtn'), callTimer: document.getElementById('callTimer'), photoInput: document.getElementById('photoInput'), fileInput: document.getElementById('fileInput')
  };
  function showToast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2800); }
  function updateUI() { if (currentUser) { els.currentUserDisplayName.textContent = currentUser.displayName; els.currentUserEmail.textContent = currentUser.email; els.currentUserAvatar.innerHTML = '<i class="fas fa-user"></i>'; els.authBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>'; } else { els.currentUserDisplayName.textContent = 'Guest User'; els.currentUserEmail.textContent = 'Click to login'; els.authBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i>'; } }
  function enableChat(enabled) { els.messageInput.disabled = !enabled; els.sendButton.disabled = !enabled; els.attachBtn.disabled = !enabled; els.audioCallBtn.disabled = !enabled; els.videoCallBtn.disabled = !enabled; if (!enabled) els.messageInput.placeholder = 'Sign in to chat'; }
  function loadConversations() { if (!currentUser) return; els.conversationsList.innerHTML = ''; Object.entries(conversations).forEach(([cid, data]) => { const u = users.find(u => u.id === data.userId); if (u) addConvItem(cid, u, data); }); }
  function addConvItem(cid, user, data) { const div = document.createElement('div'); div.className = `conv-item ${currentChatId === cid ? 'active' : ''}`; div.setAttribute('data-convid', cid); div.onclick = () => selectChat(cid, user); const unread = data.unreadCount || 0; div.innerHTML = `<div class="relative"><div class="avatar avatar-sm"><i class="fas fa-${user.avatar}"></i></div><span class="status-badge ${user.status}"></span></div><div class="flex-1 min-w-0"><div class="flex justify-between"><span class="font-bold truncate">${user.name}</span><span class="text-xs opacity-70">${user.lastSeen}</span></div><p class="text-sm opacity-70 truncate">${data.lastMessage || '...'}</p></div>${unread > 0 ? `<span class="unread-badge">${unread}</span>` : ''}`; els.conversationsList.appendChild(div); }
  function selectChat(cid, user) { currentChatId = cid; currentChatUser = user; els.chatUserName.textContent = user.name; els.chatUserAvatar.innerHTML = `<i class="fas fa-${user.avatar}"></i>`; els.chatUserStatus.className = `status-badge ${user.status}`; els.chatUserStatusText.textContent = user.status === 'online' ? 'Online' : 'Offline'; els.welcomeScreen.classList.add('hidden'); els.chatMessages.classList.remove('hidden'); els.messageInput.disabled = false; if (conversations[cid]?.unreadCount) { conversations[cid].unreadCount = 0; localStorage.setItem('wavechat_conversations', JSON.stringify(conversations)); loadConversations(); } loadMessages(cid); document.querySelectorAll('.conv-item').forEach(el => el.classList.toggle('active', el.getAttribute('data-convid') === cid)); if (window.innerWidth < 768) closeSidebar(); }
  function loadMessages(cid) { els.chatMessages.innerHTML = ''; (messages[cid] || []).forEach(msg => displayMsg(msg)); scrollToBottom(); }
  function displayMsg(msg) { const isOut = msg.sender === 'current'; const row = document.createElement('div'); row.className = `msg-row ${isOut ? 'out' : ''}`; let content = msg.text; if (msg.type === 'image') content = `<img src="${msg.text}" class="max-w-full rounded-xl max-h-56 cursor-pointer" onclick="window.open(this.src)">`; else if (msg.type === 'location') content = `<i class="fas fa-map-marker-alt mr-1"></i><a href="${msg.text}" target="_blank" class="underline">My Location</a>`; else if (msg.type === 'file') content = `<i class="fas fa-paperclip mr-1"></i>${msg.text}`; if (!isOut && currentChatUser) row.innerHTML = `<div class="avatar avatar-sm mr-2"><i class="fas fa-${currentChatUser.avatar}"></i></div><div class="bubble in">${content}<div class="message-time">${msg.time}</div></div>`; else row.innerHTML = `<div class="bubble out">${content}<div class="message-time">${msg.time}</div></div>`; els.chatMessages.appendChild(row); scrollToBottom(); }
  function saveAndSend(text, type = 'text', rawUrl = null) { if (!text.trim() || !currentChatId || !currentUser) return; const newMsg = { id: Date.now(), text: rawUrl || text, sender: 'current', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type }; displayMsg(newMsg); if (!messages[currentChatId]) messages[currentChatId] = []; messages[currentChatId].push(newMsg); localStorage.setItem('wavechat_messages', JSON.stringify(messages)); if (conversations[currentChatId]) { conversations[currentChatId].lastMessage = text.substring(0, 40); conversations[currentChatId].lastMessageTime = new Date().toISOString(); localStorage.setItem('wavechat_conversations', JSON.stringify(conversations)); loadConversations(); } setTimeout(() => { const reply = { id: Date.now() + 1, text: 'Thanks for your message! 👍', sender: currentChatUser.id, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'text' }; displayMsg(reply); messages[currentChatId].push(reply); localStorage.setItem('wavechat_messages', JSON.stringify(messages)); if (conversations[currentChatId]) { conversations[currentChatId].unreadCount = (conversations[currentChatId].unreadCount || 0) + 1; localStorage.setItem('wavechat_conversations', JSON.stringify(conversations)); loadConversations(); } }, 1800); }
  function scrollToBottom() { setTimeout(() => { els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight; }, 50); }
  function loadOnlineUsers() { const online = users.filter(u => u.status === 'online'); els.onlineCount.textContent = online.length; els.onlineUsers.innerHTML = ''; online.forEach(u => { const div = document.createElement('div'); div.className = 'online-item'; div.onclick = () => { const cid = `conv_${u.id}`; selectChat(cid, u); }; div.innerHTML = `<div class="relative"><div class="avatar avatar-sm"><i class="fas fa-${u.avatar}"></i></div><span class="status-badge online"></span></div><span class="text-xs font-medium">${u.name.split(' ')[0]}</span>`; els.onlineUsers.appendChild(div); }); }
  function sendMessage() { const txt = els.messageInput.value.trim(); if (txt && currentChatId && currentUser) { saveAndSend(txt, 'text', txt); els.messageInput.value = ''; els.sendButton.disabled = true; } }
  // Auth
  function login() { const email = els.loginEmail.value; const name = email.split('@')[0]; isLoggedIn = true; localStorage.setItem('isLoggedIn', 'true'); localStorage.setItem('userName', name); localStorage.setItem('userEmail', email); currentUser = { uid: 'currentUser', displayName: name, email }; updateUI(); loadConversations(); loadOnlineUsers(); enableChat(true); els.authModal.classList.remove('active'); showToast(`Welcome ${name}`); setTimeout(() => { if (document.querySelector('.conv-item')) document.querySelector('.conv-item').click(); }, 200); }
  function register() { const name = els.registerName.value || 'User'; const email = els.registerEmail.value; isLoggedIn = true; localStorage.setItem('isLoggedIn', 'true'); localStorage.setItem('userName', name); localStorage.setItem('userEmail', email); currentUser = { uid: 'currentUser', displayName: name, email }; updateUI(); loadConversations(); loadOnlineUsers(); enableChat(true); els.authModal.classList.remove('active'); showToast(`Welcome ${name}`); setTimeout(() => { if (document.querySelector('.conv-item')) document.querySelector('.conv-item').click(); }, 200); }
  function logout() { isLoggedIn = false; localStorage.removeItem('isLoggedIn'); currentUser = null; currentChatId = null; currentChatUser = null; updateUI(); enableChat(false); els.welcomeScreen.classList.remove('hidden'); els.chatMessages.classList.add('hidden'); els.chatUserName.textContent = 'Select a chat'; loadConversations(); showToast('Logged out'); }
  // Call placeholders (functional demo)
  async function startAudioCall() { if (!currentUser || !currentChatUser) return showToast('Select a chat first'); try { localStream = await navigator.mediaDevices.getUserMedia({ audio: true }); showIncomingCall('audio'); } catch (e) { showToast('Microphone access needed'); } }
  async function startVideoCall() { if (!currentUser || !currentChatUser) return; try { localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { width: 640, height: 480 } }); showIncomingCall('video'); } catch (e) { showToast('Camera access needed'); } }
  function showIncomingCall(type) { els.incomingCallAvatar.innerHTML = `<i class="fas fa-${currentChatUser.avatar}"></i>`; els.incomingCallName.textContent = currentChatUser.name; els.incomingCallType.textContent = `Incoming ${type} call...`; els.incomingCallModal.classList.add('active'); }
  function acceptCall() { els.incomingCallModal.classList.remove('active'); if (localStream && els.localVideo) els.localVideo.srcObject = localStream; els.callUserName.textContent = currentChatUser.name; els.callUserAvatar.innerHTML = `<i class="fas fa-${currentChatUser.avatar}"></i>`; els.callStatus.textContent = 'Connected'; setTimeout(() => { const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480; const ctx = canvas.getContext('2d'); ctx.fillStyle = '#2d3748'; ctx.fillRect(0, 0, 640, 480); ctx.fillStyle = '#3b82f6'; ctx.font = 'bold 70px Inter'; ctx.fillText(currentChatUser.name.charAt(0), 280, 260); const stream = canvas.captureStream(10); els.remoteVideo.srcObject = stream; }, 800); els.callModal.classList.add('active'); startTimer(); }
  function declineCall() { if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; } els.incomingCallModal.classList.remove('active'); showToast('Call declined'); }
  function endCall() { if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; } els.callModal.classList.remove('active'); if (callTimerInterval) clearInterval(callTimerInterval); showToast('Call ended'); }
  function startTimer() { callSeconds = 0; if (callTimerInterval) clearInterval(callTimerInterval); callTimerInterval = setInterval(() => { callSeconds++; const m = Math.floor(callSeconds / 60), s = callSeconds % 60; els.callTimer.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`; }, 1000); }
  function toggleCallMute() { if (localStream) { isCallMuted = !isCallMuted; localStream.getAudioTracks().forEach(t => t.enabled = !isCallMuted); els.callMuteBtn.querySelector('i').className = isCallMuted ? 'fas fa-microphone-slash' : 'fas fa-microphone'; } }
  function toggleCallVideo() { if (localStream) { isVideoEnabled = !isVideoEnabled; localStream.getVideoTracks().forEach(t => t.enabled = isVideoEnabled); els.callVideoBtn.querySelector('i').className = isVideoEnabled ? 'fas fa-video' : 'fas fa-video-slash'; } }
  async function shareScreen() { try { const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true }); if (els.localVideo) els.localVideo.srcObject = screenStream; showToast('Screen sharing started'); } catch (e) { showToast('Screen share cancelled'); } }
  function toggleSidebar() { els.sidebar.classList.toggle('active'); els.overlay.classList.toggle('hidden'); }
  function closeSidebar() { els.sidebar.classList.remove('active'); els.overlay.classList.add('hidden'); }
  function toggleTheme() { const isDark = document.body.getAttribute('data-theme') === 'dark'; document.body.setAttribute('data-theme', isDark ? 'light' : 'dark'); localStorage.setItem('theme', isDark ? 'light' : 'dark'); els.themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>'; }
  function initTheme() { const saved = localStorage.getItem('theme'); if (saved === 'dark') { document.body.setAttribute('data-theme', 'dark'); els.themeToggle.innerHTML = '<i class="fas fa-moon"></i>'; } }
  // Attachments
  document.getElementById('photoAttach')?.addEventListener('click', () => { els.photoInput.click(); els.attachmentMenu.classList.add('hidden'); });
  document.getElementById('fileAttach')?.addEventListener('click', () => { els.fileInput.click(); els.attachmentMenu.classList.add('hidden'); });
  document.getElementById('locationAttach')?.addEventListener('click', () => { els.attachmentMenu.classList.add('hidden'); if (navigator.geolocation) navigator.geolocation.getCurrentPosition(p => { const url = `https://maps.google.com/?q=${p.coords.latitude},${p.coords.longitude}`; saveAndSend(`📍 My location: ${url}`, 'location', url); showToast('Location shared'); }); });
  els.photoInput.addEventListener('change', e => { if (e.target.files[0]) { const reader = new FileReader(); reader.onload = ev => saveAndSend(ev.target.result, 'image', ev.target.result); reader.readAsDataURL(e.target.files[0]); } });
  els.fileInput.addEventListener('change', e => { if (e.target.files[0]) { const f = e.target.files[0]; saveAndSend(`📎 File: ${f.name} (${(f.size / 1024).toFixed(1)} KB)`, 'file'); } });
  // Event binding
  els.themeToggle.addEventListener('click', toggleTheme);
  els.authBtn.addEventListener('click', () => { if (currentUser) logout(); else els.authModal.classList.add('active'); });
  document.getElementById('doLogin')?.addEventListener('click', login); document.getElementById('doRegister')?.addEventListener('click', register);
  document.querySelectorAll('.auth-tab').forEach(tab => { tab.addEventListener('click', () => { const type = tab.getAttribute('data-tab'); document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active')); document.getElementById(`${type}Form`).classList.add('active'); document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active')); tab.classList.add('active'); }); });
  els.sendButton.addEventListener('click', sendMessage); els.messageInput.addEventListener('input', () => { els.sendButton.disabled = !els.messageInput.value.trim(); }); els.messageInput.addEventListener('keypress', e => { if (e.key === 'Enter' && els.messageInput.value.trim()) sendMessage(); });
  els.attachBtn.addEventListener('click', () => els.attachmentMenu.classList.toggle('hidden'));
  els.audioCallBtn.addEventListener('click', startAudioCall); els.videoCallBtn.addEventListener('click', startVideoCall);
  document.getElementById('acceptCallBtn')?.addEventListener('click', acceptCall); document.getElementById('declineCallBtn')?.addEventListener('click', declineCall);
  document.getElementById('endCallBtn')?.addEventListener('click', endCall); document.getElementById('minimizeCallBtn')?.addEventListener('click', () => { els.callModal.classList.remove('active'); showToast('Call minimized'); });
  els.callMuteBtn?.addEventListener('click', toggleCallMute); els.callVideoBtn?.addEventListener('click', toggleCallVideo); document.getElementById('shareScreenBtn')?.addEventListener('click', shareScreen);
  document.getElementById('menuToggle')?.addEventListener('click', toggleSidebar); els.overlay?.addEventListener('click', closeSidebar); document.getElementById('profileBtn')?.addEventListener('click', () => { if (!currentUser) els.authModal.classList.add('active'); else showToast(`Profile: ${currentUser.displayName}`); });
  document.getElementById('welcomeSignIn')?.addEventListener('click', () => els.authModal.classList.add('active'));
  els.searchInput.addEventListener('input', e => { const term = e.target.value.toLowerCase(); document.querySelectorAll('.conv-item').forEach(i => { const name = i.querySelector('.font-bold')?.textContent.toLowerCase() || ''; i.style.display = name.includes(term) ? 'flex' : 'none'; }); });
  window.addEventListener('resize', () => { if (window.innerWidth >= 768) closeSidebar(); });
  initTheme();
  if (isLoggedIn) { currentUser = { uid: 'currentUser', displayName: localStorage.getItem('userName') || 'Demo', email: localStorage.getItem('userEmail') || 'demo@wavechat.com' }; updateUI(); loadConversations(); loadOnlineUsers(); enableChat(true); setTimeout(() => { if (document.querySelector('.conv-item')) document.querySelector('.conv-item').click(); }, 300); } else { enableChat(false); loadOnlineUsers(); updateUI(); }
  // Implement Web Push Notifications
async function initializeNotifications() {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const sw = await navigator.serviceWorker.register('/sw.js');
    
    // Send notification for new messages when app is in background
    function notifyNewMessage(sender, message) {
      if (!document.hasFocus()) {
        new Notification(`New message from ${sender}`, {
          body: message,
          icon: '/icon-192.png',
          badge: '/badge.png',
          vibrate: [200, 100, 200]
        });
      }
    }
  }
}
})();
