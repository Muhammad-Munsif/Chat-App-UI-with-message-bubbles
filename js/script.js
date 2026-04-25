<script>
    // WaveChat Application
    (function () {
      // ==================== STATE ====================
      let currentUser = null;
      let currentChatId = null;
      let currentChatUser = null;

      // Load data from localStorage
      let messages = JSON.parse(localStorage.getItem('wavechat_messages')) || {};
      let conversations = JSON.parse(localStorage.getItem('wavechat_conversations')) || {};
      let registeredUsers = JSON.parse(localStorage.getItem('wavechat_users')) || [];

      const demoUsers = [
        { id: 'user1', name: 'John Doe', avatar: 'user-tie', status: 'online', lastSeen: 'now', email: 'john@example.com' },
        { id: 'user2', name: 'Alice Smith', avatar: 'user-graduate', status: 'online', lastSeen: '2m', email: 'alice@example.com' },
        { id: 'user3', name: 'Mike Johnson', avatar: 'user-ninja', status: 'away', lastSeen: '30m', email: 'mike@example.com' },
        { id: 'user4', name: 'Sarah Brown', avatar: 'user-astronaut', status: 'offline', lastSeen: '2h', email: 'sarah@example.com' }
      ];

      // Initialize default data
      if (Object.keys(conversations).length === 0) {
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

      if (Object.keys(messages).length === 0) {
        messages['conv_user1'] = [
          { id: 1, text: 'Hey! How are you?', sender: 'user1', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'text' },
          { id: 2, text: 'Welcome to WaveChat! Start messaging now.', sender: 'user1', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'text' }
        ];
        messages['conv_user2'] = [
          { id: 1, text: 'Hi there! Ready to chat?', sender: 'user2', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'text' }
        ];
        messages['conv_user3'] = [
          { id: 1, text: 'Project files are ready for review', sender: 'user3', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'text' }
        ];
        localStorage.setItem('wavechat_messages', JSON.stringify(messages));
      }

      // Call state
      let localStream = null;
      let callTimerInterval = null;
      let callSeconds = 0;
      let isCallMuted = false;
      let isVideoEnabled = true;

      // DOM Elements
      const authContainer = document.getElementById('authContainer');
      const mainApp = document.getElementById('mainApp');

      const els = {
        sidebar: document.getElementById('sidebar'),
        overlay: document.getElementById('overlay'),
        themeToggle: document.getElementById('themeToggle'),
        logoutBtn: document.getElementById('logoutBtn'),
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
        photoInput: document.getElementById('photoInput'),
        fileInput: document.getElementById('fileInput')
      };

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
          if (els.messagesContainer) {
            els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight;
          }
        }, 100);
      }

      function updateUI() {
        if (currentUser) {
          els.currentUserDisplayName.textContent = currentUser.displayName;
          els.currentUserEmail.textContent = currentUser.email;
          els.currentUserAvatar.innerHTML = '<i class="fas fa-user"></i>';
        }
      }

      function loadConversations() {
        if (!els.conversationsList) return;
        els.conversationsList.innerHTML = '';
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
        els.conversationsList.appendChild(div);
      }

      function selectChat(cid, user) {
        if (!user) return;
        currentChatId = cid;
        currentChatUser = user;
        els.chatUserName.textContent = user.name;
        els.chatUserAvatar.innerHTML = `<i class="fas fa-${user.avatar}"></i>`;
        els.chatUserStatus.className = `status-badge ${user.status}`;
        els.chatUserStatusText.textContent = user.status === 'online' ? 'Online' : user.status === 'away' ? 'Away' : 'Offline';
        els.welcomeScreen.classList.add('hidden');
        els.chatMessages.classList.remove('hidden');

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
        if (!els.chatMessages) return;
        els.chatMessages.innerHTML = '';
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
        els.chatMessages.appendChild(row);
        scrollToBottom();
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
        }, 1500);

        return true;
      }

      function sendMessage() {
        const txt = els.messageInput.value.trim();
        if (txt && currentChatId && currentUser) {
          saveAndSend(txt, 'text', txt);
          els.messageInput.value = '';
        }
      }

      function loadOnlineUsers() {
        const online = demoUsers.filter(u => u.status === 'online');
        els.onlineCount.textContent = online.length;
        els.onlineUsers.innerHTML = '';
        online.forEach(u => {
          const div = document.createElement('div');
          div.className = 'online-item';
          div.onclick = () => { const cid = `conv_${u.id}`; selectChat(cid, u); };
          div.innerHTML = `<div class="relative"><div class="avatar avatar-sm"><i class="fas fa-${u.avatar}"></i></div><span class="status-badge online"></span></div><span class="text-xs font-medium">${u.name.split(' ')[0]}</span>`;
          els.onlineUsers.appendChild(div);
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

        // Save to localStorage
        localStorage.setItem('wavechat_current_user', JSON.stringify(currentUser));
        localStorage.setItem('wavechat_logged_in', 'true');

        updateUI();
        loadConversations();
        loadOnlineUsers();

        // Show main app, hide auth
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

        // Save to localStorage
        localStorage.setItem('wavechat_current_user', JSON.stringify(currentUser));
        localStorage.setItem('wavechat_logged_in', 'true');

        updateUI();
        loadConversations();
        loadOnlineUsers();

        // Show main app, hide auth
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

        // Show auth, hide main app
        authContainer.classList.remove('hidden');
        mainApp.classList.remove('active');

        showToast('Logged out successfully');
      }

      // Call Functions (Demo)
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
        els.incomingCallAvatar.innerHTML = `<i class="fas fa-${currentChatUser.avatar}"></i>`;
        els.incomingCallName.textContent = currentChatUser.name;
        els.incomingCallType.textContent = `Incoming ${type} call...`;
        els.incomingCallModal.classList.add('active');
      }

      function acceptCall() {
        els.incomingCallModal.classList.remove('active');
        if (localStream && els.localVideo) els.localVideo.srcObject = localStream;
        els.callUserName.textContent = currentChatUser.name;
        els.callUserAvatar.innerHTML = `<i class="fas fa-${currentChatUser.avatar}"></i>`;
        els.callStatus.textContent = 'Connected';

        setTimeout(() => {
          const canvas = document.createElement('canvas');
          canvas.width = 640; canvas.height = 480;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#2d3748'; ctx.fillRect(0, 0, 640, 480);
          ctx.fillStyle = '#3b82f6'; ctx.font = 'bold 70px Inter';
          ctx.fillText(currentChatUser.name.charAt(0), 280, 260);
          const stream = canvas.captureStream(10);
          if (els.remoteVideo) els.remoteVideo.srcObject = stream;
        }, 500);

        els.callModal.classList.add('active');
        startCallTimer();
      }

      function declineCall() {
        if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
        els.incomingCallModal.classList.remove('active');
        showToast('Call declined');
      }

      function endCall() {
        if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
        els.callModal.classList.remove('active');
        if (callTimerInterval) clearInterval(callTimerInterval);
        showToast('Call ended');
      }

      function startCallTimer() {
        callSeconds = 0;
        if (callTimerInterval) clearInterval(callTimerInterval);
        callTimerInterval = setInterval(() => {
          callSeconds++;
          const m = Math.floor(callSeconds / 60), s = callSeconds % 60;
          els.callTimer.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }, 1000);
      }

      function toggleCallMute() {
        if (localStream) {
          isCallMuted = !isCallMuted;
          localStream.getAudioTracks().forEach(t => t.enabled = !isCallMuted);
          const icon = els.callMuteBtn.querySelector('i');
          if (icon) icon.className = isCallMuted ? 'fas fa-microphone-slash' : 'fas fa-microphone';
        }
      }

      function toggleCallVideo() {
        if (localStream) {
          isVideoEnabled = !isVideoEnabled;
          localStream.getVideoTracks().forEach(t => t.enabled = isVideoEnabled);
          const icon = els.callVideoBtn.querySelector('i');
          if (icon) icon.className = isVideoEnabled ? 'fas fa-video' : 'fas fa-video-slash';
        }
      }

      async function shareScreen() {
        try {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          if (els.localVideo) els.localVideo.srcObject = screenStream;
          showToast('Screen sharing started');
        } catch (e) { showToast('Screen share cancelled'); }
      }

      // UI Functions
      function toggleSidebar() { els.sidebar.classList.toggle('active'); els.overlay.classList.toggle('hidden'); }
      function closeSidebar() { els.sidebar.classList.remove('active'); els.overlay.classList.add('hidden'); }

      function toggleTheme() {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
        const icon = els.themeToggle.querySelector('i');
        if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
      }

      function initTheme() {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark') {
          document.body.setAttribute('data-theme', 'dark');
          const icon = els.themeToggle.querySelector('i');
          if (icon) icon.className = 'fas fa-moon';
        }
      }

      // Check login status on load
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
        } else {
          authContainer.classList.remove('hidden');
          mainApp.classList.remove('active');
        }
      }

      // Event Bindings
      function bindEvents() {
        els.themeToggle.addEventListener('click', toggleTheme);
        els.logoutBtn.addEventListener('click', logout);
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

        els.sendButton.addEventListener('click', sendMessage);
        els.messageInput.addEventListener('keypress', e => { if (e.key === 'Enter' && els.messageInput.value.trim()) sendMessage(); });
        els.attachBtn.addEventListener('click', () => els.attachmentMenu.classList.toggle('hidden'));
        els.audioCallBtn.addEventListener('click', startAudioCall);
        els.videoCallBtn.addEventListener('click', startVideoCall);
        document.getElementById('acceptCallBtn')?.addEventListener('click', acceptCall);
        document.getElementById('declineCallBtn')?.addEventListener('click', declineCall);
        document.getElementById('endCallBtn')?.addEventListener('click', endCall);
        document.getElementById('minimizeCallBtn')?.addEventListener('click', () => { els.callModal.classList.remove('active'); showToast('Call minimized'); });
        els.callMuteBtn?.addEventListener('click', toggleCallMute);
        els.callVideoBtn?.addEventListener('click', toggleCallVideo);
        document.getElementById('shareScreenBtn')?.addEventListener('click', shareScreen);
        document.getElementById('menuToggle')?.addEventListener('click', toggleSidebar);
        els.overlay?.addEventListener('click', closeSidebar);
        document.getElementById('profileBtn')?.addEventListener('click', () => showToast(`Profile: ${currentUser?.displayName}`));

        els.searchInput.addEventListener('input', e => {
          const term = e.target.value.toLowerCase();
          document.querySelectorAll('.conv-item').forEach(i => {
            const name = i.querySelector('.font-bold')?.textContent.toLowerCase() || '';
            i.style.display = name.includes(term) ? 'flex' : 'none';
          });
        });

        window.addEventListener('resize', () => { if (window.innerWidth >= 768) closeSidebar(); });

        document.addEventListener('click', (e) => {
          if (els.attachmentMenu && els.attachBtn &&
            !els.attachmentMenu.contains(e.target) &&
            !els.attachBtn.contains(e.target)) {
            els.attachmentMenu.classList.add('hidden');
          }
        });

        // Attachment handlers
        document.getElementById('photoAttach')?.addEventListener('click', () => {
          els.photoInput.click();
          els.attachmentMenu.classList.add('hidden');
        });

        document.getElementById('fileAttach')?.addEventListener('click', () => {
          els.fileInput.click();
          els.attachmentMenu.classList.add('hidden');
        });

        document.getElementById('locationAttach')?.addEventListener('click', () => {
          els.attachmentMenu.classList.add('hidden');
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(p => {
              const url = `https://maps.google.com/?q=${p.coords.latitude},${p.coords.longitude}`;
              saveAndSend(`📍 My location`, 'location', url);
              showToast('Location shared');
            }, () => showToast('Unable to get location'));
          } else showToast('Geolocation not supported');
        });

        els.photoInput.addEventListener('change', e => {
          if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = ev => saveAndSend('📷 Photo', 'image', ev.target.result);
            reader.readAsDataURL(e.target.files[0]);
          }
        });

        els.fileInput.addEventListener('change', e => {
          if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            saveAndSend(`📎 File: ${f.name} (${(f.size / 1024).toFixed(1)} KB)`, 'file');
          }
        });
      }

      // Initialize
      initTheme();
      bindEvents();
      checkLoginStatus();
    })();
  </script></script>