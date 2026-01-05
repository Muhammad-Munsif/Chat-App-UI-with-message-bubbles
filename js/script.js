
    // Initial Data
    const users = [
      {
        id: 1,
        name: "John Doe",
        avatar: "JD",
        status: "online",
        lastSeen: "10:35 AM",
        lastMessage: "Check out this cool photo I took!",
        unread: 0,
        color: "bg-gradient-to-r from-indigo-500 to-purple-500"
      },
      {
        id: 2,
        name: "Alice Smith",
        avatar: "AS",
        status: "online",
        lastSeen: "9:20 AM",
        lastMessage: "Can we meet tomorrow?",
        unread: 3,
        color: "bg-gradient-to-r from-pink-500 to-rose-500"
      },
      {
        id: 3,
        name: "Mike Johnson",
        avatar: "MJ",
        status: "away",
        lastSeen: "Yesterday",
        lastMessage: "I sent you the files",
        unread: 0,
        color: "bg-gradient-to-r from-emerald-500 to-teal-500"
      },
      {
        id: 4,
        name: "Sarah Brown",
        avatar: "SB",
        status: "offline",
        lastSeen: "2 hours ago",
        lastMessage: "Thanks for your help!",
        unread: 1,
        color: "bg-gradient-to-r from-amber-500 to-orange-500"
      },
      {
        id: 5,
        name: "Team Work",
        avatar: "TW",
        status: "online",
        lastSeen: "Mon",
        lastMessage: "Meeting at 3 PM",
        unread: 5,
        color: "bg-gradient-to-r from-blue-500 to-cyan-500"
      },
      {
        id: 6,
        name: "David Wilson",
        avatar: "DW",
        status: "online",
        lastSeen: "Just now",
        lastMessage: "Let's catch up soon",
        unread: 0,
        color: "bg-gradient-to-r from-violet-500 to-purple-500"
      },
      {
        id: 7,
        name: "Emma Davis",
        avatar: "ED",
        status: "away",
        lastSeen: "30 min ago",
        lastMessage: "Are you free for a call?",
        unread: 2,
        color: "bg-gradient-to-r from-rose-500 to-pink-500"
      },
      {
        id: 8,
        name: "Robert Garcia",
        avatar: "RG",
        status: "offline",
        lastSeen: "5 hours ago",
        lastMessage: "See you tomorrow!",
        unread: 0,
        color: "bg-gradient-to-r from-sky-500 to-blue-500"
      }
    ];

    // Chat Messages Data
    const chatMessages = {
      1: [
        { id: 1, text: "Hey there! How are you doing?", incoming: true, time: "10:30 AM", type: "text" },
        { id: 2, text: "I'm doing great! Just working on this new chat UI.", incoming: false, time: "10:32 AM", type: "text" },
        { id: 3, text: "Check out this cool photo I took!", incoming: true, time: "10:35 AM", type: "image", url: "https://source.unsplash.com/random/300x200?nature" },
        { id: 4, text: "That's amazing! Where was this taken?", incoming: false, time: "10:36 AM", type: "text" },
        { id: 5, text: "Check out this video from my trip!", incoming: true, time: "10:37 AM", type: "video", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" }
      ],
      2: [
        { id: 1, text: "Hi Alice! How's your day going?", incoming: false, time: "9:15 AM", type: "text" },
        { id: 2, text: "Going well! Can we meet tomorrow?", incoming: true, time: "9:20 AM", type: "text" }
      ],
      3: [
        { id: 1, text: "Files sent successfully!", incoming: true, time: "Yesterday", type: "text" },
        { id: 2, text: "Thanks! Got them.", incoming: false, time: "Yesterday", type: "text" }
      ],
      4: [
        { id: 1, text: "Thanks for your help with the project!", incoming: true, time: "2 hours ago", type: "text" },
        { id: 2, text: "You're welcome! Anytime.", incoming: false, time: "1 hour ago", type: "text" }
      ],
      5: [
        { id: 1, text: "Meeting scheduled for 3 PM", incoming: true, time: "Mon", type: "text" },
        { id: 2, text: "Don't forget to bring the reports", incoming: false, time: "Mon", type: "text" }
      ]
    };

    // Current State
    let currentUserId = null;
    let currentUser = null;
    let isMobile = window.innerWidth < 768;

    // DOM Elements
    const elements = {
      contactsList: document.getElementById('contacts-list'),
      chatMessages: document.getElementById('chat-messages'),
      noChatSelected: document.getElementById('no-chat-selected'),
      currentUserName: document.getElementById('current-user-name'),
      currentUserAvatar: document.getElementById('current-user-avatar'),
      currentUserStatus: document.getElementById('current-user-status'),
      messageInput: document.getElementById('message-input'),
      sendButton: document.getElementById('send-button'),
      contactsSidebar: document.getElementById('contacts-sidebar'),
      chatContainer: document.getElementById('chat-container'),
      overlay: document.getElementById('overlay'),
      menuDropdown: document.getElementById('menu-dropdown'),
      themeToggle: document.getElementById('themeToggle'),
      searchContacts: document.getElementById('searchContacts'),
      body: document.body,
      sunIcon: document.getElementById('sun-icon'),
      moonIcon: document.getElementById('moon-icon')
    };

    // Initialize App
    function initApp() {
      loadContacts();
      setupEventListeners();
      setupTheme();
      checkMobile();
      
      // Auto-select first user on desktop
      if (!isMobile && users.length > 0) {
        selectUser(users[0].id);
      }
    }

    // Setup Event Listeners
    function setupEventListeners() {
      // Message input
      elements.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && currentUserId) {
          sendMessage();
        }
      });

      // Theme toggle
      elements.themeToggle.addEventListener('change', toggleTheme);

      // Search contacts
      elements.searchContacts.addEventListener('input', searchContacts);

      // Window resize
      window.addEventListener('resize', checkMobile);

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.relative') && !e.target.closest('#menu-dropdown')) {
          elements.menuDropdown.classList.add('hidden');
        }
      });
    }

    // Load Contacts
    function loadContacts() {
      elements.contactsList.innerHTML = '';
      
      users.forEach(user => {
        const contactItem = createContactElement(user);
        elements.contactsList.appendChild(contactItem);
      });
    }

    // Create Contact Element
    function createContactElement(user) {
      const div = document.createElement('div');
      div.className = `contact-item flex items-center p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-all mb-2 user-selection ${currentUserId === user.id ? 'active-user' : ''}`;
      div.onclick = () => selectUser(user.id);
      
      div.innerHTML = `
        <div class="relative">
          <div class="avatar avatar-medium rounded-full ${user.color}">
            ${user.avatar}
          </div>
          <div class="status-${user.status}"></div>
        </div>
        <div class="flex-1 ml-4">
          <div class="flex justify-between items-center">
            <h3 class="font-semibold">${user.name}</h3>
            <span class="text-xs text-gray-500 dark:text-gray-400">${user.lastSeen}</span>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 truncate">${user.lastMessage}</p>
        </div>
        ${user.unread > 0 ? `
          <div class="unread-badge ml-3">
            ${user.unread}
          </div>
        ` : ''}
      `;
      
      return div;
    }

    // Select User
    function selectUser(userId) {
      currentUserId = userId;
      currentUser = users.find(u => u.id === userId);
      
      // Update UI
      updateActiveContact();
      loadChatMessages();
      enableMessageInput();
      
      // On mobile, hide sidebar after selection
      if (isMobile) {
        closeSidebar();
      }
      
      // Scroll to top of chat
      elements.chatMessages.scrollTop = 0;
    }

    // Update Active Contact
    function updateActiveContact() {
      if (!currentUser) return;
      
      // Update header
      elements.currentUserName.textContent = currentUser.name;
      elements.currentUserAvatar.textContent = currentUser.avatar;
      elements.currentUserStatus.textContent = currentUser.status.charAt(0).toUpperCase() + currentUser.status.slice(1);
      
      // Update contacts list
      document.querySelectorAll('.contact-item').forEach(item => {
        item.classList.remove('active-user');
      });
      
      const activeContact = document.querySelector(`.contact-item:nth-child(${users.findIndex(u => u.id === currentUserId) + 1})`);
      if (activeContact) {
        activeContact.classList.add('active-user');
      }
    }

    // Load Chat Messages
    function loadChatMessages() {
      elements.noChatSelected.style.display = 'none';
      elements.chatMessages.innerHTML = '';
      
      // Add date divider
      const dateDivider = document.createElement('div');
      dateDivider.className = 'date-divider';
      dateDivider.innerHTML = '<span>Today</span>';
      elements.chatMessages.appendChild(dateDivider);
      
      // Load messages for current user
      const messages = chatMessages[currentUserId] || [];
      
      messages.forEach(message => {
        const messageElement = createMessageElement(message);
        elements.chatMessages.appendChild(messageElement);
      });
      
      // Add typing indicator for new chats
      if (messages.length === 0) {
        addTypingIndicator();
      }
      
      // Scroll to bottom
      setTimeout(() => {
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
      }, 100);
    }

    // Create Message Element
    function createMessageElement(message) {
      const div = document.createElement('div');
      div.className = `flex mb-6 ${message.incoming ? '' : 'justify-end'} message`;
      
      if (message.type === 'text') {
        div.innerHTML = `
          ${message.incoming ? `
            <div class="flex-shrink-0 mr-3">
              <div class="avatar avatar-small rounded-full ${currentUser.color}">
                ${currentUser.avatar}
              </div>
            </div>
          ` : ''}
          <div class="flex flex-col ${message.incoming ? 'items-start' : 'items-end'} max-w-[80%]">
            <div class="${message.incoming ? 'incoming-message' : 'outgoing-message'} px-5 py-3">
              ${message.text}
            </div>
            <span class="message-time">${message.time}</span>
          </div>
        `;
      } else if (message.type === 'image') {
        div.innerHTML = `
          ${message.incoming ? `
            <div class="flex-shrink-0 mr-3">
              <div class="avatar avatar-small rounded-full ${currentUser.color}">
                ${currentUser.avatar}
              </div>
            </div>
          ` : ''}
          <div class="flex flex-col ${message.incoming ? 'items-start' : 'items-end'} max-w-[70%]">
            <div class="${message.incoming ? 'incoming-message' : 'outgoing-message'} p-2">
              <img src="${message.url}" alt="Shared image" class="rounded-lg max-w-full h-auto">
            </div>
            <span class="message-time">${message.time}</span>
          </div>
        `;
      } else if (message.type === 'video') {
        div.innerHTML = `
          ${message.incoming ? `
            <div class="flex-shrink-0 mr-3">
              <div class="avatar avatar-small rounded-full ${currentUser.color}">
                ${currentUser.avatar}
              </div>
            </div>
          ` : ''}
          <div class="flex flex-col ${message.incoming ? 'items-start' : 'items-end'} max-w-[70%]">
            <div class="${message.incoming ? 'incoming-message' : 'outgoing-message'} p-2">
              <div class="video-container">
                <video class="video-player" controls>
                  <source src="${message.url}" type="video/mp4">
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
            <span class="message-time">${message.time}</span>
          </div>
        `;
      }
      
      return div;
    }

    // Send Message
    function sendMessage() {
      const text = elements.messageInput.value.trim();
      if (!text || !currentUserId) return;
      
      // Create message object
      const message = {
        id: Date.now(),
        text: text,
        incoming: false,
        time: getCurrentTime(),
        type: 'text'
      };
      
      // Add to chat
      const messageElement = createMessageElement(message);
      elements.chatMessages.appendChild(messageElement);
      
      // Clear input
      elements.messageInput.value = '';
      
      // Scroll to bottom
      elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
      
      // Simulate reply after delay
      setTimeout(() => {
        addTypingIndicator();
        
        setTimeout(() => {
          removeTypingIndicator();
          
          const reply = {
            id: Date.now() + 1,
            text: "Thanks for your message! I'll reply soon.",
            incoming: true,
            time: getCurrentTime(),
            type: 'text'
          };
          
          const replyElement = createMessageElement(reply);
          elements.chatMessages.appendChild(replyElement);
          elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        }, 1500);
      }, 1000);
    }

    // Add Typing Indicator
    function addTypingIndicator() {
      const typingDiv = document.createElement('div');
      typingDiv.id = 'typing-indicator';
      typingDiv.className = 'flex mb-6';
      typingDiv.innerHTML = `
        <div class="flex-shrink-0 mr-3">
          <div class="avatar avatar-small rounded-full ${currentUser.color}">
            ${currentUser.avatar}
          </div>
        </div>
        <div class="incoming-message px-5 py-3">
          <div class="typing-indicator flex space-x-1">
            <div class="w-2 h-2 bg-gray-400 rounded-full" style="animation-delay: 0.1s"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full" style="animation-delay: 0.3s"></div>
          </div>
        </div>
      `;
      elements.chatMessages.appendChild(typingDiv);
      elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }

    // Remove Typing Indicator
    function removeTypingIndicator() {
      const typingIndicator = document.getElementById('typing-indicator');
      if (typingIndicator) {
        typingIndicator.remove();
      }
    }

    // Enable Message Input
    function enableMessageInput() {
      elements.messageInput.disabled = false;
      elements.messageInput.placeholder = "Type a message...";
      elements.sendButton.disabled = false;
    }

    // Get Current Time
    function getCurrentTime() {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours}:${minutes} ${ampm}`;
    }

    // Sidebar Functions
    function toggleSidebar() {
      if (isMobile) {
        elements.contactsSidebar.classList.toggle('mobile-active');
        elements.overlay.classList.toggle('active');
        document.body.style.overflow = elements.overlay.classList.contains('active') ? 'hidden' : 'auto';
      }
    }

    function closeSidebar() {
      if (isMobile) {
        elements.contactsSidebar.classList.remove('mobile-active');
        elements.overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
      }
    }

    function backToContacts() {
      if (isMobile) {
        openSidebar();
      }
    }

    function openSidebar() {
      if (isMobile) {
        elements.contactsSidebar.classList.add('mobile-active');
        elements.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }

    // Menu Functions
    function toggleMenu() {
      elements.menuDropdown.classList.toggle('hidden');
    }

    // Theme Functions - FIXED
    function setupTheme() {
      const savedTheme = localStorage.getItem('chat-theme') || 'light';
      if (savedTheme === 'dark') {
        elements.body.classList.add('dark-mode');
        elements.themeToggle.checked = true;
        updateThemeIcons(true);
      } else {
        elements.body.classList.remove('dark-mode');
        elements.themeToggle.checked = false;
        updateThemeIcons(false);
      }
      
      // Apply dark mode classes to all elements that need them
      applyDarkModeClasses();
    }

    function toggleTheme() {
      const isDark = !elements.body.classList.contains('dark-mode');
      
      if (isDark) {
        elements.body.classList.add('dark-mode');
        localStorage.setItem('chat-theme', 'dark');
      } else {
        elements.body.classList.remove('dark-mode');
        localStorage.setItem('chat-theme', 'light');
      }
      
      updateThemeIcons(isDark);
      applyDarkModeClasses();
    }

    function updateThemeIcons(isDark) {
      if (isDark) {
        elements.sunIcon.style.opacity = '0.5';
        elements.moonIcon.style.opacity = '1';
      } else {
        elements.sunIcon.style.opacity = '1';
        elements.moonIcon.style.opacity = '0.5';
      }
    }

    function applyDarkModeClasses() {
      // This function ensures dark mode classes are properly applied
      const isDark = elements.body.classList.contains('dark-mode');
      const allElements = document.querySelectorAll('*');
      
      // Update CSS variables
      document.documentElement.style.setProperty('--bg-light', isDark ? '#0f172a' : '#ffffff');
      document.documentElement.style.setProperty('--text-primary', isDark ? '#f1f5f9' : '#1e293b');
      document.documentElement.style.setProperty('--text-secondary', isDark ? '#cbd5e1' : '#64748b');
      document.documentElement.style.setProperty('--border-light', isDark ? '#334155' : '#e2e8f0');
      document.documentElement.style.setProperty('--secondary', isDark ? '#1e293b' : '#f8fafc');
    }

    // Check Mobile
    function checkMobile() {
      isMobile = window.innerWidth < 768;
      
      if (!isMobile) {
        closeSidebar();
        elements.contactsSidebar.style.transform = 'translateX(0)';
      } else {
        elements.contactsSidebar.style.transform = 'translateX(-100%)';
      }
    }

    // Search Contacts
    function searchContacts() {
      const searchTerm = elements.searchContacts.value.toLowerCase();
      
      users.forEach((user, index) => {
        const contactItem = elements.contactsList.children[index];
        const userName = user.name.toLowerCase();
        const userMessage = user.lastMessage.toLowerCase();
        
        if (userName.includes(searchTerm) || userMessage.includes(searchTerm)) {
          contactItem.style.display = 'flex';
        } else {
          contactItem.style.display = 'none';
        }
      });
    }

    // Action Functions
    function startCall() {
      alert(`Starting audio call with ${currentUser?.name || 'selected contact'}...`);
    }

    function startVideoCall() {
      alert(`Starting video call with ${currentUser?.name || 'selected contact'}...`);
    }

    function viewProfile() {
      alert(`Viewing profile of ${currentUser?.name || 'selected contact'}...`);
      toggleMenu();
    }

    function muteNotifications() {
      alert('Notifications muted');
      toggleMenu();
    }

    function clearChat() {
      if (confirm('Are you sure you want to clear this chat?')) {
        elements.chatMessages.innerHTML = '';
        alert('Chat cleared');
      }
      toggleMenu();
    }

    function exportChat() {
      alert('Chat exported as PDF');
      toggleMenu();
    }

    function newChat() {
      alert('New chat modal opened');
    }

    function showSettings() {
      alert('Settings modal opened');
    }

    // Initialize app when DOM is loaded
    document.addEventListener('DOMContentLoaded', initApp);
  