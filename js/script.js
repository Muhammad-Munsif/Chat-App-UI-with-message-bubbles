<script>
    (function () {
      // ---------- ENHANCED DATA WITH MORE VARIETY ----------
      const users = [
        { id: 1, name: "John Doe", avatarIcon: "user-tie", status: "online", lastSeen: "just now", lastMessage: "Sent you a photo 📸", unread: 0, isFavorite: false },
        { id: 2, name: "Alice Smith", avatarIcon: "user-graduate", status: "online", lastSeen: "2 min ago", lastMessage: "Meeting at 3pm?", unread: 3, isFavorite: true },
        { id: 3, name: "Mike Johnson", avatarIcon: "user-ninja", status: "away", lastSeen: "30 min", lastMessage: "Project files attached", unread: 0, isFavorite: false },
        { id: 4, name: "Sarah Brown", avatarIcon: "user-astronaut", status: "offline", lastSeen: "2 hours", lastMessage: "Thanks for the help! 🙏", unread: 1, isFavorite: true },
        { id: 5, name: "Team Group", avatarIcon: "users", status: "online", lastSeen: "yesterday", lastMessage: "Sarah: Let's sync up", unread: 5, isFavorite: false },
        { id: 6, name: "Emma Davis", avatarIcon: "user-secret", status: "dnd", lastSeen: "5 min", lastMessage: "Quick call?", unread: 2, isFavorite: true },
        { id: 7, name: "James Wilson", avatarIcon: "user-astronaut", status: "online", lastSeen: "1 min", lastMessage: "Check this out 🔥", unread: 0, isFavorite: false }
      ];

      const chatMessages = {
        1: [
          { id: 1, type: "text", content: "Hey there! How are you doing today? 👋", incoming: true, time: "10:30 AM" },
          { id: 2, type: "text", content: "I'm doing great! Working on the new chat UI 🚀", incoming: false, time: "10:32 AM" },
          { id: 3, type: "text", content: "Check out this design I made!", incoming: true, time: "10:35 AM" }
        ],
        2: [
          { id: 1, type: "text", content: "Hi Alice! How's your day going? 🌟", incoming: false, time: "9:15 AM" },
          { id: 2, type: "text", content: "Pretty good! Can we meet tomorrow for coffee? ☕", incoming: true, time: "9:20 AM" }
        ],
        4: [
          { id: 1, type: "text", content: "Thanks for your help with the presentation! 🙌", incoming: true, time: "2 hours ago" },
          { id: 2, type: "text", content: "You're welcome! Happy to help anytime 😊", incoming: false, time: "1 hour ago" }
        ],
        7: [
          { id: 1, type: "text", content: "This new design is amazing! 🎨", incoming: true, time: "5 min ago" },
          { id: 2, type: "text", content: "Thanks! I've been working on it all week 💪", incoming: false, time: "4 min ago" }
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
        onlineCount: document.getElementById('onlineCount'),
        mobileFab: document.getElementById('mobileFab'),
        photoInput: document.getElementById('photoInput'),
        fileInput: document.getElementById('fileInput'),
        locationInput: document.getElementById('locationInput')
      };

      const getTime = () => {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      };

      function loadOnlineUsers() {
        const online = users.filter(u => u.status === 'online');
        els.onlineCount.innerText = online.length;
        els.onlineUsers.innerHTML = '';
        online.forEach(u => {
          const div = document.createElement('div');
          div.className = 'online-strip-item';
          div.onclick = () => selectChat(u.id);
          div.innerHTML = `
            <div class="relative">
              <div class="avatar avatar-sm"><i class="fas fa-${u.avatarIcon}"></i></div>
              <span class="status-badge online"></span>
            </div>
            <span class="text-xs font-semibold max-w-[70px] truncate">${u.name.split(' ')[0]}</span>
          `;
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
          const favStar = u.isFavorite ? '<i class="fas fa-star text-yellow-300 absolute -top-1 -right-1 text-xs filter drop-shadow-lg"></i>' : '';
          div.innerHTML = `
            <div class="relative">
              <div class="avatar avatar-sm"><i class="fas fa-${u.avatarIcon}"></i></div>
              <span class="status-badge ${u.status}"></span>
              ${favStar}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-center gap-2">
                <span class="font-bold truncate text-base">${u.name}</span>
                <span class="text-xs font-medium opacity-70 whitespace-nowrap">${u.lastSeen}</span>
              </div>
              <p class="text-sm opacity-70 truncate flex items-center gap-1">
                ${u.lastMessage}
              </p>
            </div>
            ${u.unread ? '<span class="unread-badge">' + u.unread + '</span>' : ''}
          `;
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

        const statusText = currentUser.status === 'online' ? 'Active now' :
          currentUser.status === 'away' ? 'Away' :
            currentUser.status === 'dnd' ? 'Do not disturb' : 'Offline';

        els.currentUserStatusText.innerHTML = `<i class="fas fa-circle text-[8px] ${currentUser.status}"></i> ${statusText}`;

        els.welcomeScreen.classList.add('hidden');
        els.chatMessages.classList.remove('hidden');
        els.messageInput.disabled = false;
        els.messageInput.placeholder = `Message @${currentUser.name.split(' ')[0].toLowerCase()}`;

        loadChatMessages();
        updateActive();

        if (isMobile) closeSidebar();
      }

      function loadChatMessages() {
        els.chatMessages.innerHTML = '';
        const msgs = chatMessages[currentChatId] || [];

        // add date divider
        const div = document.createElement('div');
        div.className = 'date-divider';
        div.innerHTML = '<span>✨ Today ✨</span>';
        els.chatMessages.appendChild(div);

        msgs.forEach(m => els.chatMessages.appendChild(createMsgEl(m)));
        els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight;
      }

      function createMsgEl(m) {
        const row = document.createElement('div');
        row.className = `msg-row ${m.incoming ? '' : 'out'}`;

        let content = m.content;
        if (m.attachment) {
          content = `
            <div class="attachment-preview">
              <i class="fas ${m.attachment.icon}"></i>
              <span class="font-semibold">${m.attachment.name}</span>
            </div>
            <div class="mt-2">${m.content || ''}</div>
          `;
        }

        const inner = `<div class="bubble ${m.incoming ? 'in' : 'out'}">${content}<div class="time">${m.time}</div></div>`;

        if (m.incoming && currentUser) {
          row.innerHTML = `<div class="avatar avatar-sm mr-3"><i class="fas fa-${currentUser.avatarIcon}"></i></div>${inner}`;
        } else {
          row.innerHTML = inner;
        }
        return row;
      }

      function updateActive() {
        document.querySelectorAll('.conv-item').forEach(el => {
          const uid = el.getAttribute('data-userid');
          if (Number(uid) === currentChatId) {
            el.classList.add('active');
          } else {
            el.classList.remove('active');
          }
        });
      }

      function sendMessage() {
        if (!currentChatId || !els.messageInput.value.trim()) return;

        const text = els.messageInput.value.trim();
        const newMsg = {
          id: Date.now(),
          type: 'text',
          content: text,
          incoming: false,
          time: getTime()
        };

        els.chatMessages.appendChild(createMsgEl(newMsg));
        els.messageInput.value = '';
        els.sendButton.disabled = true;
        els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight;

        // Simulate reply with typing animation
        setTimeout(() => {
          const typingDiv = document.createElement('div');
          typingDiv.className = 'msg-row';
          typingDiv.id = 'typing';
          typingDiv.innerHTML = `
            <div class="avatar avatar-sm mr-3"><i class="fas fa-${currentUser.avatarIcon}"></i></div>
            <div class="typing-indicator"><span></span><span></span><span></span></div>
          `;
          els.chatMessages.appendChild(typingDiv);
          els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight;

          setTimeout(() => {
            document.getElementById('typing')?.remove();
            const replies = [
              'Got it! 👍', 'Sounds good!', 'Awesome!', 'Thanks for letting me know!',
              'Cool 😎', 'Perfect!', 'I\'ll check it out', '👍👍👍'
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            const reply = {
              id: Date.now() + 1,
              type: 'text',
              content: randomReply,
              incoming: true,
              time: getTime()
            };
            els.chatMessages.appendChild(createMsgEl(reply));
            els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight;
          }, 1500);
        }, 800);
      }

      function handleFileSelect(input, type) {
        const files = input.files;
        if (!files || files.length === 0 || !currentChatId) return;

        Array.from(files).forEach(file => {
          const icon = type === 'photo' ? 'fa-image' : (type === 'location' ? 'fa-map-pin' : 'fa-file');
          const newMsg = {
            id: Date.now() + Math.random(),
            type: 'attachment',
            content: `<i class="fas ${icon}"></i> ${file.name}`,
            attachment: {
              name: file.name,
              size: file.size,
              type: file.type,
              icon: icon
            },
            incoming: false,
            time: getTime()
          };
          els.chatMessages.appendChild(createMsgEl(newMsg));
        });

        els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight;
        input.value = '';
      }

      // Attachment handlers
      window.handlePhotoUpload = function () {
        els.attachmentMenu.classList.add('hidden');
        els.photoInput.click();
      };

      window.handleFileUpload = function () {
        els.attachmentMenu.classList.add('hidden');
        els.fileInput.click();
      };

      window.handleLocationUpload = function () {
        els.attachmentMenu.classList.add('hidden');
        els.locationInput.click();
      };

      function toggleSidebar() {
        els.sidebar.classList.toggle('active');
        els.overlay.classList.toggle('active');
        document.body.style.overflow = els.sidebar.classList.contains('active') ? 'hidden' : '';
      }

      function closeSidebar() {
        els.sidebar.classList.remove('active');
        els.overlay.classList.remove('active');
        document.body.style.overflow = '';
      }

      function toggleTheme() {
        isDark = !isDark;
        els.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
        els.themeToggle.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        localStorage.setItem('wavechat-theme', isDark ? 'dark' : 'light');
      }

      // Initialize theme
      const saved = localStorage.getItem('wavechat-theme');
      if (saved === 'dark') {
        isDark = true;
        els.body.setAttribute('data-theme', 'dark');
        els.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      }

      // Event listeners
      els.themeToggle.addEventListener('click', toggleTheme);

      els.messageInput.addEventListener('input', function () {
        els.sendButton.disabled = this.value.trim() === '';
      });

      els.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && els.messageInput.value.trim()) {
          e.preventDefault();
          sendMessage();
        }
      });

      els.searchInput.addEventListener('input', function (e) {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.conv-item').forEach((item, idx) => {
          const user = users[idx];
          if (user) {
            item.style.display = (user.name.toLowerCase().includes(term) ||
              user.lastMessage.toLowerCase().includes(term) ||
              term === '') ? 'flex' : 'none';
          }
        });
      });

      els.overlay.addEventListener('click', closeSidebar);
      els.mobileFab.addEventListener('click', toggleSidebar);

      // File input handlers
      els.photoInput.addEventListener('change', function () { handleFileSelect(this, 'photo'); });
      els.fileInput.addEventListener('change', function () { handleFileSelect(this, 'file'); });
      els.locationInput.addEventListener('change', function () { handleFileSelect(this, 'location'); });

      // Window resize handler
      window.addEventListener('resize', () => {
        isMobile = window.innerWidth < 768;
        if (!isMobile) closeSidebar();
      });

      // Close menus on outside click
      document.addEventListener('click', (e) => {
        if (!els.chatMenu.contains(e.target) && !e.target.closest('[onclick="toggleChatMenu()"]')) {
          els.chatMenu.classList.add('hidden');
        }
        if (!els.attachmentMenu.contains(e.target) &&
          !e.target.closest('[onclick="toggleAttachmentMenu()"]') &&
          !e.target.closest('[onclick^="handle"]')) {
          els.attachmentMenu.classList.add('hidden');
        }
      });

      // Initialize
      loadOnlineUsers();
      loadConversations();

      // Expose to window
      window.selectChat = selectChat;
      window.toggleSidebar = toggleSidebar;
      window.backToContacts = toggleSidebar;
      window.newChat = () => alert('✨ Start a new conversation with friends!');
      window.showSettings = () => alert('⚙️ Customize your WaveChat experience');
      window.startCall = () => currentUser ? alert(`📞 Calling ${currentUser.name}...`) : alert('Select a chat first');
      window.startVideoCall = () => currentUser ? alert(`📹 Starting video call with ${currentUser.name}`) : alert('Select a chat first');
      window.toggleChatMenu = () => els.chatMenu.classList.toggle('hidden');
      window.toggleAttachmentMenu = () => els.attachmentMenu.classList.toggle('hidden');
      window.viewProfile = () => {
        alert(`👤 ${currentUser?.name}'s profile\nStatus: ${currentUser?.status}\nLast seen: ${currentUser?.lastSeen}`);
        els.chatMenu.classList.add('hidden');
      };
      window.muteChat = () => {
        alert('🔇 Chat notifications muted for 1 hour');
        els.chatMenu.classList.add('hidden');
      };
      window.clearChat = () => {
        if (confirm('Clear all messages in this conversation?')) {
          els.chatMessages.innerHTML = '<div class="date-divider"><span>✨ Today ✨</span></div>';
        }
        els.chatMenu.classList.add('hidden');
      };
      window.exportChat = () => {
        alert('📥 Exporting chat history as PDF...');
        els.chatMenu.classList.add('hidden');
      };
      window.sendMessage = sendMessage;
    })();
  </script>