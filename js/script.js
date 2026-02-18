
    (function() {
      // ---------- DATA ----------
      const users = [
        { id:1,name:"John Doe",avatar:"JD",avatarIcon:"user-tie",status:"online",lastSeen:"Just now",lastMessage:"Check out this cool photo I took!",unread:0,color:"from-indigo-500 to-purple-500",isFavorite:true },
        { id:2,name:"Alice Smith",avatar:"AS",avatarIcon:"user-graduate",status:"online",lastSeen:"2 min ago",lastMessage:"Can we meet tomorrow for coffee?",unread:3,color:"from-pink-500 to-rose-500",isFavorite:true },
        { id:3,name:"Mike Johnson",avatar:"MJ",avatarIcon:"user-ninja",status:"away",lastSeen:"30 min ago",lastMessage:"I've sent you the project files",unread:0,color:"from-emerald-500 to-teal-500",isFavorite:false },
        { id:4,name:"Sarah Brown",avatar:"SB",avatarIcon:"user-astronaut",status:"offline",lastSeen:"2 hours ago",lastMessage:"Thanks for your help with the presentation!",unread:1,color:"from-amber-500 to-orange-500",isFavorite:true },
        { id:5,name:"Team Work",avatar:"TW",avatarIcon:"users",status:"online",lastSeen:"Yesterday",lastMessage:"Meeting scheduled for 3 PM tomorrow",unread:5,color:"from-blue-500 to-cyan-500",isFavorite:false },
        { id:6,name:"Emma Davis",avatar:"ED",avatarIcon:"user-secret",status:"dnd",lastSeen:"5 min ago",lastMessage:"Are you free for a quick call?",unread:2,color:"from-rose-500 to-pink-500",isFavorite:true },
        { id:7,name:"Robert Garcia",avatar:"RG",avatarIcon:"user-cowboy",status:"offline",lastSeen:"1 hour ago",lastMessage:"See you at the conference!",unread:0,color:"from-sky-500 to-blue-500",isFavorite:false },
        { id:8,name:"Lisa Wang",avatar:"LW",avatarIcon:"user-nurse",status:"online",lastSeen:"Just now",lastMessage:"Let's catch up this weekend",unread:0,color:"from-violet-500 to-purple-500",isFavorite:true }
      ];
      const chatMessages = {
        1: [{ id:1,type:"text",content:"Hey there! How are you doing today?",incoming:true,time:"10:30 AM",reactions:{"👍":1} },
            { id:2,type:"text",content:"I'm doing great! Just working on this amazing chat UI redesign.",incoming:false,time:"10:32 AM" },
            { id:3,type:"image",content:"Check out this awesome view from my hike!",url:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300",incoming:true,time:"10:35 AM",reactions:{"❤️":2} },
            { id:4,type:"text",content:"Wow, absolutely stunning! Where was this taken?",incoming:false,time:"10:36 AM" }],
        2: [{ id:1,type:"text",content:"Hi Alice! How's your day?",incoming:false,time:"9:15 AM" },
            { id:2,type:"text",content:"Going well! Can we meet tomorrow for coffee?",incoming:true,time:"9:20 AM",reactions:{"☕":1} }],
        4: [{ id:1,type:"text",content:"Thanks for your help with the project presentation!",incoming:true,time:"2 hours ago" },
            { id:2,type:"text",content:"You're welcome! Happy to help.",incoming:false,time:"1 hour ago" }],
        6: [{ id:1,type:"text",content:"Hey Emma, free for a quick call?",incoming:false,time:"11:45 AM" },
            { id:2,type:"text",content:"Sure, give me 10 minutes.",incoming:true,time:"11:46 AM" }]
      };

      // state
      let currentChatId = null, currentUser = null, isMobile = window.innerWidth < 768, isDark = false;
      const elements = {
        body: document.body,
        sidebar: document.getElementById('sidebar'),
        mobileOverlay: document.getElementById('mobileOverlay'),
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
      function getCurrentTime() { return new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); }

      function loadOnlineUsers() {
        const onlineUsers = users.filter(u => u.status==='online');
        if (elements.onlineCount) elements.onlineCount.innerText = onlineUsers.length;
        elements.onlineUsers.innerHTML = '';
        onlineUsers.forEach(u => {
          const div = document.createElement('div');
          div.className = 'flex flex-col items-center cursor-pointer group';
          div.onclick = () => selectChat(u.id);
          div.innerHTML = `<div class="relative"><div class="avatar avatar-sm bg-gradient-to-r ${u.color}"><i class="fas fa-${u.avatarIcon}"></i></div><span class="status-dot online"></span></div><span class="text-xs font-medium mt-1">${u.name.split(' ')[0]}</span>`;
          elements.onlineUsers.appendChild(div);
        });
      }

      function loadConversations() {
        elements.conversationsList.innerHTML = '';
        users.forEach(u => {
          const div = document.createElement('div');
          div.className = `conversation-item ${currentChatId===u.id?'active':''}`;
          div.setAttribute('data-userid',u.id);
          div.onclick = () => selectChat(u.id);
          div.innerHTML = `<div class="relative"><div class="avatar avatar-sm bg-gradient-to-r ${u.color}"><i class="fas fa-${u.avatarIcon}"></i></div><span class="status-dot ${u.status}"></span>${u.isFavorite?'<i class="fas fa-star text-yellow-400 absolute -top-1 -right-1 text-[10px]"></i>':''}</div><div class="flex-1 min-w-0"><div class="flex justify-between"><span class="font-semibold truncate">${u.name}</span><span class="text-[0.7rem] text-secondary">${u.lastSeen}</span></div><p class="text-sm text-secondary truncate">${u.lastMessage}</p></div>${u.unread?`<span class="badge bg-primary text-white text-xs rounded-full px-2 py-0.5">${u.unread}</span>`:''}`;
          elements.conversationsList.appendChild(div);
        });
      }

      function selectChat(userId) {
        currentChatId = userId;
        currentUser = users.find(u=>u.id===userId);
        updateChatHeader();
        loadChatMessages();
        elements.messageInput.disabled = false;
        elements.messageInput.placeholder = `Message ${currentUser.name}...`;
        elements.messageInput.focus();
        updateConversationsActive();
        if (isMobile) closeSidebar();
      }

      function updateChatHeader() {
        if (!currentUser) return;
        elements.currentUserName.innerText = currentUser.name;
        elements.currentUserAvatar.innerHTML = `<i class="fas fa-${currentUser.avatarIcon}"></i>`;
        elements.currentUserAvatar.className = `avatar avatar-sm bg-gradient-to-r ${currentUser.color}`;
        elements.currentUserStatus.className = `status-dot ${currentUser.status}`;
        elements.currentUserStatusText.innerText = currentUser.status==='online'?'Active now':`Last seen ${currentUser.lastSeen}`;
        elements.welcomeScreen.classList.add('hidden');
        elements.chatMessages.classList.remove('hidden');
      }

      function loadChatMessages() {
        elements.chatMessages.innerHTML = '';
        const msgs = chatMessages[currentChatId] || [];
        const todayDiv = document.createElement('div');
        todayDiv.className = 'date-divider';
        todayDiv.innerHTML = '<span>Today</span>';
        elements.chatMessages.appendChild(todayDiv);
        msgs.forEach(msg => elements.chatMessages.appendChild(createMessageElement(msg)));
        setTimeout(() => elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight, 50);
      }

      function createMessageElement(m) {
        const row = document.createElement('div');
        row.className = `message-row ${m.incoming?'':'justify-end'}`;
        let inner = '';
        const reactions = m.reactions ? `<span class="reaction-badge">${Object.entries(m.reactions).map(([e,c])=>e+' '+c).join(' ')}</span>` : '';
        if (m.type === 'text') {
          inner = `<div class="bubble ${m.incoming?'incoming-bubble':'outgoing-bubble'}">${m.content} ${reactions}<div class="message-time">${m.time}</div></div>`;
        } else if (m.type === 'image') {
          inner = `<div class="bubble ${m.incoming?'incoming-bubble':'outgoing-bubble'} p-1"><img src="${m.url}" class="max-w-full rounded-lg"><div class="p-2">${m.content} ${reactions}<div class="message-time">${m.time}</div></div></div>`;
        } else {
          inner = `<div class="bubble ${m.incoming?'incoming-bubble':'outgoing-bubble'}">${m.content} ${reactions}<div class="message-time">${m.time}</div></div>`;
        }
        if (m.incoming && currentUser) {
          row.innerHTML = `<div class="avatar avatar-sm bg-gradient-to-r ${currentUser.color} mr-2"><i class="fas fa-${currentUser.avatarIcon}"></i></div>${inner}`;
        } else row.innerHTML = inner;
        return row;
      }

      function updateConversationsActive() {
        document.querySelectorAll('.conversation-item').forEach(el => {
          const uid = el.getAttribute('data-userid');
          if (Number(uid) === currentChatId) el.classList.add('active');
          else el.classList.remove('active');
        });
      }

      function sendMessage() {
        if (!currentChatId || !elements.messageInput.value.trim()) return;
        const text = elements.messageInput.value.trim();
        const newMsg = { id:Date.now(), type:'text', content:text, incoming:false, time:getCurrentTime() };
        const msgEl = createMessageElement(newMsg);
        elements.chatMessages.appendChild(msgEl);
        elements.messageInput.value = '';
        elements.sendButton.disabled = true;
        elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
        // fake reply
        setTimeout(() => {
          const typingDiv = document.createElement('div');
          typingDiv.className = 'message-row';
          typingDiv.id = 'typingTemp';
          typingDiv.innerHTML = `<div class="avatar avatar-sm bg-gradient-to-r ${currentUser.color} mr-2"><i class="fas fa-${currentUser.avatarIcon}"></i></div><div class="typing"><span></span><span></span><span></span></div>`;
          elements.chatMessages.appendChild(typingDiv);
          elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
          setTimeout(() => {
            document.getElementById('typingTemp')?.remove();
            const reply = { id:Date.now()+1, type:'text', content:'Got it! Thanks for the message.', incoming:true, time:getCurrentTime() };
            elements.chatMessages.appendChild(createMessageElement(reply));
            elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
          }, 1400);
        }, 700);
      }

      // UI toggles
      function toggleSidebar() { if(isMobile){ elements.sidebar.classList.toggle('active'); elements.mobileOverlay.classList.toggle('active'); } }
      function closeSidebar() { elements.sidebar.classList.remove('active'); elements.mobileOverlay.classList.remove('active'); }
      function backToContacts() { if(isMobile) toggleSidebar(); }

      // theme
      function toggleTheme() {
        isDark = !isDark;
        elements.body.setAttribute('data-theme', isDark?'dark':'light');
        elements.themeToggle.innerHTML = isDark?'<i class="fas fa-moon"></i>':'<i class="fas fa-sun"></i>';
        localStorage.setItem('wavechat-theme', isDark?'dark':'light');
      }

      // init theme
      const saved = localStorage.getItem('wavechat-theme');
      if (saved === 'dark') { isDark=true; elements.body.setAttribute('data-theme','dark'); elements.themeToggle.innerHTML='<i class="fas fa-moon"></i>'; }

      // event listeners
      elements.themeToggle.addEventListener('click', toggleTheme);
      elements.messageInput.addEventListener('input', function(){ elements.sendButton.disabled = this.value.trim()===''; });
      elements.messageInput.addEventListener('keypress', (e) => { if(e.key==='Enter' && !e.shiftKey && elements.messageInput.value.trim()!=='') { e.preventDefault(); sendMessage(); } });
      elements.searchInput.addEventListener('input', function(e) {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.conversation-item').forEach((item,idx) => {
          const user = users[idx];
          item.style.display = (user.name.toLowerCase().includes(term) || user.lastMessage.toLowerCase().includes(term) || term==='') ? 'flex' : 'none';
        });
      });
      elements.mobileOverlay.addEventListener('click', closeSidebar);
      document.getElementById('mobileFab').addEventListener('click', toggleSidebar);
      window.addEventListener('resize', () => { isMobile = window.innerWidth < 768; if(!isMobile) closeSidebar(); });

      // load data
      loadOnlineUsers();
      loadConversations();

      // expose globals for onclick handlers
      window.selectChat = selectChat; window.toggleSidebar = toggleSidebar; window.closeSidebar = closeSidebar; window.backToContacts = backToContacts;
      window.newChat = ()=>alert('✨ New chat (demo)'); window.showSettings = ()=>alert('Settings panel');
      window.startCall = ()=>currentUser?alert(`Calling ${currentUser.name}...`):alert('Select a chat');
      window.startVideoCall = ()=>currentUser?alert(`Video call with ${currentUser.name}`):alert('Select chat');
      window.toggleChatMenu = ()=>document.getElementById('chatMenu').classList.toggle('hidden');
      window.toggleAttachmentMenu = ()=>document.getElementById('attachmentMenu').classList.toggle('hidden');
      window.viewProfile = ()=>{alert('View profile'); window.toggleChatMenu();};
      window.muteChat = ()=>{alert('Muted'); window.toggleChatMenu();};
      window.clearChat = ()=>{ if(confirm('Clear all messages?')) { document.getElementById('chatMessages').innerHTML=''; } window.toggleChatMenu(); };
      window.exportChat = ()=>{alert('Export chat'); window.toggleChatMenu();};
      window.attachPhoto=()=>{alert('📷 attach'); toggleAttachmentMenu();};
      window.attachFile=()=>{alert('📁 attach'); toggleAttachmentMenu();};
      window.attachLocation=()=>{alert('📍 location'); toggleAttachmentMenu();};
      window.attachContact=()=>{alert('👤 contact'); toggleAttachmentMenu();};
      window.toggleEmojiPicker = ()=>alert('Emoji picker 🚧');
      window.sendMessage = sendMessage;
    })();
  