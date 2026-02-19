
    (function () {
      // ---------- PROFESSIONAL DEMO DATA (ready for backend) ----------
      const users = [
        { id: 1, name: "John Doe", avatarIcon: "user-tie", status: "online", lastSeen: "just now", lastMessage: "Check out this photo", unread: 0, color: "from-blue-600 to-indigo-600", isFavorite: false },
        { id: 2, name: "Alice Smith", avatarIcon: "user-graduate", status: "online", lastSeen: "2 min ago", lastMessage: "Can we meet tomorrow?", unread: 3, color: "from-purple-600 to-pink-600", isFavorite: true },
        { id: 3, name: "Mike Johnson", avatarIcon: "user-ninja", status: "away", lastSeen: "30 min", lastMessage: "Project files sent", unread: 0, color: "from-emerald-600 to-teal-600", isFavorite: false },
        { id: 4, name: "Sarah Brown", avatarIcon: "user-astronaut", status: "offline", lastSeen: "2 hours", lastMessage: "thanks for the help", unread: 1, color: "from-amber-600 to-orange-600", isFavorite: true },
        { id: 5, name: "Team Work", avatarIcon: "users", status: "online", lastSeen: "yesterday", lastMessage: "meeting at 3pm", unread: 5, color: "from-cyan-600 to-blue-600", isFavorite: false },
        { id: 6, name: "Emma Davis", avatarIcon: "user-secret", status: "dnd", lastSeen: "5 min", lastMessage: "quick call?", unread: 2, color: "from-rose-600 to-pink-600", isFavorite: true }
      ];

      const chatMessages = {
        1: [
          { id: 1, type: "text", content: "Hey there! How are you doing today?", incoming: true, time: "10:30 AM" },
          { id: 2, type: "text", content: "I'm doing great! Working on the new chat UI.", incoming: false, time: "10:32 AM" },
          { id: 3, type: "text", content: "Check out this design", incoming: true, time: "10:35 AM" }
        ],
        2: [
          { id: 1, type: "text", content: "Hi Alice! How's your day?", incoming: false, time: "9:15 AM" },
          { id: 2, type: "text", content: "Going well! Can we meet tomorrow for coffee?", incoming: true, time: "9:20 AM" }
        ],
        4: [
          { id: 1, type: "text", content: "Thanks for your help with the presentation!", incoming: true, time: "2 hours ago" },
          { id: 2, type: "text", content: "You're welcome, happy to help", incoming: false, time: "1 hour ago" }
        ]
      };

      // state
      let currentChatId = null, currentUser = null, isMobile = window.innerWidth < 768, isDark = false;
      const els = {
        body: document.body,
        sidebar: document.getElementById('sidebar'),
        overlay: document.getElementById('overlay'),
        themeToggle: document.getElementById('themeToggle'),
        onlineUsers: document.getElementById('onlineUsers'),
        conversationsList: document.getElementById('conversationsList'),
        welcomeScreen: document.getElementById('welcomeScreen'),
        chatMessages: document.getElementById('chatMessages'),
        messagesContainer: document.getElementById('messagesContainer'),
        currentUserName: document.getElementById('currentUserName'),
        currentUserAvatar: document.getElementById('currentUserAvatar'),
        currentUserStatus: document.getElementById('currentUserStatus'),
        currentUserStatusText: document.getElementById('currentUserStatusText'),
        messageInput: document.getElementById('messageInput'),
        sendButton: document.getElementById('sendButton'),
        attachmentMenu: document.getElementById('attachmentMenu'),
        chatMenu: document.getElementById('chatMenu'),
        searchInput: document.getElementById('searchInput'),
        onlineCount: document.getElementById('onlineCount')
      };

      // helpers
      const getTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      function loadOnlineUsers() {
        const online = users.filter(u => u.status === 'online');
        els.onlineCount.innerText = online.length;
        els.onlineUsers.innerHTML = '';
        online.forEach(u => {
          const div = document.createElement('div');
          div.className = 'flex flex-col items-center cursor-pointer';
          div.onclick = () => selectChat(u.id);
          div.innerHTML = `<div class="relative"><div class="avatar avatar-sm" style="background: var(--primary);"><i class="fas fa-${u.avatarIcon}"></i></div><span class="status-badge online"></span></div><span class="text-xs font-medium mt-1">${u.name.split(' ')[0]}</span>`;
          els.onlineUsers.appendChild(div);
        });
      }

      function loadConversations() {
        els.conversationsList.innerHTML = '';
        users.forEach(u => {
          const div = document.createElement('div');
          div.className = `conv-item ${currentChatId === u.id ? 'active' : ''}`;
          div.setAttribute('data-userid', u.id);
          div.onclick = () => selectChat(u.id);
          div.innerHTML = `<div class="relative"><div class="avatar avatar-sm" style="background: var(--primary);"><i class="fas fa-${u.avatarIcon}"></i></div><span class="status-badge ${u.status}"></span>${u.isFavorite ? '<i class="fas fa-star text-yellow-400 absolute -top-1 -right-1 text-[9px]"></i>' : ''}</div><div class="flex-1 min-w-0"><div class="flex justify-between"><span class="font-semibold">${u.name}</span><span class="text-xs text-secondary">${u.lastSeen}</span></div><p class="text-sm text-secondary truncate">${u.lastMessage}</p></div>${u.unread ? '<span class="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">' + u.unread + '</span>' : ''}`;
          els.conversationsList.appendChild(div);
        });
      }

      function selectChat(id) {
        currentChatId = id;
        currentUser = users.find(u => u.id === id);
        if (!currentUser) return;
        els.currentUserName.innerText = currentUser.name;
        els.currentUserAvatar.innerHTML = `<i class="fas fa-${currentUser.avatarIcon}"></i>`;
        els.currentUserStatus.className = `status-badge ${currentUser.status}`;
        els.currentUserStatusText.innerText = currentUser.status === 'online' ? 'Active' : `seen ${currentUser.lastSeen}`;
        els.welcomeScreen.classList.add('hidden');
        els.chatMessages.classList.remove('hidden');
        els.messageInput.disabled = false;
        els.messageInput.placeholder = `Message ${currentUser.name}`;
        loadChatMessages();
        updateActive();
        if (isMobile) closeSidebar();
      }

      function loadChatMessages() {
        els.chatMessages.innerHTML = '';
        const msgs = chatMessages[currentChatId] || [];
        const div = document.createElement('div'); div.className = 'date-divider'; div.innerHTML = '<span>Today</span>';
        els.chatMessages.appendChild(div);
        msgs.forEach(m => els.chatMessages.appendChild(createMsgEl(m)));
        els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight;
      }

      function createMsgEl(m) {
        const row = document.createElement('div');
        row.className = `msg-row ${m.incoming ? '' : 'out'}`;
        let inner = `<div class="bubble ${m.incoming ? 'in' : 'out'}">${m.content}<div class="time">${m.time}</div></div>`;
        if (m.incoming && currentUser) {
          row.innerHTML = `<div class="avatar avatar-sm mr-2" style="background: var(--primary);"><i class="fas fa-${currentUser.avatarIcon}"></i></div>${inner}`;
        } else {
          row.innerHTML = inner;
        }
        return row;
      }

      function updateActive() {
        document.querySelectorAll('.conv-item').forEach(el => {
          const uid = el.getAttribute('data-userid');
          if (Number(uid) === currentChatId) el.classList.add('active'); else el.classList.remove('active');
        });
      }

      function sendMessage() {
        if (!currentChatId || !els.messageInput.value.trim()) return;
        const text = els.messageInput.value.trim();
        const newMsg = { id: Date.now(), type: 'text', content: text, incoming: false, time: getTime() };
        els.chatMessages.appendChild(createMsgEl(newMsg));
        els.messageInput.value = '';
        els.sendButton.disabled = true;
        els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight;

        // Simulate reply (remove if you want pure backend)
        setTimeout(() => {
          const typingDiv = document.createElement('div');
          typingDiv.className = 'msg-row';
          typingDiv.id = 'typing';
          typingDiv.innerHTML = `<div class="avatar avatar-sm mr-2" style="background: var(--primary);"><i class="fas fa-${currentUser.avatarIcon}"></i></div><div class="typing-indicator"><span></span><span></span><span></span></div>`;
          els.chatMessages.appendChild(typingDiv);
          els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight;
          setTimeout(() => {
            document.getElementById('typing')?.remove();
            const reply = { id: Date.now() + 1, type: 'text', content: 'Got it. Thanks.', incoming: true, time: getTime() };
            els.chatMessages.appendChild(createMsgEl(reply));
            els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight;
          }, 1300);
        }, 700);
      }

      // UI: sidebar, theme
      function toggleSidebar() { if (isMobile) { els.sidebar.classList.toggle('active'); els.overlay.classList.toggle('active'); } }
      function closeSidebar() { els.sidebar.classList.remove('active'); els.overlay.classList.remove('active'); }

      function toggleTheme() {
        isDark = !isDark;
        els.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
        els.themeToggle.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        localStorage.setItem('wavechat-theme', isDark ? 'dark' : 'light');
      }

      const saved = localStorage.getItem('wavechat-theme');
      if (saved === 'dark') { isDark = true; els.body.setAttribute('data-theme', 'dark'); els.themeToggle.innerHTML = '<i class="fas fa-moon"></i>'; }

      // event listeners
      els.themeToggle.addEventListener('click', toggleTheme);
      els.messageInput.addEventListener('input', function () { els.sendButton.disabled = this.value.trim() === ''; });
      els.messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && els.messageInput.value.trim()) { e.preventDefault(); sendMessage(); } });
      els.searchInput.addEventListener('input', function (e) {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.conv-item').forEach((item, idx) => {
          const user = users[idx];
          if (user) item.style.display = (user.name.toLowerCase().includes(term) || user.lastMessage.toLowerCase().includes(term) || term === '') ? 'flex' : 'none';
        });
      });
      els.overlay.addEventListener('click', closeSidebar);
      document.getElementById('mobileFab').addEventListener('click', toggleSidebar);
      window.addEventListener('resize', () => { isMobile = window.innerWidth < 768; if (!isMobile) closeSidebar(); });

      // load
      loadOnlineUsers();
      loadConversations();

      // expose actions (backend hooks)
      window.selectChat = selectChat; window.toggleSidebar = toggleSidebar; window.backToContacts = toggleSidebar;
      window.newChat = () => alert('backend: new chat dialog');
      window.showSettings = () => alert('settings panel');
      window.startCall = () => currentUser ? alert(`audio call with ${currentUser.name}`) : alert('select chat');
      window.startVideoCall = () => currentUser ? alert(`video call with ${currentUser.name}`) : alert('select chat');
      window.toggleChatMenu = () => els.chatMenu.classList.toggle('hidden');
      window.toggleAttachmentMenu = () => els.attachmentMenu.classList.toggle('hidden');
      window.viewProfile = () => { alert(`view profile ${currentUser?.name}`); toggleChatMenu(); };
      window.muteChat = () => { alert('chat muted (backend)'); toggleChatMenu(); };
      window.clearChat = () => { if (confirm('clear all messages?')) els.chatMessages.innerHTML = '<div class="date-divider"><span>Today</span></div>'; toggleChatMenu(); };
      window.exportChat = () => { alert('export chat (PDF)'); toggleChatMenu(); };
      window.attachPhoto = () => { alert('attach photo'); toggleAttachmentMenu(); };
      window.attachFile = () => { alert('attach file'); toggleAttachmentMenu(); };
      window.attachLocation = () => { alert('share location'); toggleAttachmentMenu(); };
      window.sendMessage = sendMessage;
    })();
  