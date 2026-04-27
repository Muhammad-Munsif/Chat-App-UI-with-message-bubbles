

// WaveChat Application - Fully Fixed Version
(function () {
  // ==================== STATE ====================
  let currentUser = null;
  let currentChatId = null;
  let currentChatUser = null;
  let localStream = null;
  let callTimerInterval = null;
  let callSeconds = 0;
  let isCallMuted = false;
  let isVideoEnabled = true;

  // Demo users data
  const demoUsers = [
    { id: 'user1', name: 'John Doe', avatar: 'user-tie', status: 'online', lastSeen: 'now', email: 'john@example.com' },
    { id: 'user2', name: 'Alice Smith', avatar: 'user-graduate', status: 'online', lastSeen: '2m', email: 'alice@example.com' },
    { id: 'user3', name: 'Mike Johnson', avatar: 'user-ninja', status: 'away', lastSeen: '30m', email: 'mike@example.com' },
    { id: 'user4', name: 'Sarah Brown', avatar: 'user-astronaut', status: 'offline', lastSeen: '2h', email: 'sarah@example.com' }
  ];

  // Load or initialize messages
  let messages = JSON.parse(localStorage.getItem('wavechat_messages'));
  if (!messages) {
    messages = {
      'conv_user1': [
        { id: 1, text: 'Hey! How are you?', sender: 'user1', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'text' },
        { id: 2, text: 'Welcome to WaveChat! Start messaging now.', sender: 'user1', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'text' }
      ],
      'conv_user2': [
        { id: 1, text: 'Hi there! Ready to chat?', sender: 'user2', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'text' }
      ],
      'conv_user3': [
        { id: 1, text: 'Project files are ready for review', sender: 'user3', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'text' }
      ]
    };
    localStorage.setItem('wavechat_messages', JSON.stringify(messages));
  }

  // Load or initialize conversations
  let conversations = JSON.parse(localStorage.getItem('wavechat_conversations'));
  if (!conversations) {
    conversations = {};
    demoUsers.forEach(u => {
      conversations[`conv_${u.id}`] = {
        userId: u.id,
        lastMessage: u.id === 'user1' ? 'Hey! How are you?' : 'Hello! Ready to chat?',
        lastMessageTime: new Date().toISOString(),
        unreadCount: u.id === 'user1' ? 1 : 0
      };
    });
    localStorage.setItem('wavechat_conversations', JSON.stringify(conversations));
  }

  // DOM Elements
  const authContainer = document.getElementById('authContainer');
  const mainApp = document.getElementById('mainApp');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const themeToggle = document.getElementById('themeToggle');
  const logoutBtn = document.getElementById('logoutBtn');
  const onlineUsers = document.getElementById('onlineUsers');
  const conversationsList = document.getElementById('conversationsList');
  const welcomeScreen = document.getElementById('welcomeScreen');
  const chatMessages = document.getElementById('chatMessages');
  const messagesContainer = document.getElementById('messagesContainer');
  const currentUserDisplayName = document.getElementById('currentUserDisplayName');
  const currentUserEmail = document.getElementById('currentUserEmail');
  const chatUserName = document.getElementById('chatUserName');
  const chatUserAvatar = document.getElementById('chatUserAvatar');
  const chatUserStatus = document.getElementById('chatUserStatus');
  const chatUserStatusText = document.getElementById('chatUserStatusText');
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  const attachBtn = document.getElementById('attachBtn');
  const audioCallBtn = document.getElementById('audioCallBtn');
  const videoCallBtn = document.getElementById('videoCallBtn');
  const attachmentMenu = document.getElementById('attachmentMenu');
  const searchInput = document.getElementById('searchInput');
  const onlineCount = document.getElementById('onlineCount');
  const menuToggle = document.getElementById('menuToggle');
  const profileBtn = document.getElementById('profileBtn');
  const welcomeSignIn = document.getElementById('welcomeSignIn');

  // Call modal elements
  const incomingCallModal = document.getElementById('incomingCallModal');
  const incomingCallAvatar = document.getElementById('incomingCallAvatar');
  const incomingCallName = document.getElementById('incomingCallName');
  const incomingCallType = document.getElementById('incomingCallType');
  const callModal = document.getElementById('callModal');
  const callUserName = document.getElementById('callUserName');
  const callUserAvatar = document.getElementById('callUserAvatar');
  const callStatus = document.getElementById('callStatus');
  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');
  const callMuteBtn = document.getElementById('callMuteBtn');
  const callVideoBtn = document.getElementById('callVideoBtn');
  const callTimer = document.getElementById('callTimer');
  const acceptCallBtn = document.getElementById('acceptCallBtn');
  const declineCallBtn = document.getElementById('declineCallBtn');
  const endCallBtn = document.getElementById('endCallBtn');
  const minimizeCallBtn = document.getElementById('minimizeCallBtn');
  const shareScreenBtn = document.getElementById('shareScreenBtn');

  // File inputs
  const photoInput = document.getElementById('photoInput');
  const fileInput = document.getElementById('fileInput');

  // Helper Functions
  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2800);
  }

  function scrollToBottom() {
    setTimeout(() => {
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function (m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }

  function updateUI() {
    if (currentUser) {
      currentUserDisplayName.textContent = currentUser.displayName;
      currentUserEmail.textContent = currentUser.email;
    }
  }

  function loadConversations() {
    if (!conversationsList) return;
    conversationsList.innerHTML = '';
    Object.entries(conversations).forEach(([cid, data]) => {
      const u = demoUsers.find(u => u.id === data.userId);
      if (u) addConvItem(cid, u, data);
    });
  }

  function addConvItem(cid, user, data) {
    const div = document.createElement('div');
    div.className = `conv-item ${currentChatId === cid ? 'active' : ''}`;
    div.setAttribute('data-convid', cid);
    div.onclick = () => selectChat(cid, user);
    const unread = data.unreadCount || 0;
    div.innerHTML = `<div class="relative"><div class="avatar avatar-sm"><i class="fas fa-${user.avatar}"></i></div><span class="status-badge ${user.status}"></span></div><div class="flex-1 min-w-0"><div class="flex justify-between items-center"><span class="font-bold truncate">${escapeHtml(user.name)}</span><span class="text-xs opacity-70">${user.lastSeen}</span></div><p class="text-sm opacity-70 truncate">${escapeHtml((data.lastMessage || 'Say hello!').substring(0, 40))}</p></div>${unread > 0 ? `<span class="unread-badge">${unread}</span>` : ''}`;
    conversationsList.appendChild(div);
  }

  function selectChat(cid, user) {
    if (!user) return;
    currentChatId = cid;
    currentChatUser = user;
    chatUserName.textContent = user.name;
    chatUserAvatar.innerHTML = `<i class="fas fa-${user.avatar}"></i>`;
    chatUserStatus.className = `status-badge ${user.status}`;
    chatUserStatusText.textContent = user.status === 'online' ? 'Online' : user.status === 'away' ? 'Away' : 'Offline';
    welcomeScreen.classList.add('hidden');
    chatMessages.classList.remove('hidden');

    if (conversations[cid]?.unreadCount) {
      conversations[cid].unreadCount = 0;
      localStorage.setItem('wavechat_conversations', JSON.stringify(conversations));
      loadConversations();
    }
    loadMessages(cid);

    document.querySelectorAll('.conv-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-convid') === cid);
    });
    if (window.innerWidth < 768) closeSidebar();
  }

  function loadMessages(cid) {
    if (!chatMessages) return;
    chatMessages.innerHTML = '';
    const msgs = messages[cid] || [];
    msgs.forEach(msg => displayMsg(msg));
    scrollToBottom();
  }

  function displayMsg(msg) {
    const isOut = msg.sender === 'current';
    const row = document.createElement('div');
    row.className = `msg-row ${isOut ? 'out' : ''}`;
    let content = escapeHtml(msg.text);

    if (msg.type === 'image') {
      content = `<img src="${msg.text}" class="max-w-full rounded-xl max-h-56 cursor-pointer" onclick="window.open(this.src)">`;
    } else if (msg.type === 'location') {
      content = `<i class="fas fa-map-marker-alt mr-1"></i><a href="${msg.text}" target="_blank" class="underline">My Location</a>`;
    } else if (msg.type === 'file') {
      content = `<i class="fas fa-paperclip mr-1"></i>${escapeHtml(msg.text)}`;
    }

    if (!isOut && currentChatUser) {
      row.innerHTML = `<div class="avatar avatar-sm mr-2"><i class="fas fa-${currentChatUser.avatar}"></i></div><div class="bubble in">${content}<div class="message-time">${msg.time}</div></div>`;
    } else {
      row.innerHTML = `<div class="bubble out">${content}<div class="message-time">${msg.time}</div></div>`;
    }
    chatMessages.appendChild(row);
    scrollToBottom();
  }

  function saveAndSend(text, type = 'text', rawUrl = null) {
    if (!text.trim() || !currentChatId || !currentUser) return false;

    const newMsg = {
      id: Date.now(),
      text: rawUrl || text,
      sender: 'current',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: type
    };
    displayMsg(newMsg);

    if (!messages[currentChatId]) messages[currentChatId] = [];
    messages[currentChatId].push(newMsg);
    localStorage.setItem('wavechat_messages', JSON.stringify(messages));

    if (conversations[currentChatId]) {
      conversations[currentChatId].lastMessage = text.substring(0, 40);
      conversations[currentChatId].lastMessageTime = new Date().toISOString();
      localStorage.setItem('wavechat_conversations', JSON.stringify(conversations));
      loadConversations();
    }

    // Auto-reply simulation
    setTimeout(() => {
      if (currentChatUser) {
        const reply = {
          id: Date.now() + 1,
          text: 'Thanks for your message! 👍',
          sender: currentChatUser.id,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'text'
        };
        displayMsg(reply);
        messages[currentChatId].push(reply);
        localStorage.setItem('wavechat_messages', JSON.stringify(messages));
        if (conversations[currentChatId]) {
          conversations[currentChatId].unreadCount = (conversations[currentChatId].unreadCount || 0) + 1;
          localStorage.setItem('wavechat_conversations', JSON.stringify(conversations));
          loadConversations();
        }
      }
    }, 1500);

    return true;
  }

  function sendMessage() {
    const txt = messageInput.value.trim();
    if (txt && currentChatId && currentUser) {
      saveAndSend(txt, 'text', txt);
      messageInput.value = '';
    }
  }

  function loadOnlineUsers() {
    const online = demoUsers.filter(u => u.status === 'online');
    onlineCount.textContent = online.length;
    onlineUsers.innerHTML = '';
    online.forEach(u => {
      const div = document.createElement('div');
      div.className = 'online-item';
      div.onclick = () => { const cid = `conv_${u.id}`; selectChat(cid, u); };
      div.innerHTML = `<div class="relative"><div class="avatar avatar-sm"><i class="fas fa-${u.avatar}"></i></div><span class="status-badge online"></span></div><span class="text-xs font-medium">${u.name.split(' ')[0]}</span>`;
      onlineUsers.appendChild(div);
    });
  }

  // Auth Functions
  function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      showToast('Please enter email and password');
      return;
    }

    const name = email.split('@')[0];
    currentUser = { uid: 'currentUser', displayName: name, email: email };

    localStorage.setItem('wavechat_current_user', JSON.stringify(currentUser));
    localStorage.setItem('wavechat_logged_in', 'true');

    updateUI();
    loadConversations();
    loadOnlineUsers();

    authContainer.classList.add('hidden');
    mainApp.classList.add('active');

    showToast(`Welcome ${name}!`);

    setTimeout(() => {
      const firstConv = document.querySelector('.conv-item');
      if (firstConv) firstConv.click();
    }, 200);
  }

  function register() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    if (!name || !email || !password) {
      showToast('Please fill all fields');
      return;
    }

    currentUser = { uid: 'currentUser', displayName: name, email: email };

    localStorage.setItem('wavechat_current_user', JSON.stringify(currentUser));
    localStorage.setItem('wavechat_logged_in', 'true');

    updateUI();
    loadConversations();
    loadOnlineUsers();

    authContainer.classList.add('hidden');
    mainApp.classList.add('active');

    showToast(`Welcome ${name}!`);

    setTimeout(() => {
      const firstConv = document.querySelector('.conv-item');
      if (firstConv) firstConv.click();
    }, 200);
  }

  function logout() {
    currentUser = null;
    currentChatId = null;
    currentChatUser = null;

    localStorage.removeItem('wavechat_current_user');
    localStorage.removeItem('wavechat_logged_in');

    authContainer.classList.remove('hidden');
    mainApp.classList.remove('active');

    showToast('Logged out successfully');
  }

  // Call Functions
  async function startAudioCall() {
    if (!currentUser || !currentChatUser) return showToast('Select a chat first');
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      showIncomingCall('audio');
    } catch (e) { showToast('Microphone access needed'); }
  }

  async function startVideoCall() {
    if (!currentUser || !currentChatUser) return showToast('Select a chat first');
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { width: 640, height: 480 } });
      showIncomingCall('video');
    } catch (e) { showToast('Camera access needed'); }
  }

  function showIncomingCall(type) {
    incomingCallAvatar.innerHTML = `<i class="fas fa-${currentChatUser.avatar}"></i>`;
    incomingCallName.textContent = currentChatUser.name;
    incomingCallType.textContent = `Incoming ${type} call...`;
    incomingCallModal.classList.add('active');
  }

  function acceptCall() {
    incomingCallModal.classList.remove('active');
    if (localStream && localVideo) localVideo.srcObject = localStream;
    callUserName.textContent = currentChatUser.name;
    callUserAvatar.innerHTML = `<i class="fas fa-${currentChatUser.avatar}"></i>`;
    callStatus.textContent = 'Connected';

    setTimeout(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 640; canvas.height = 480;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 70px Inter';
      ctx.fillText(currentChatUser.name.charAt(0), 280, 260);
      const stream = canvas.captureStream(10);
      if (remoteVideo) remoteVideo.srcObject = stream;
    }, 500);

    callModal.classList.add('active');
    startCallTimer();
  }

  function declineCall() {
    if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
    incomingCallModal.classList.remove('active');
    showToast('Call declined');
  }

  function endCall() {
    if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
    callModal.classList.remove('active');
    if (callTimerInterval) clearInterval(callTimerInterval);
    showToast('Call ended');
  }

  function startCallTimer() {
    callSeconds = 0;
    if (callTimerInterval) clearInterval(callTimerInterval);
    callTimerInterval = setInterval(() => {
      callSeconds++;
      const m = Math.floor(callSeconds / 60), s = callSeconds % 60;
      callTimer.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }, 1000);
  }

  function toggleCallMute() {
    if (localStream) {
      isCallMuted = !isCallMuted;
      localStream.getAudioTracks().forEach(t => t.enabled = !isCallMuted);
      const icon = callMuteBtn.querySelector('i');
      if (icon) icon.className = isCallMuted ? 'fas fa-microphone-slash' : 'fas fa-microphone';
    }
  }

  function toggleCallVideo() {
    if (localStream) {
      isVideoEnabled = !isVideoEnabled;
      localStream.getVideoTracks().forEach(t => t.enabled = isVideoEnabled);
      const icon = callVideoBtn.querySelector('i');
      if (icon) icon.className = isVideoEnabled ? 'fas fa-video' : 'fas fa-video-slash';
    }
  }

  async function shareScreen() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      if (localVideo) localVideo.srcObject = screenStream;
      showToast('Screen sharing started');
    } catch (e) { showToast('Screen share cancelled'); }
  }

  // UI Functions
  function toggleSidebar() { sidebar.classList.toggle('active'); overlay.classList.toggle('hidden'); }
  function closeSidebar() { sidebar.classList.remove('active'); overlay.classList.add('hidden'); }

  function toggleTheme() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    const icon = themeToggle.querySelector('i');
    if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
  }

  function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
      const icon = themeToggle.querySelector('i');
      if (icon) icon.className = 'fas fa-moon';
    }
  }

  function checkLoginStatus() {
    const loggedIn = localStorage.getItem('wavechat_logged_in') === 'true';
    const savedUser = localStorage.getItem('wavechat_current_user');

    if (loggedIn && savedUser) {
      currentUser = JSON.parse(savedUser);
      updateUI();
      loadConversations();
      loadOnlineUsers();
      authContainer.classList.add('hidden');
      mainApp.classList.add('active');
      setTimeout(() => {
        const firstConv = document.querySelector('.conv-item');
        if (firstConv) firstConv.click();
      }, 300);
    }
  }

  // Initialize Event Listeners
  function init() {
    initTheme();
    checkLoginStatus();

    // Auth events
    document.getElementById('doLogin')?.addEventListener('click', login);
    document.getElementById('doRegister')?.addEventListener('click', register);

    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const type = tab.getAttribute('data-tab');
        document.getElementById('loginForm').classList.toggle('hidden', type !== 'login');
        document.getElementById('registerForm').classList.toggle('hidden', type !== 'register');
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });

    // Main app events
    themeToggle?.addEventListener('click', toggleTheme);
    logoutBtn?.addEventListener('click', logout);
    sendButton?.addEventListener('click', sendMessage);
    messageInput?.addEventListener('keypress', e => { if (e.key === 'Enter' && messageInput.value.trim()) sendMessage(); });
    attachBtn?.addEventListener('click', () => attachmentMenu?.classList.toggle('hidden'));
    audioCallBtn?.addEventListener('click', startAudioCall);
    videoCallBtn?.addEventListener('click', startVideoCall);
    acceptCallBtn?.addEventListener('click', acceptCall);
    declineCallBtn?.addEventListener('click', declineCall);
    endCallBtn?.addEventListener('click', endCall);
    minimizeCallBtn?.addEventListener('click', () => { callModal.classList.remove('active'); showToast('Call minimized'); });
    callMuteBtn?.addEventListener('click', toggleCallMute);
    callVideoBtn?.addEventListener('click', toggleCallVideo);
    shareScreenBtn?.addEventListener('click', shareScreen);
    menuToggle?.addEventListener('click', toggleSidebar);
    overlay?.addEventListener('click', closeSidebar);
    profileBtn?.addEventListener('click', () => showToast(`Profile: ${currentUser?.displayName || 'Guest'}`));

    if (welcomeSignIn) {
      welcomeSignIn.addEventListener('click', () => authContainer.classList.remove('hidden'));
    }

    searchInput?.addEventListener('input', e => {
      const term = e.target.value.toLowerCase();
      document.querySelectorAll('.conv-item').forEach(i => {
        const name = i.querySelector('.font-bold')?.textContent.toLowerCase() || '';
        i.style.display = name.includes(term) ? 'flex' : 'none';
      });
    });

    window.addEventListener('resize', () => { if (window.innerWidth >= 768) closeSidebar(); });

    document.addEventListener('click', (e) => {
      if (attachmentMenu && attachBtn && !attachmentMenu.contains(e.target) && !attachBtn.contains(e.target)) {
        attachmentMenu.classList.add('hidden');
      }
    });

    // Attachment handlers
    document.getElementById('photoAttach')?.addEventListener('click', () => {
      photoInput.click();
      attachmentMenu.classList.add('hidden');
    });

    document.getElementById('fileAttach')?.addEventListener('click', () => {
      fileInput.click();
      attachmentMenu.classList.add('hidden');
    });

    document.getElementById('locationAttach')?.addEventListener('click', () => {
      attachmentMenu.classList.add('hidden');
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(p => {
          const url = `https://maps.google.com/?q=${p.coords.latitude},${p.coords.longitude}`;
          saveAndSend(`📍 My location`, 'location', url);
          showToast('Location shared');
        }, () => showToast('Unable to get location'));
      } else showToast('Geolocation not supported');
    });

    photoInput?.addEventListener('change', e => {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = ev => saveAndSend('📷 Photo', 'image', ev.target.result);
        reader.readAsDataURL(e.target.files[0]);
      }
    });

    fileInput?.addEventListener('change', e => {
      if (e.target.files && e.target.files[0]) {
        const f = e.target.files[0];
        saveAndSend(`📎 File: ${f.name} (${(f.size / 1024).toFixed(1)} KB)`, 'file');
      }
    });
  }

  // Start the app
  init();

  // Add error boundaries and better error handling
window.addEventListener('error', function(e) {
  console.error('Global error:', e.error);
  showToast('Something went wrong. Please refresh the page.');
});

// Add connection status monitoring
window.addEventListener('online', () => showToast('Back online! 📶'));
window.addEventListener('offline', () => showToast('No internet connection 🔴'));

// Add message retry on failure
class MessageQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }
  
  async addMessage(message) {
    this.queue.push(message);
    if (!this.isProcessing) this.processQueue();
  }
  
  async processQueue() {
    this.isProcessing = true;
    while (this.queue.length > 0) {
      const msg = this.queue[0];
      try {
        await this.sendMessage(msg);
        this.queue.shift();
      } catch (error) {
        console.error('Failed to send:', error);
        break;
      }
    }
    this.isProcessing = false;
  }
}
// Add reaction picker to messages
function addReactionPicker(messageElement, messageId) {
  const reactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  const reactionBar = document.createElement('div');
  reactionBar.className = 'reaction-bar hidden absolute -top-10 left-0 bg-surface rounded-full shadow-lg p-2 flex gap-2';
  
  reactions.forEach(emoji => {
    const btn = document.createElement('button');
    btn.textContent = emoji;
    btn.className = 'w-8 h-8 hover:scale-125 transition';
    btn.onclick = () => addReaction(messageId, emoji);
    reactionBar.appendChild(btn);
  });
  
  messageElement.appendChild(reactionBar);
  messageElement.addEventListener('mouseenter', () => reactionBar.classList.remove('hidden'));
  messageElement.addEventListener('mouseleave', () => reactionBar.classList.add('hidden'));
}

  // Show when user is typing
let typingTimeout;
messageInput.addEventListener('input', () => {
  if (currentChatUser) {
    // Send typing event to other user
    socket.emit('typing', { userId: currentChatUser.id, isTyping: true });
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit('typing', { userId: currentChatUser.id, isTyping: false });
    }, 1000);
  }
});

// Display typing indicator
function showTypingIndicator(userName) {
  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator-container';
  indicator.innerHTML = `
    <div class="flex items-center gap-2 text-sm text-secondary">
      <div class="typing-indicator"><span></span><span></span><span></span></div>
      <span>${userName} is typing...</span>
    </div>
  `;
  messagesContainer.appendChild(indicator);
  scrollToBottom();
  setTimeout(() => indicator.remove(), 3000);
}
})();
