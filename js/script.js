
(function () {
  // ==================== STATE MANAGEMENT ====================
  let currentChatId = null;
  let currentUser = null;
  let isMobile = window.innerWidth < 768;
  let isDark = localStorage.getItem('theme') === 'dark';

  // Mute states
  let isNotificationMuted = localStorage.getItem('notificationMute') === 'true';
  let isCallMuted = false;
  let isVideoEnabled = true;
  let isSpeakerMuted = false;

  let callTimer = null;
  let callSeconds = 0;
  let localStream = null;
  let currentCallType = null;

  // Demo users data
  const users = [
    { id: 1, name: "John Doe", avatarIcon: "user-tie", status: "online", lastSeen: "just now", lastMessage: "Hey there!", unread: 0, phone: "+1 (555) 111-2222", email: "john@example.com" },
    { id: 2, name: "Alice Smith", avatarIcon: "user-graduate", status: "online", lastSeen: "2 min ago", lastMessage: "Meeting at 3pm?", unread: 3, phone: "+1 (555) 222-3333", email: "alice@example.com" },
    { id: 3, name: "Mike Johnson", avatarIcon: "user-ninja", status: "away", lastSeen: "30 min", lastMessage: "Project files", unread: 0, phone: "+1 (555) 333-4444", email: "mike@example.com" },
    { id: 4, name: "Sarah Brown", avatarIcon: "user-astronaut", status: "offline", lastSeen: "2 hours", lastMessage: "Thanks!", unread: 1, phone: "+1 (555) 444-5555", email: "sarah@example.com" }
  ];

  const chatMessages = {
    1: [{ id: 1, type: "text", content: "Hey! How are you?", incoming: true, time: "10:30 AM" }],
    2: [{ id: 1, type: "text", content: "Hi Alice!", incoming: false, time: "9:15 AM" }]
  };

  // DOM elements
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
    searchInput: document.getElementById('searchInput'),
    onlineCount: document.getElementById('onlineCount'),
    photoInput: document.getElementById('photoInput'),
    fileInput: document.getElementById('fileInput'),

    // Call modal elements
    callModal: document.getElementById('callModal'),
    callUserName: document.getElementById('callUserName'),
    callUserAvatar: document.getElementById('callUserAvatar'),
    callStatus: document.getElementById('callStatus'),
    localVideo: document.getElementById('localVideo'),
    remoteVideo: document.getElementById('remoteVideo'),
    callMuteBtn: document.getElementById('callMuteBtn'),
    callVideoBtn: document.getElementById('callVideoBtn'),
    callSpeakerBtn: document.getElementById('callSpeakerBtn'),
    cameraSwitchBtn: document.getElementById('cameraSwitchBtn'),
    screenShareBtn: document.getElementById('screenShareBtn'),
    callTimer: document.getElementById('callTimer'),

    // Profile modal
    profileModal: document.getElementById('profileModal'),
    profileName: document.getElementById('profileName'),
    profileStatus: document.getElementById('profileStatus'),
    profileAvatar: document.getElementById('profileAvatar'),
    notificationMuteToggle: document.getElementById('notificationMuteToggle'),
    darkModeToggle: document.getElementById('darkModeToggle'),
    notificationIcon: document.getElementById('notificationIcon'),
    muteText: document.getElementById('muteText'),

    // Device selects
    audioInputSelect: document.getElementById('audioInputSelect'),
    videoInputSelect: document.getElementById('videoInputSelect'),
    audioOutputSelect: document.getElementById('audioOutputSelect')
  };

  // ==================== INITIALIZATION ====================
  function init() {
    loadOnlineUsers();
    loadConversations();
    setupTheme();
    setupEventListeners();
    enumerateDevices();
    updateNotificationMuteUI();
  }

  function setupTheme() {
    if (isDark) {
      els.body.setAttribute('data-theme', 'dark');
      els.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      if (els.darkModeToggle) els.darkModeToggle.classList.add('active');
    }
  }

  function setupEventListeners() {
    els.themeToggle.addEventListener('click', toggleTheme);
    els.messageInput.addEventListener('input', () => {
      els.sendButton.disabled = !els.messageInput.value.trim();
    });
    els.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && els.messageInput.value.trim()) sendMessage();
    });
    els.searchInput.addEventListener('input', filterConversations);

    els.photoInput.addEventListener('change', (e) => handleFileSelect(e.target, 'photo'));
    els.fileInput.addEventListener('change', (e) => handleFileSelect(e.target, 'file'));

    window.addEventListener('resize', () => {
      isMobile = window.innerWidth < 768;
      if (!isMobile) closeSidebar();
    });
  }

  // ==================== NOTIFICATION MUTE FUNCTIONALITY ====================
  function toggleNotificationMute() {
    isNotificationMuted = !isNotificationMuted;
    localStorage.setItem('notificationMute', isNotificationMuted);
    updateNotificationMuteUI();

    // Show feedback
    const message = isNotificationMuted ? '🔇 Notifications muted' : '🔔 Notifications unmuted';
    showToast(message);
  }

  function updateNotificationMuteUI() {
    if (els.notificationMuteToggle) {
      els.notificationMuteToggle.classList.toggle('active', isNotificationMuted);
    }
    if (els.notificationIcon) {
      els.notificationIcon.className = isNotificationMuted ? 'fas fa-bell-slash' : 'fas fa-bell';
    }
    if (els.muteText) {
      els.muteText.innerText = isNotificationMuted ? 'Unmute notifications' : 'Mute notifications';
    }
  }

  // ==================== CALL MUTE FUNCTIONALITY ====================
  function toggleCallMute() {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        isCallMuted = !isCallMuted;
        audioTracks.forEach(track => track.enabled = !isCallMuted);

        // Update button UI
        const icon = els.callMuteBtn.querySelector('i');
        if (isCallMuted) {
          icon.className = 'fas fa-microphone-slash';
          els.callMuteBtn.classList.add('muted');
          els.callMuteBtn.title = 'Unmute microphone';
          showToast('🎤 Microphone muted');
        } else {
          icon.className = 'fas fa-microphone';
          els.callMuteBtn.classList.remove('muted');
          els.callMuteBtn.title = 'Mute microphone';
          showToast('🎤 Microphone unmuted');
        }
      }
    }
  }

  function toggleCallVideo() {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        isVideoEnabled = !isVideoEnabled;
        videoTracks.forEach(track => track.enabled = isVideoEnabled);

        const icon = els.callVideoBtn.querySelector('i');
        if (!isVideoEnabled) {
          icon.className = 'fas fa-video-slash';
          els.callVideoBtn.classList.add('muted');
          els.callVideoBtn.title = 'Turn on camera';
        } else {
          icon.className = 'fas fa-video';
          els.callVideoBtn.classList.remove('muted');
          els.callVideoBtn.title = 'Turn off camera';
        }
      }
    }
  }

  function toggleCallSpeaker() {
    isSpeakerMuted = !isSpeakerMuted;

    // Update button UI
    const icon = els.callSpeakerBtn.querySelector('i');
    if (isSpeakerMuted) {
      icon.className = 'fas fa-volume-mute';
      els.callSpeakerBtn.classList.add('muted');
      els.callSpeakerBtn.title = 'Unmute speaker';
    } else {
      icon.className = 'fas fa-volume-up';
      els.callSpeakerBtn.classList.remove('muted');
      els.callSpeakerBtn.title = 'Mute speaker';
    }
  }

  // ==================== USER & CONVERSATIONS ====================
  function loadOnlineUsers() {
    const online = users.filter(u => u.status === 'online');
    els.onlineCount.innerText = online.length;
    els.onlineUsers.innerHTML = '';
    online.forEach(u => {
      const div = document.createElement('div');
      div.className = 'flex flex-col items-center cursor-pointer transform hover:scale-110 transition';
      div.onclick = () => selectChat(u.id);
      div.innerHTML = `
            <div class="relative">
              <div class="avatar avatar-sm"><i class="fas fa-${u.avatarIcon}"></i></div>
              <span class="status-badge online"></span>
            </div>
            <span class="text-xs font-semibold mt-1 max-w-[60px] truncate">${u.name.split(' ')[0]}</span>
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
      div.innerHTML = `
            <div class="relative">
              <div class="avatar avatar-sm"><i class="fas fa-${u.avatarIcon}"></i></div>
              <span class="status-badge ${u.status}"></span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between">
                <span class="font-bold truncate">${u.name}</span>
                <span class="text-xs opacity-70">${u.lastSeen}</span>
              </div>
              <p class="text-sm opacity-70 truncate">${u.lastMessage}</p>
            </div>
            ${u.unread ? '<span class="bg-primary text-white text-xs rounded-full px-2 py-1">' + u.unread + '</span>' : ''}
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
    els.currentUserStatusText.innerText = currentUser.status === 'online' ? 'Online' : `Last seen ${currentUser.lastSeen}`;

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
    msgs.forEach(m => {
      const row = createMessageElement(m);
      els.chatMessages.appendChild(row);
    });
    els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight;
  }

  function createMessageElement(m) {
    const row = document.createElement('div');
    row.className = `flex ${m.incoming ? '' : 'justify-end'} mb-4`;
    const bubble = document.createElement('div');
    bubble.className = `max-w-[70%] p-3 rounded-2xl ${m.incoming ? 'bg-surface' : 'bg-primary text-white'}`;
    bubble.innerHTML = `${m.content}<div class="text-xs opacity-70 mt-1">${m.time}</div>`;
    row.appendChild(bubble);
    return row;
  }

  function updateActive() {
    document.querySelectorAll('.conv-item').forEach(el => {
      const uid = el.getAttribute('data-userid');
      el.classList.toggle('active', Number(uid) === currentChatId);
    });
  }

  function filterConversations(e) {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('.conv-item').forEach((item, idx) => {
      const user = users[idx];
      if (user) {
        const matches = user.name.toLowerCase().includes(term) ||
          user.lastMessage.toLowerCase().includes(term);
        item.style.display = matches || !term ? 'flex' : 'none';
      }
    });
  }

  function sendMessage() {
    if (!currentChatId || !els.messageInput.value.trim()) return;
    const text = els.messageInput.value.trim();
    const newMsg = { id: Date.now(), content: text, incoming: false, time: new Date().toLocaleTimeString() };

    const row = createMessageElement(newMsg);
    els.chatMessages.appendChild(row);
    els.messageInput.value = '';
    els.sendButton.disabled = true;
    els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight;

    // Simulate reply with notification check
    setTimeout(() => {
      const reply = { id: Date.now(), content: 'Got it! 👍', incoming: true, time: new Date().toLocaleTimeString() };
      els.chatMessages.appendChild(createMessageElement(reply));
      els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight;

      // Only show notification if not muted
      if (!isNotificationMuted) {
        showToast(`💬 New message from ${currentUser.name}`);
      }
    }, 1000);
  }

  // ==================== AUDIO/VIDEO CALL FUNCTIONS ====================
  async function startAudioCall() {
    if (!currentUser) {
      alert('Please select a chat first');
      return;
    }

    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      currentCallType = 'audio';
      showCallModal('audio');
      setupLocalStream();
    } catch (err) {
      alert('Microphone access denied. Please check permissions.');
      console.error(err);
    }
  }

  async function startVideoCall() {
    if (!currentUser) {
      alert('Please select a chat first');
      return;
    }

    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      currentCallType = 'video';
      showCallModal('video');
      setupLocalStream();
    } catch (err) {
      alert('Camera/microphone access denied. Please check permissions.');
      console.error(err);
    }
  }

  function showCallModal(type) {
    els.callUserName.innerText = currentUser.name;
    els.callUserAvatar.innerHTML = `<i class="fas fa-${currentUser.avatarIcon}"></i>`;
    els.callStatus.innerText = type === 'video' ? 'Video call connecting...' : 'Audio call connecting...';

    // Show/hide video elements
    document.getElementById('localVideoContainer').style.display = type === 'video' ? 'block' : 'none';
    document.getElementById('remoteVideoContainer').style.display = type === 'video' ? 'block' : 'none';

    // Reset mute states
    isCallMuted = false;
    isVideoEnabled = true;
    isSpeakerMuted = false;

    // Reset button icons
    updateCallButtonIcons();

    els.callModal.classList.add('active');
    startCallTimer();

    // Simulate remote connection
    setTimeout(() => {
      els.callStatus.innerText = 'Connected';
      if (type === 'video') {
        simulateRemoteVideo();
      }
    }, 2000);
  }

  function updateCallButtonIcons() {
    // Reset mute button
    const muteIcon = els.callMuteBtn.querySelector('i');
    muteIcon.className = 'fas fa-microphone';
    els.callMuteBtn.classList.remove('muted');

    // Reset video button
    const videoIcon = els.callVideoBtn.querySelector('i');
    videoIcon.className = 'fas fa-video';
    els.callVideoBtn.classList.remove('muted');

    // Reset speaker button
    const speakerIcon = els.callSpeakerBtn.querySelector('i');
    speakerIcon.className = 'fas fa-volume-up';
    els.callSpeakerBtn.classList.remove('muted');
  }

  function setupLocalStream() {
    if (els.localVideo && localStream) {
      els.localVideo.srcObject = localStream;
    }
  }

  function simulateRemoteVideo() {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    const remoteStream = canvas.captureStream(30);

    function drawFrame() {
      ctx.fillStyle = '#2a2f40';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(320, 240, 100, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.font = 'bold 80px "Inter"';
      ctx.fillText(currentUser.name.charAt(0), 280, 280);
      requestAnimationFrame(drawFrame);
    }
    drawFrame();

    if (els.remoteVideo) {
      els.remoteVideo.srcObject = remoteStream;
    }
  }

  async function toggleCamera() {
    if (!localStream || currentCallType !== 'video') return;

    try {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const currentFacingMode = videoTracks[0].getSettings().facingMode;
        const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

        const constraints = {
          video: { facingMode: newFacingMode }
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        const newVideoTrack = newStream.getVideoTracks()[0];

        videoTracks[0].stop();
        localStream.removeTrack(videoTracks[0]);
        localStream.addTrack(newVideoTrack);

        els.localVideo.srcObject = localStream;
        showToast('📷 Camera switched');
      }
    } catch (err) {
      console.error('Camera switch failed', err);
      showToast('❌ Camera switch failed');
    }
  }

  async function shareScreen() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });

      if (localStream) {
        const videoTrack = screenStream.getVideoTracks()[0];
        const oldTrack = localStream.getVideoTracks()[0];

        if (oldTrack) {
          localStream.removeTrack(oldTrack);
          oldTrack.stop();
        }

        localStream.addTrack(videoTrack);
        els.localVideo.srcObject = localStream;

        videoTrack.onended = () => {
          // Restore camera when screen share ends
          if (currentCallType === 'video') {
            startVideoCall();
          }
        };

        showToast('🖥️ Screen sharing started');
      }
    } catch (err) {
      console.error('Screen share failed', err);
      showToast('❌ Screen share failed');
    }
  }

  function endCall() {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }

    if (els.localVideo) els.localVideo.srcObject = null;
    if (els.remoteVideo) els.remoteVideo.srcObject = null;

    els.callModal.classList.remove('active');
    stopCallTimer();
    currentCallType = null;
    showToast('📞 Call ended');
  }

  function minimizeCall() {
    els.callModal.classList.remove('active');
    showToast('📱 Call minimized');
  }

  // Call timer
  function startCallTimer() {
    callSeconds = 0;
    updateCallTimer();
    callTimer = setInterval(updateCallTimer, 1000);
  }

  function updateCallTimer() {
    callSeconds++;
    const mins = Math.floor(callSeconds / 60);
    const secs = callSeconds % 60;
    els.callTimer.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function stopCallTimer() {
    if (callTimer) {
      clearInterval(callTimer);
      callTimer = null;
    }
  }

  // ==================== DEVICE ENUMERATION ====================
  async function enumerateDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      els.audioInputSelect.innerHTML = audioInputs.map(d =>
        `<option value="${d.deviceId}">${d.label || 'Microphone'}</option>`
      ).join('');

      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      els.videoInputSelect.innerHTML = videoInputs.map(d =>
        `<option value="${d.deviceId}">${d.label || 'Camera'}</option>`
      ).join('');

      const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
      els.audioOutputSelect.innerHTML = audioOutputs.map(d =>
        `<option value="${d.deviceId}">${d.label || 'Speaker'}</option>`
      ).join('');
    } catch (err) {
      console.error('Device enumeration failed', err);
    }
  }

  // ==================== PROFILE FUNCTIONS ====================
  function showProfile() {
    els.profileName.innerText = 'Alex Morgan';
    els.profileStatus.innerText = 'Online';
    els.profileAvatar.innerHTML = '<i class="fas fa-user"></i>';
    els.profileModal.classList.add('active');
  }

  function closeProfile() {
    els.profileModal.classList.remove('active');
  }

  function toggleDarkMode() {
    isDark = !isDark;
    els.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    els.themeToggle.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    els.darkModeToggle.classList.toggle('active', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    showToast(isDark ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
  }

  function logout() {
    if (confirm('Logout from WaveChat?')) {
      closeProfile();
      showToast('👋 Logged out successfully');
    }
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-surface text-white px-6 py-3 rounded-full shadow-lg z-50 animate-bounce';
    toast.style.background = 'var(--primary-gradient)';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ==================== UTILITIES ====================
  function toggleSidebar() {
    els.sidebar.classList.toggle('active');
    els.overlay.classList.toggle('active');
  }

  function closeSidebar() {
    els.sidebar.classList.remove('active');
    els.overlay.classList.remove('active');
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
    // Implement chat menu if needed
    showToast('Menu clicked');
  }

  function handleFileSelect(input, type) {
    const files = input.files;
    if (!files || files.length === 0 || !currentChatId) return;

    Array.from(files).forEach(file => {
      const newMsg = {
        id: Date.now() + Math.random(),
        content: `📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        incoming: false,
        time: new Date().toLocaleTimeString()
      };
      els.chatMessages.appendChild(createMessageElement(newMsg));
    });

    els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight;
    input.value = '';
    showToast(`📎 ${files.length} file(s) uploaded`);
  }

  window.handlePhotoUpload = () => {
    els.attachmentMenu.classList.add('hidden');
    els.photoInput.click();
  };

  window.handleFileUpload = () => {
    els.attachmentMenu.classList.add('hidden');
    els.fileInput.click();
  };

  // Expose functions globally
  window.selectChat = selectChat;
  window.toggleSidebar = toggleSidebar;
  window.closeSidebar = closeSidebar;
  window.newChat = () => showToast('✨ New chat feature coming soon');
  window.showSettings = showProfile;
  window.startAudioCall = startAudioCall;
  window.startVideoCall = startVideoCall;
  window.toggleChatMenu = toggleChatMenu;
  window.toggleAttachmentMenu = toggleAttachmentMenu;
  window.viewProfile = showProfile;
  window.muteChat = toggleNotificationMute;
  window.clearChat = () => {
    if (confirm('Clear all messages?')) {
      els.chatMessages.innerHTML = '';
      showToast('🗑️ Chat cleared');
    }
  };
  window.exportChat = () => showToast('📥 Exporting chat...');
  window.sendMessage = sendMessage;
  window.showProfile = showProfile;
  window.closeProfile = closeProfile;
  window.toggleNotificationMute = toggleNotificationMute;
  window.toggleDarkMode = toggleDarkMode;
  window.logout = logout;
  window.toggleCallMute = toggleCallMute;
  window.toggleCallVideo = toggleCallVideo;
  window.toggleCallSpeaker = toggleCallSpeaker;
  window.toggleCamera = toggleCamera;
  window.shareScreen = shareScreen;
  window.endCall = endCall;
  window.minimizeCall = minimizeCall;

  // Initialize
  init();
})();
