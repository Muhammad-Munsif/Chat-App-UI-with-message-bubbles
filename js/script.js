
    // Firebase Configuration
    const firebaseConfig = {
      apiKey: "AIzaSyB7kM3XqW5K9Q2z8xL4p6vN8yR2tF3gH5j",
      authDomain: "wavechat-demo.firebaseapp.com",
      projectId: "wavechat-demo",
      storageBucket: "wavechat-demo.appspot.com",
      messagingSenderId: "123456789012",
      appId: "1:123456789012:web:abc123def456ghi789jkl"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();
    const storage = firebase.storage();

    // ==================== STATE MANAGEMENT ====================
    let currentUser = null;
    let currentChatId = null;
    let currentChatUser = null;
    let isMobile = window.innerWidth < 768;
    let isDark = localStorage.getItem('theme') === 'dark';
    let isNotificationMuted = localStorage.getItem('notificationMute') === 'true';
    let isCallMuted = false;
    let isVideoEnabled = true;
    let localStream = null;
    let peerConnection = null;
    let callTimer = null;
    let callSeconds = 0;
    let messageListener = null;
    let typingTimeout = null;

    // DOM elements
    const els = {
      body: document.body,
      sidebar: document.getElementById('sidebar'),
      overlay: document.getElementById('overlay'),
      themeToggle: document.getElementById('themeToggle'),
      authBtn: document.getElementById('authBtn'),
      onlineUsers: document.getElementById('onlineUsers'),
      conversationsList: document.getElementById('conversationsList'),
      welcomeScreen: document.getElementById('welcomeScreen'),
      chatMessages: document.getElementById('chatMessages'),
      messagesContainer: document.getElementById('messagesContainer'),
      currentUserAvatar: document.getElementById('currentUserAvatar'),
      currentUserDisplayName: document.getElementById('currentUserDisplayName'),
      currentUserEmail: document.getElementById('currentUserEmail'),
      currentUserStatus: document.getElementById('currentUserStatus'),
      chatUserName: document.getElementById('chatUserName'),
      chatUserAvatar: document.getElementById('chatUserAvatar'),
      chatUserStatus: document.getElementById('chatUserStatus'),
      chatUserStatusText: document.getElementById('chatUserStatusText'),
      messageInput: document.getElementById('messageInput'),
      sendButton: document.getElementById('sendButton'),
      attachBtn: document.getElementById('attachBtn'),
      audioCallBtn: document.getElementById('audioCallBtn'),
      videoCallBtn: document.getElementById('videoCallBtn'),
      attachmentMenu: document.getElementById('attachmentMenu'),
      searchInput: document.getElementById('searchInput'),
      onlineCount: document.getElementById('onlineCount'),

      // Auth modal
      authModal: document.getElementById('authModal'),
      loginForm: document.getElementById('loginForm'),
      registerForm: document.getElementById('registerForm'),
      loginEmail: document.getElementById('loginEmail'),
      loginPassword: document.getElementById('loginPassword'),
      registerName: document.getElementById('registerName'),
      registerEmail: document.getElementById('registerEmail'),
      registerPassword: document.getElementById('registerPassword'),

      // Call modals
      incomingCallModal: document.getElementById('incomingCallModal'),
      incomingCallAvatar: document.getElementById('incomingCallAvatar'),
      incomingCallName: document.getElementById('incomingCallName'),
      incomingCallType: document.getElementById('incomingCallType'),
      callModal: document.getElementById('callModal'),
      callUserName: document.getElementById('callUserName'),
      callUserAvatar: document.getElementById('callUserAvatar'),
      callStatus: document.getElementById('callStatus'),
      localVideo: document.getElementById('localVideo'),
      remoteVideo: document.getElementById('remoteVideo'),
      callMuteBtn: document.getElementById('callMuteBtn'),
      callVideoBtn: document.getElementById('callVideoBtn'),
      callTimer: document.getElementById('callTimer'),

      // File inputs
      photoInput: document.getElementById('photoInput'),
      fileInput: document.getElementById('fileInput')
    };

    // ==================== AUTHENTICATION ====================
    auth.onAuthStateChanged((user) => {
      if (user) {
        currentUser = user;
        updateUserUI(user);
        loadConversations();
        loadOnlineUsers();
        enableChatFeatures(true);
        showToast(`👋 Welcome, ${user.displayName || 'User'}!`);
      } else {
        currentUser = null;
        updateUserUI(null);
        enableChatFeatures(false);
        els.welcomeScreen.classList.remove('hidden');
        els.chatMessages.classList.add('hidden');
      }
    });

    function updateUserUI(user) {
      if (user) {
        els.currentUserAvatar.innerHTML = `<i class="fas fa-user"></i>`;
        els.currentUserDisplayName.textContent = user.displayName || 'User';
        els.currentUserEmail.textContent = user.email || '';
        els.currentUserStatus.className = 'status-badge online';
        els.authBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
        els.authBtn.onclick = logout;
      } else {
        els.currentUserAvatar.innerHTML = '<i class="fas fa-user"></i>';
        els.currentUserDisplayName.textContent = 'Guest User';
        els.currentUserEmail.textContent = 'Click to login';
        els.currentUserStatus.className = 'status-badge offline';
        els.authBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i>';
        els.authBtn.onclick = showAuthModal;
      }
    }

    function enableChatFeatures(enabled) {
      els.messageInput.disabled = !enabled;
      els.sendButton.disabled = !enabled;
      els.attachBtn.disabled = !enabled;
      els.audioCallBtn.disabled = !enabled;
      els.videoCallBtn.disabled = !enabled;

      if (!enabled) {
        els.messageInput.placeholder = 'Sign in to chat';
      }
    }

    function showAuthModal() {
      els.authModal.classList.remove('hidden');
    }

    function hideAuthModal() {
      els.authModal.classList.add('hidden');
    }

    function switchAuthTab(tab) {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

      if (tab === 'login') {
        document.querySelector('.auth-tab[onclick="switchAuthTab(\'login\')"]').classList.add('active');
        els.loginForm.classList.add('active');
      } else {
        document.querySelector('.auth-tab[onclick="switchAuthTab(\'register\')"]').classList.add('active');
        els.registerForm.classList.add('active');
      }
    }

    async function login() {
      const email = els.loginEmail.value;
      const password = els.loginPassword.value;

      try {
        await auth.signInWithEmailAndPassword(email, password);
        hideAuthModal();
        showToast('✅ Login successful!');
      } catch (error) {
        // Demo login for testing
        if (email === 'demo@example.com' && password === 'password') {
          await auth.signInWithEmailAndPassword('demo@example.com', 'password')
            .catch(async () => {
              await auth.createUserWithEmailAndPassword('demo@example.com', 'password');
              await auth.currentUser.updateProfile({ displayName: 'Demo User' });
            });
          hideAuthModal();
          showToast('✅ Demo login successful!');
        } else {
          showToast('❌ Login failed: ' + error.message);
        }
      }
    }

    async function register() {
      const name = els.registerName.value;
      const email = els.registerEmail.value;
      const password = els.registerPassword.value;

      try {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        await result.user.updateProfile({ displayName: name });
        hideAuthModal();
        showToast('✅ Registration successful!');
      } catch (error) {
        showToast('❌ Registration failed: ' + error.message);
      }
    }

    async function logout() {
      await auth.signOut();
      showToast('👋 Logged out');
    }

    // ==================== CONVERSATIONS ====================
    async function loadConversations() {
      if (!currentUser) return;

      const conversationsRef = db.collection('conversations')
        .where('participants', 'array-contains', currentUser.uid)
        .orderBy('lastMessageTime', 'desc');

      const snapshot = await conversationsRef.get();
      els.conversationsList.innerHTML = '';

      if (snapshot.empty) {
        // Create demo conversations
        createDemoConversations();
        return;
      }

      snapshot.forEach(doc => {
        const data = doc.data();
        const otherUserId = data.participants.find(id => id !== currentUser.uid);
        addConversationToList(doc.id, otherUserId, data);
      });
    }

    async function createDemoConversations() {
      const demoUsers = [
        { id: 'user1', name: 'John Doe', avatar: 'user-tie', status: 'online', lastSeen: 'now' },
        { id: 'user2', name: 'Alice Smith', avatar: 'user-graduate', status: 'online', lastSeen: '2m' },
        { id: 'user3', name: 'Mike Johnson', avatar: 'user-ninja', status: 'away', lastSeen: '30m' },
        { id: 'user4', name: 'Sarah Brown', avatar: 'user-astronaut', status: 'offline', lastSeen: '2h' }
      ];

      for (const user of demoUsers) {
        const convRef = db.collection('conversations').doc();
        await convRef.set({
          participants: [currentUser.uid, user.id],
          lastMessage: 'Start a conversation',
          lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
          unreadCount: 0
        });

        // Add some demo messages
        const messagesRef = convRef.collection('messages');
        await messagesRef.add({
          text: `Hey! How are you?`,
          senderId: user.id,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          type: 'text'
        });

        addConversationToList(convRef.id, user.id, {
          lastMessage: 'Start a conversation',
          unreadCount: 0,
          user: user
        });
      }
    }

    function addConversationToList(convId, userId, data) {
      const user = data.user || {
        name: userId === 'user1' ? 'John Doe' :
          userId === 'user2' ? 'Alice Smith' :
            userId === 'user3' ? 'Mike Johnson' : 'Sarah Brown',
        avatar: userId === 'user1' ? 'user-tie' :
          userId === 'user2' ? 'user-graduate' :
            userId === 'user3' ? 'user-ninja' : 'user-astronaut',
        status: userId === 'user1' ? 'online' :
          userId === 'user2' ? 'online' :
            userId === 'user3' ? 'away' : 'offline'
      };

      const div = document.createElement('div');
      div.className = `conv-item ${currentChatId === convId ? 'active' : ''}`;
      div.setAttribute('data-convid', convId);
      div.setAttribute('data-userid', userId);
      div.onclick = () => selectChat(convId, userId, user);

      div.innerHTML = `
        <div class="relative">
          <div class="avatar avatar-sm"><i class="fas fa-${user.avatar}"></i></div>
          <span class="status-badge ${user.status}"></span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-center">
            <span class="font-bold truncate">${user.name}</span>
            <span class="text-xs opacity-70">${user.lastSeen || 'now'}</span>
          </div>
          <p class="text-sm opacity-70 truncate">${data.lastMessage || 'No messages'}</p>
        </div>
        ${data.unreadCount ? '<span class="unread-badge">' + data.unreadCount + '</span>' : ''}
      `;

      els.conversationsList.appendChild(div);
    }

    async function selectChat(convId, userId, user) {
      currentChatId = convId;
      currentChatUser = user;

      els.chatUserName.textContent = user.name;
      els.chatUserAvatar.innerHTML = `<i class="fas fa-${user.avatar}"></i>`;
      els.chatUserStatus.className = `status-badge ${user.status}`;
      els.chatUserStatusText.textContent = user.status === 'online' ? 'Online' : 'Offline';

      els.welcomeScreen.classList.add('hidden');
      els.chatMessages.classList.remove('hidden');
      els.messageInput.disabled = false;
      els.messageInput.placeholder = `Message ${user.name}`;

      // Load messages
      loadMessages(convId);

      // Update active state
      document.querySelectorAll('.conv-item').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-convid') === convId);
      });

      if (isMobile) closeSidebar();
    }

    // ==================== MESSAGES ====================
    async function loadMessages(convId) {
      if (messageListener) {
        messageListener();
      }

      const messagesRef = db.collection('conversations').doc(convId).collection('messages')
        .orderBy('timestamp', 'asc');

      messageListener = messagesRef.onSnapshot((snapshot) => {
        els.chatMessages.innerHTML = '';

        snapshot.forEach(doc => {
          const msg = doc.data();
          displayMessage(msg);
        });

        els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight;
      });
    }

    function displayMessage(msg) {
      const isOutgoing = msg.senderId === currentUser?.uid;
      const row = document.createElement('div');
      row.className = `msg-row ${isOutgoing ? 'out' : ''}`;

      let content = msg.text;
      if (msg.type === 'image') {
        content = `<img src="${msg.url}" class="max-w-full rounded-lg max-h-64 cursor-pointer" onclick="window.open('${msg.url}')">`;
      } else if (msg.type === 'file') {
        content = `<a href="${msg.url}" target="_blank" class="flex items-center gap-2 bg-surface p-2 rounded-lg"><i class="fas fa-file"></i> ${msg.fileName}</a>`;
      }

      const time = msg.timestamp?.toDate().toLocaleTimeString() || new Date().toLocaleTimeString();

      if (!isOutgoing && currentChatUser) {
        row.innerHTML = `
          <div class="avatar avatar-sm mr-2"><i class="fas fa-${currentChatUser.avatar}"></i></div>
          <div class="bubble in">${content}<div class="message-time">${time}</div></div>
        `;
      } else {
        row.innerHTML = `<div class="bubble out">${content}<div class="message-time">${time}</div></div>`;
      }

      els.chatMessages.appendChild(row);
    }

    async function sendMessage() {
      const text = els.messageInput.value.trim();
      if (!text || !currentChatId || !currentUser) return;

      const messagesRef = db.collection('conversations').doc(currentChatId).collection('messages');

      await messagesRef.add({
        text: text,
        senderId: currentUser.uid,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        type: 'text'
      });

      // Update last message in conversation
      await db.collection('conversations').doc(currentChatId).update({
        lastMessage: text,
        lastMessageTime: firebase.firestore.FieldValue.serverTimestamp()
      });

      els.messageInput.value = '';
      els.sendButton.disabled = true;

      // Simulate typing and reply
      showTypingIndicator();
      setTimeout(async () => {
        hideTypingIndicator();

        await messagesRef.add({
          text: 'Got it! Thanks for the message 👍',
          senderId: currentChatUser.id,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          type: 'text'
        });
      }, 2000);
    }

    function showTypingIndicator() {
      const indicator = document.createElement('div');
      indicator.className = 'msg-row';
      indicator.id = 'typingIndicator';
      indicator.innerHTML = `
        <div class="avatar avatar-sm mr-2"><i class="fas fa-${currentChatUser.avatar}"></i></div>
        <div class="typing-indicator"><span></span><span></span><span></span></div>
      `;
      els.chatMessages.appendChild(indicator);
      els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight;
    }

    function hideTypingIndicator() {
      document.getElementById('typingIndicator')?.remove();
    }

    // ==================== ONLINE USERS ====================
    async function loadOnlineUsers() {
      // Simulate online users
      const online = [
        { id: 'user1', name: 'John', avatar: 'user-tie' },
        { id: 'user2', name: 'Alice', avatar: 'user-graduate' },
        { id: 'user3', name: 'Mike', avatar: 'user-ninja' }
      ];

      els.onlineCount.textContent = online.length;
      els.onlineUsers.innerHTML = '';

      online.forEach(user => {
        const div = document.createElement('div');
        div.className = 'online-item';
        div.onclick = () => {
          // Find or create conversation
          const convId = 'conv_' + user.id;
          selectChat(convId, user.id, {
            name: user.name,
            avatar: user.avatar,
            status: 'online'
          });
        };
        div.innerHTML = `
          <div class="relative">
            <div class="avatar avatar-sm"><i class="fas fa-${user.avatar}"></i></div>
            <span class="status-badge online"></span>
          </div>
          <span class="text-xs font-medium">${user.name}</span>
        `;
        els.onlineUsers.appendChild(div);
      });
    }

    // ==================== FILE UPLOADS ====================
    window.handlePhotoUpload = () => {
      els.attachmentMenu.classList.add('hidden');
      els.photoInput.click();
    };

    window.handleFileUpload = () => {
      els.attachmentMenu.classList.add('hidden');
      els.fileInput.click();
    };

    window.handleLocation = () => {
      els.attachmentMenu.classList.add('hidden');
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const mapUrl = `https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`;
          await sendLocation(mapUrl);
        });
      }
    };

    els.photoInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file && currentChatId) {
        const url = await uploadFile(file, 'images');
        await sendMediaMessage(url, 'image', file.name);
      }
    });

    els.fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file && currentChatId) {
        const url = await uploadFile(file, 'files');
        await sendMediaMessage(url, 'file', file.name);
      }
    });

    async function uploadFile(file, folder) {
      const ref = storage.ref(`${folder}/${Date.now()}_${file.name}`);
      await ref.put(file);
      return await ref.getDownloadURL();
    }

    async function sendMediaMessage(url, type, fileName) {
      const messagesRef = db.collection('conversations').doc(currentChatId).collection('messages');

      await messagesRef.add({
        url: url,
        fileName: fileName,
        senderId: currentUser.uid,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        type: type
      });
    }

    async function sendLocation(mapUrl) {
      const messagesRef = db.collection('conversations').doc(currentChatId).collection('messages');

      await messagesRef.add({
        text: `📍 Location: ${mapUrl}`,
        senderId: currentUser.uid,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        type: 'location'
      });
    }

    // ==================== CALL FUNCTIONS ====================
    async function startAudioCall() {
      if (!currentUser || !currentChatUser) return;

      try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        showIncomingCall('audio');
      } catch (err) {
        showToast('❌ Microphone access denied');
      }
    }

    async function startVideoCall() {
      if (!currentUser || !currentChatUser) return;

      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { width: 1280, height: 720 }
        });
        showIncomingCall('video');
      } catch (err) {
        showToast('❌ Camera access denied');
      }
    }

    function showIncomingCall(type) {
      els.incomingCallAvatar.innerHTML = `<i class="fas fa-${currentChatUser.avatar}"></i>`;
      els.incomingCallName.textContent = currentChatUser.name;
      els.incomingCallType.textContent = `Incoming ${type} call...`;
      els.incomingCallModal.classList.add('active');

      // Auto accept after 3 seconds for demo
      setTimeout(() => {
        if (els.incomingCallModal.classList.contains('active')) {
          acceptCall();
        }
      }, 3000);
    }

    function acceptCall() {
      els.incomingCallModal.classList.remove('active');

      els.callUserName.textContent = currentChatUser.name;
      els.callUserAvatar.innerHTML = `<i class="fas fa-${currentChatUser.avatar}"></i>`;
      els.callStatus.textContent = 'Connected';

      if (els.localVideo && localStream) {
        els.localVideo.srcObject = localStream;
      }

      // Simulate remote video
      setTimeout(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#2a2f40';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(320, 240, 100, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 80px "Inter"';
        ctx.fillText(currentChatUser.name.charAt(0), 280, 280);

        const remoteStream = canvas.captureStream(30);
        els.remoteVideo.srcObject = remoteStream;
      }, 1000);

      els.callModal.classList.add('active');
      startCallTimer();
    }

    function declineCall() {
      els.incomingCallModal.classList.remove('active');
      showToast('❌ Call declined');
    }

    function toggleCallMute() {
      if (localStream) {
        isCallMuted = !isCallMuted;
        localStream.getAudioTracks().forEach(track => track.enabled = !isCallMuted);

        const icon = els.callMuteBtn.querySelector('i');
        icon.className = isCallMuted ? 'fas fa-microphone-slash' : 'fas fa-microphone';
        els.callMuteBtn.classList.toggle('muted', isCallMuted);
      }
    }

    function toggleCallVideo() {
      if (localStream) {
        isVideoEnabled = !isVideoEnabled;
        localStream.getVideoTracks().forEach(track => track.enabled = isVideoEnabled);

        const icon = els.callVideoBtn.querySelector('i');
        icon.className = isVideoEnabled ? 'fas fa-video' : 'fas fa-video-slash';
        els.callVideoBtn.classList.toggle('muted', !isVideoEnabled);
      }
    }

    async function shareScreen() {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnection?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
        els.localVideo.srcObject = screenStream;
      } catch (err) {
        showToast('❌ Screen share failed');
      }
    }

    function endCall() {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection) peerConnection.close();

      els.callModal.classList.remove('active');
      els.incomingCallModal.classList.remove('active');
      stopCallTimer();
      showToast('📞 Call ended');
    }

    function minimizeCall() {
      els.callModal.classList.remove('active');
    }

    function startCallTimer() {
      callSeconds = 0;
      updateCallTimer();
      callTimer = setInterval(updateCallTimer, 1000);
    }

    function updateCallTimer() {
      callSeconds++;
      const mins = Math.floor(callSeconds / 60);
      const secs = callSeconds % 60;
      els.callTimer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function stopCallTimer() {
      if (callTimer) clearInterval(callTimer);
    }

    // ==================== UTILITIES ====================
    function toggleSidebar() {
      els.sidebar.classList.toggle('active');
      els.overlay.classList.toggle('hidden');
    }

    function closeSidebar() {
      els.sidebar.classList.remove('active');
      els.overlay.classList.add('hidden');
    }

    function toggleTheme() {
      isDark = !isDark;
      els.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
      els.themeToggle.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    function toggleAttachmentMenu() {
      els.attachmentMenu.classList.toggle('hidden');
    }

    function toggleChatMenu() {
      showToast('Menu options coming soon');
    }

    function showProfile() {
      if (!currentUser) {
        showAuthModal();
      } else {
        showToast('👤 Profile view - Coming soon');
      }
    }

    function showToast(message) {
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }

    // Event listeners
    els.themeToggle.addEventListener('click', toggleTheme);
    els.messageInput.addEventListener('input', () => {
      els.sendButton.disabled = !els.messageInput.value.trim();
    });
    els.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && els.messageInput.value.trim()) sendMessage();
    });

    els.searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      document.querySelectorAll('.conv-item').forEach(item => {
        const name = item.querySelector('.font-bold')?.textContent.toLowerCase() || '';
        item.style.display = name.includes(term) ? 'flex' : 'none';
      });
    });

    window.addEventListener('resize', () => {
      isMobile = window.innerWidth < 768;
      if (!isMobile) closeSidebar();
    });

    document.addEventListener('click', (e) => {
      if (!els.attachmentMenu.contains(e.target) && !e.target.closest('[onclick="toggleAttachmentMenu()"]')) {
        els.attachmentMenu.classList.add('hidden');
      }
    });

    // Initialize
    if (isDark) {
      els.body.setAttribute('data-theme', 'dark');
      els.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }

    // Expose functions globally
    window.switchAuthTab = switchAuthTab;
    window.login = login;
    window.register = register;
    window.showAuthModal = showAuthModal;
    window.selectChat = selectChat;
    window.toggleSidebar = toggleSidebar;
    window.closeSidebar = closeSidebar;
    window.newChat = () => showToast('✨ New chat - Coming soon');
    window.startAudioCall = startAudioCall;
    window.startVideoCall = startVideoCall;
    window.acceptCall = acceptCall;
    window.declineCall = declineCall;
    window.toggleChatMenu = toggleChatMenu;
    window.toggleAttachmentMenu = toggleAttachmentMenu;
    window.showProfile = showProfile;
    window.clearChat = () => showToast('🗑️ Clear chat - Coming soon');
    window.exportChat = () => showToast('📥 Export - Coming soon');
    window.sendMessage = sendMessage;
    window.toggleCallMute = toggleCallMute;
    window.toggleCallVideo = toggleCallVideo;
    window.shareScreen = shareScreen;
    window.endCall = endCall;
    window.minimizeCall = minimizeCall;
    window.handlePhotoUpload = () => els.photoInput.click();
    window.handleFileUpload = () => els.fileInput.click();
    window.handleLocation = handleLocation;
    window.logout = logout;
  