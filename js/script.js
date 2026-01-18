// Data
const users = [
  {
    id: 1,
    name: "John Doe",
    avatar: "JD",
    avatarIcon: "user-tie",
    status: "online",
    lastSeen: "Just now",
    lastMessage: "Check out this cool photo I took!",
    unread: 0,
    color: "from-indigo-500 to-purple-500",
    isFavorite: true,
  },
  {
    id: 2,
    name: "Alice Smith",
    avatar: "AS",
    avatarIcon: "user-graduate",
    status: "online",
    lastSeen: "2 min ago",
    lastMessage: "Can we meet tomorrow for coffee?",
    unread: 3,
    color: "from-pink-500 to-rose-500",
    isFavorite: true,
  },
  {
    id: 3,
    name: "Mike Johnson",
    avatar: "MJ",
    avatarIcon: "user-ninja",
    status: "away",
    lastSeen: "30 min ago",
    lastMessage: "I've sent you the project files",
    unread: 0,
    color: "from-emerald-500 to-teal-500",
    isFavorite: false,
  },
  {
    id: 4,
    name: "Sarah Brown",
    avatar: "SB",
    avatarIcon: "user-astronaut",
    status: "offline",
    lastSeen: "2 hours ago",
    lastMessage: "Thanks for your help with the presentation!",
    unread: 1,
    color: "from-amber-500 to-orange-500",
    isFavorite: true,
  },
  {
    id: 5,
    name: "Team Work",
    avatar: "TW",
    avatarIcon: "users",
    status: "online",
    lastSeen: "Yesterday",
    lastMessage: "Meeting scheduled for 3 PM tomorrow",
    unread: 5,
    color: "from-blue-500 to-cyan-500",
    isFavorite: false,
  },
  {
    id: 6,
    name: "Emma Davis",
    avatar: "ED",
    avatarIcon: "user-secret",
    status: "dnd",
    lastSeen: "5 min ago",
    lastMessage: "Are you free for a quick call?",
    unread: 2,
    color: "from-rose-500 to-pink-500",
    isFavorite: true,
  },
  {
    id: 7,
    name: "Robert Garcia",
    avatar: "RG",
    avatarIcon: "user-cowboy",
    status: "offline",
    lastSeen: "1 hour ago",
    lastMessage: "See you at the conference!",
    unread: 0,
    color: "from-sky-500 to-blue-500",
    isFavorite: false,
  },
  {
    id: 8,
    name: "Lisa Wang",
    avatar: "LW",
    avatarIcon: "user-nurse",
    status: "online",
    lastSeen: "Just now",
    lastMessage: "Let's catch up this weekend",
    unread: 0,
    color: "from-violet-500 to-purple-500",
    isFavorite: true,
  },
];

const chatMessages = {
  1: [
    {
      id: 1,
      type: "text",
      content: "Hey there! How are you doing today?",
      incoming: true,
      time: "10:30 AM",
      reactions: { "👍": 1 },
    },
    {
      id: 2,
      type: "text",
      content:
        "I'm doing great! Just working on this amazing chat UI redesign.",
      incoming: false,
      time: "10:32 AM",
    },
    {
      id: 3,
      type: "image",
      content: "Check out this awesome view from my hike!",
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      incoming: true,
      time: "10:35 AM",
      reactions: { "❤️": 2, "😍": 1 },
    },
    {
      id: 4,
      type: "text",
      content: "Wow, that's absolutely stunning! Where was this taken?",
      incoming: false,
      time: "10:36 AM",
    },
    {
      id: 5,
      type: "video",
      content: "This video perfectly captures the moment!",
      url: "https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4",
      incoming: true,
      time: "10:37 AM",
    },
  ],
  2: [
    {
      id: 1,
      type: "text",
      content: "Hi Alice! How's your day going?",
      incoming: false,
      time: "9:15 AM",
    },
    {
      id: 2,
      type: "text",
      content:
        "Going well! Just finished my morning meetings. Can we meet tomorrow for coffee?",
      incoming: true,
      time: "9:20 AM",
      reactions: { "☕": 1 },
    },
  ],
  4: [
    {
      id: 1,
      type: "text",
      content: "Thanks for your help with the project presentation!",
      incoming: true,
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "text",
      content:
        "You're welcome! Happy to help anytime. Let me know if you need anything else.",
      incoming: false,
      time: "1 hour ago",
    },
  ],
  6: [
    {
      id: 1,
      type: "text",
      content:
        "Hey Emma, are you free for a quick call about the design system?",
      incoming: false,
      time: "11:45 AM",
    },
    {
      id: 2,
      type: "text",
      content: "Sure! Give me 10 minutes to wrap up what I'm working on.",
      incoming: true,
      time: "11:46 AM",
    },
  ],
};

// App State
let currentChatId = null;
let currentUser = null;
let isMobile = window.innerWidth < 768;
let isDarkMode = false;

// DOM Elements
const elements = {
  body: document.body,
  sidebar: document.getElementById("sidebar"),
  chatArea: document.getElementById("chatArea"),
  mobileOverlay: document.getElementById("mobileOverlay"),
  mobileFab: document.getElementById("mobileFab"),
  themeToggle: document.getElementById("themeToggle"),
  onlineUsers: document.getElementById("onlineUsers"),
  conversationsList: document.getElementById("conversationsList"),
  welcomeScreen: document.getElementById("welcomeScreen"),
  chatMessages: document.getElementById("chatMessages"),
  messagesContainer: document.getElementById("messagesContainer"),
  currentUserName: document.getElementById("currentUserName"),
  currentUserAvatar: document.getElementById("currentUserAvatar"),
  currentUserStatus: document.getElementById("currentUserStatus"),
  currentUserStatusText: document.getElementById("currentUserStatusText"),
  messageInput: document.getElementById("messageInput"),
  sendButton: document.getElementById("sendButton"),
  attachmentMenu: document.getElementById("attachmentMenu"),
  chatMenu: document.getElementById("chatMenu"),
  searchInput: document.getElementById("searchInput"),
};

// Initialize App
function initApp() {
  loadOnlineUsers();
  loadConversations();
  setupEventListeners();
  setupTheme();
  checkMobile();
}

// Setup Event Listeners
function setupEventListeners() {
  // Message input
  elements.messageInput.addEventListener("input", function () {
    elements.sendButton.disabled = this.value.trim() === "";
  });

  elements.messageInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && !e.shiftKey && this.value.trim() !== "") {
      e.preventDefault();
      sendMessage();
    }
  });

  // Theme toggle
  elements.themeToggle.addEventListener("click", toggleTheme);

  // Mobile overlay
  elements.mobileOverlay.addEventListener("click", closeSidebar);

  // Mobile FAB
  elements.mobileFab.addEventListener("click", toggleSidebar);

  // Search
  elements.searchInput.addEventListener("input", searchConversations);

  // Window resize
  window.addEventListener("resize", checkMobile);
}

// Theme Functions
function setupTheme() {
  const savedTheme = localStorage.getItem("wavechat-theme") || "light";
  isDarkMode = savedTheme === "dark";

  if (isDarkMode) {
    elements.body.setAttribute("data-theme", "dark");
    elements.themeToggle.innerHTML = '<i class="fas fa-moon text-lg"></i>';
  } else {
    elements.body.setAttribute("data-theme", "light");
    elements.themeToggle.innerHTML = '<i class="fas fa-sun text-lg"></i>';
  }
}

function toggleTheme() {
  isDarkMode = !isDarkMode;

  if (isDarkMode) {
    elements.body.setAttribute("data-theme", "dark");
    elements.themeToggle.innerHTML = '<i class="fas fa-moon text-lg"></i>';
    localStorage.setItem("wavechat-theme", "dark");
  } else {
    elements.body.setAttribute("data-theme", "light");
    elements.themeToggle.innerHTML = '<i class="fas fa-sun text-lg"></i>';
    localStorage.setItem("wavechat-theme", "light");
  }
}

// Load Online Users
function loadOnlineUsers() {
  const onlineUsers = users.filter((user) => user.status === "online");

  onlineUsers.forEach((user) => {
    const userElement = document.createElement("div");
    userElement.className = "flex flex-col items-center cursor-pointer group";
    userElement.onclick = () => selectChat(user.id);

    userElement.innerHTML = `
          <div class="relative mb-2">
            <div class="avatar avatar-sm bg-gradient-to-r ${user.color}">
              <i class="fas fa-${user.avatarIcon}"></i>
            </div>
            <div class="status status-${user.status}"></div>
          </div>
          <span class="text-xs font-medium group-hover:text-primary transition-colors">${user.name.split(" ")[0]}</span>
        `;

    elements.onlineUsers.appendChild(userElement);
  });
}

// Load Conversations
function loadConversations() {
  elements.conversationsList.innerHTML = "";

  users.forEach((user) => {
    const conversationElement = document.createElement("div");
    conversationElement.className = `flex items-center p-3 rounded-xl hover:bg-tertiary cursor-pointer transition-all mb-2 ${currentChatId === user.id ? "bg-tertiary ring-2 ring-primary/20" : ""}`;
    conversationElement.onclick = () => selectChat(user.id);

    conversationElement.innerHTML = `
          <div class="relative">
            <div class="avatar avatar-md bg-gradient-to-r ${user.color}">
              <i class="fas fa-${user.avatarIcon}"></i>
            </div>
            <div class="status status-${user.status}"></div>
            ${user.isFavorite ? '<div class="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center"><i class="fas fa-star text-xs text-white"></i></div>' : ""}
          </div>
          <div class="flex-1 ml-3 min-w-0">
            <div class="flex justify-between items-center">
              <h3 class="font-semibold truncate">${user.name}</h3>
              <span class="text-xs text-secondary">${user.lastSeen}</span>
            </div>
            <p class="text-sm text-secondary truncate">${user.lastMessage}</p>
          </div>
          ${user.unread > 0 ? `<div class="badge ml-2">${user.unread}</div>` : ""}
        `;

    elements.conversationsList.appendChild(conversationElement);
  });
}

// Select Chat
function selectChat(userId) {
  currentChatId = userId;
  currentUser = users.find((user) => user.id === userId);

  // Update UI
  updateChatHeader();
  loadChatMessages();
  enableMessageInput();
  updateConversationsList();

  // On mobile, close sidebar
  if (isMobile) {
    closeSidebar();
  }
}

// Update Chat Header
function updateChatHeader() {
  if (!currentUser) return;

  elements.currentUserName.textContent = currentUser.name;
  elements.currentUserAvatar.innerHTML = `<i class="fas fa-${currentUser.avatarIcon}"></i>`;
  elements.currentUserAvatar.className = `avatar avatar-md bg-gradient-to-r ${currentUser.color}`;
  elements.currentUserStatus.className = `status status-${currentUser.status}`;
  elements.currentUserStatusText.textContent =
    currentUser.status === "online"
      ? "Active now"
      : currentUser.status === "away"
        ? "Away"
        : currentUser.status === "dnd"
          ? "Do not disturb"
          : "Last seen " + currentUser.lastSeen;

  elements.welcomeScreen.classList.add("hidden");
  elements.chatMessages.classList.remove("hidden");
}

// Load Chat Messages
function loadChatMessages() {
  elements.chatMessages.innerHTML = "";

  // Add date separator
  const dateSeparator = document.createElement("div");
  dateSeparator.className = "date-separator";
  dateSeparator.innerHTML = "<span>Today</span>";
  elements.chatMessages.appendChild(dateSeparator);

  // Load messages
  const messages = chatMessages[currentChatId] || [];

  messages.forEach((message, index) => {
    const messageElement = createMessageElement(message, index);
    elements.chatMessages.appendChild(messageElement);
  });

  // Scroll to bottom
  setTimeout(() => {
    elements.messagesContainer.scrollTop =
      elements.messagesContainer.scrollHeight;
  }, 100);

  // Add typing indicator if no messages
  if (messages.length === 0) {
    setTimeout(() => {
      addTypingIndicator();
      setTimeout(removeTypingIndicator, 2000);
    }, 500);
  }
}

// Create Message Element
function createMessageElement(message, index) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `flex mb-4 ${message.incoming ? "" : "justify-end"} fade-in`;

  let contentHtml = "";

  if (message.type === "text") {
    contentHtml = `
          <div class="message-bubble ${message.incoming ? "incoming-message" : "outgoing-message"}">
            ${message.content}
            ${message.reactions ? createReactionsHTML(message.reactions) : ""}
            <div class="message-time mt-1 text-xs opacity-75">${message.time}</div>
          </div>
        `;
  } else if (message.type === "image") {
    contentHtml = `
          <div class="message-bubble ${message.incoming ? "incoming-message" : "outgoing-message"} p-0 overflow-hidden">
            <div class="attachment-preview">
              <img src="${message.url}" alt="Shared image" class="w-full h-auto">
              <div class="attachment-overlay">
                <button class="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <i class="fas fa-expand text-white"></i>
                </button>
              </div>
            </div>
            <div class="p-3">
              <p>${message.content}</p>
              ${message.reactions ? createReactionsHTML(message.reactions) : ""}
              <div class="message-time mt-1 text-xs opacity-75">${message.time}</div>
            </div>
          </div>
        `;
  } else if (message.type === "video") {
    contentHtml = `
          <div class="message-bubble ${message.incoming ? "incoming-message" : "outgoing-message"} p-0 overflow-hidden">
            <div class="attachment-preview">
              <video class="w-full h-auto" controls>
                <source src="${message.url}" type="video/mp4">
              </video>
            </div>
            <div class="p-3">
              <p>${message.content}</p>
              <div class="message-time mt-1 text-xs opacity-75">${message.time}</div>
            </div>
          </div>
        `;
  }

  if (message.incoming) {
    messageDiv.innerHTML = `
          <div class="flex-shrink-0 mr-3">
            <div class="avatar avatar-sm bg-gradient-to-r ${currentUser.color}">
              <i class="fas fa-${currentUser.avatarIcon}"></i>
            </div>
          </div>
          ${contentHtml}
        `;
  } else {
    messageDiv.innerHTML = contentHtml;
  }

  return messageDiv;
}

// Create Reactions HTML
function createReactionsHTML(reactions) {
  const reactionsArray = Object.entries(reactions);
  if (reactionsArray.length === 0) return "";

  return `
        <div class="message-reaction">
          ${reactionsArray.map(([emoji, count]) => `${emoji} ${count}`).join(" ")}
        </div>
      `;
}

// Add Typing Indicator
function addTypingIndicator() {
  const typingDiv = document.createElement("div");
  typingDiv.id = "typingIndicator";
  typingDiv.className = "flex mb-4 fade-in";

  typingDiv.innerHTML = `
        <div class="flex-shrink-0 mr-3">
          <div class="avatar avatar-sm bg-gradient-to-r ${currentUser.color}">
            <i class="fas fa-${currentUser.avatarIcon}"></i>
          </div>
        </div>
        <div class="typing-indicator bg-tertiary rounded-full">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      `;

  elements.chatMessages.appendChild(typingDiv);
  elements.messagesContainer.scrollTop =
    elements.messagesContainer.scrollHeight;
}

// Remove Typing Indicator
function removeTypingIndicator() {
  const typingIndicator = document.getElementById("typingIndicator");
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Send Message
function sendMessage() {
  const text = elements.messageInput.value.trim();
  if (!text || !currentChatId) return;

  // Create message
  const message = {
    id: Date.now(),
    type: "text",
    content: text,
    incoming: false,
    time: getCurrentTime(),
  };

  // Add to chat
  const messageElement = createMessageElement(message);
  elements.chatMessages.appendChild(messageElement);

  // Clear input
  elements.messageInput.value = "";
  elements.sendButton.disabled = true;

  // Scroll to bottom
  elements.messagesContainer.scrollTop =
    elements.messagesContainer.scrollHeight;

  // Simulate reply
  setTimeout(() => {
    addTypingIndicator();

    setTimeout(() => {
      removeTypingIndicator();

      const reply = {
        id: Date.now() + 1,
        type: "text",
        content: "Got it! Thanks for your message. Let me think about that...",
        incoming: true,
        time: getCurrentTime(),
      };

      const replyElement = createMessageElement(reply);
      elements.chatMessages.appendChild(replyElement);
      elements.messagesContainer.scrollTop =
        elements.messagesContainer.scrollHeight;
    }, 1500);
  }, 1000);
}

// Enable Message Input
function enableMessageInput() {
  elements.messageInput.disabled = false;
  elements.messageInput.placeholder = `Message ${currentUser.name}...`;
  elements.sendButton.disabled = true;
  elements.messageInput.focus();
}

// Update Conversations List
function updateConversationsList() {
  document
    .querySelectorAll("#conversationsList > div")
    .forEach((item, index) => {
      if (users[index].id === currentChatId) {
        item.classList.add("bg-tertiary", "ring-2", "ring-primary/20");
      } else {
        item.classList.remove("bg-tertiary", "ring-2", "ring-primary/20");
      }
    });
}

// Search Conversations
function searchConversations() {
  const searchTerm = elements.searchInput.value.toLowerCase();

  users.forEach((user, index) => {
    const conversationItem = elements.conversationsList.children[index];
    const userName = user.name.toLowerCase();
    const userMessage = user.lastMessage.toLowerCase();

    if (
      userName.includes(searchTerm) ||
      userMessage.includes(searchTerm) ||
      searchTerm === ""
    ) {
      conversationItem.style.display = "flex";
    } else {
      conversationItem.style.display = "none";
    }
  });
}

// Get Current Time
function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Mobile Functions
function checkMobile() {
  isMobile = window.innerWidth < 768;

  if (!isMobile) {
    closeSidebar();
    elements.sidebar.classList.remove("active");
    elements.mobileOverlay.classList.remove("active");
  }
}

function toggleSidebar() {
  if (isMobile) {
    elements.sidebar.classList.toggle("active");
    elements.mobileOverlay.classList.toggle("active");
    document.body.style.overflow = elements.sidebar.classList.contains("active")
      ? "hidden"
      : "auto";
  }
}

function closeSidebar() {
  if (isMobile) {
    elements.sidebar.classList.remove("active");
    elements.mobileOverlay.classList.remove("active");
    document.body.style.overflow = "auto";
  }
}

function backToContacts() {
  if (isMobile) {
    toggleSidebar();
  }
}

// Menu Functions
function toggleChatMenu() {
  elements.chatMenu.classList.toggle("hidden");
}

function toggleAttachmentMenu() {
  elements.attachmentMenu.classList.toggle("hidden");
}

// Action Functions
function newChat() {
  alert("Opening new chat dialog...");
  if (isMobile) closeSidebar();
}

function showSettings() {
  alert("Opening settings...");
}

function startCall() {
  if (!currentUser) {
    alert("Please select a chat first");
    return;
  }
  alert(`Starting audio call with ${currentUser.name}...`);
}

function startVideoCall() {
  if (!currentUser) {
    alert("Please select a chat first");
    return;
  }
  alert(`Starting video call with ${currentUser.name}...`);
}

function viewProfile() {
  if (!currentUser) return;
  alert(`Viewing ${currentUser.name}'s profile...`);
  toggleChatMenu();
}

function muteChat() {
  alert("Notifications muted for this chat");
  toggleChatMenu();
}

function clearChat() {
  if (
    confirm(
      "Are you sure you want to clear this chat? This action cannot be undone.",
    )
  ) {
    elements.chatMessages.innerHTML = "";
    alert("Chat cleared");
  }
  toggleChatMenu();
}

function exportChat() {
  alert("Exporting chat as PDF...");
  toggleChatMenu();
}

function attachPhoto() {
  alert("Attaching photo...");
  toggleAttachmentMenu();
}

function attachFile() {
  alert("Attaching file...");
  toggleAttachmentMenu();
}

function attachLocation() {
  alert("Sharing location...");
  toggleAttachmentMenu();
}

function attachContact() {
  alert("Sharing contact...");
  toggleAttachmentMenu();
}

function toggleEmojiPicker() {
  alert("Emoji picker coming soon!");
}

function recordAudio() {
  alert("Audio recording starting...");
}

// Initialize app
document.addEventListener("DOMContentLoaded", initApp);
