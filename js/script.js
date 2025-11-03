document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const chatMessages = document.getElementById("chat-messages");
  const messageForm = document.getElementById("send-message");
  const messageInput = document.getElementById("message-text");
  const backButton = document.getElementById("back-button");
  const menuButton = document.getElementById("menu-button");
  const contactsSidebar = document.getElementById("contacts-sidebar");
  const contactItems = document.querySelectorAll(".contact-item");
  const overlay = document.getElementById("overlay");
  const activeContact = document.querySelector(".active-contact");

  // Video elements
  const sampleVideo = document.getElementById("sample-video");
  const playPauseBtn = document.getElementById("play-pause-btn");
  const progressBar = document.getElementById("progress-bar");
  const muteBtn = document.getElementById("mute-btn");

  // Menu elements
  const menuBtn = document.getElementById("menu-btn");
  const menuDropdown = document.getElementById("menu-dropdown");
  const viewProfile = document.getElementById("view-profile");
  const muteNotifications = document.getElementById("mute-notifications");
  const clearChat = document.getElementById("clear-chat");
  const blockContact = document.getElementById("block-contact");
  const exportChat = document.getElementById("export-chat");

  // Call and video buttons
  const callBtn = document.getElementById("call-btn");
  const videoBtn = document.getElementById("video-btn");

  // Attachment buttons
  const attachBtn = document.getElementById("attach-btn");
  const cameraBtn = document.getElementById("camera-btn");

  // Sample data for demonstration
  const sampleMessages = [
    {
      text: "That was in the mountains near Aspen!",
      incoming: true,
      time: "10:38 AM",
    },
    {
      text: "I'm planning to go back next month",
      incoming: true,
      time: "10:39 AM",
    },
    {
      text: "Sounds like a great plan! Maybe I can join you?",
      incoming: false,
      time: "10:40 AM",
    },
    {
      text: "That would be awesome! Let me know your dates.",
      incoming: true,
      time: "10:41 AM",
    },
  ];

  // Initialize the chat
  initChat();

  // Event Listeners
  messageForm.addEventListener("submit", sendMessage);
  backButton.addEventListener("click", toggleSidebar);
  menuButton.addEventListener("click", toggleSidebar);
  overlay.addEventListener("click", closeSidebar);

  // Video controls
  if (sampleVideo) {
    sampleVideo.addEventListener("timeupdate", updateProgressBar);
    sampleVideo.addEventListener("play", updatePlayButton);
    sampleVideo.addEventListener("pause", updatePlayButton);
    playPauseBtn.addEventListener("click", togglePlayPause);
    progressBar.addEventListener("input", seekVideo);
    muteBtn.addEventListener("click", toggleMute);
  }

  // Menu controls
  menuBtn.addEventListener("click", toggleMenu);
  viewProfile.addEventListener("click", () => {
    alert("View Profile clicked!");
    closeMenu();
  });
  muteNotifications.addEventListener("click", () => {
    alert("Notifications muted!");
    closeMenu();
  });
  clearChat.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear this chat?")) {
      alert("Chat cleared!");
    }
    closeMenu();
  });
  blockContact.addEventListener("click", () => {
    if (confirm("Are you sure you want to block this contact?")) {
      alert("Contact blocked!");
    }
    closeMenu();
  });
  exportChat.addEventListener("click", () => {
    alert("Chat exported!");
    closeMenu();
  });

  // Call and video buttons
  callBtn.addEventListener("click", () => {
    alert("Starting audio call...");
  });

  videoBtn.addEventListener("click", () => {
    alert("Starting video call...");
  });

  // Attachment buttons
  attachBtn.addEventListener("click", () => {
    alert("Attachment menu opened!");
  });

  cameraBtn.addEventListener("click", () => {
    alert("Camera opened!");
  });

  // Add click event to contact items
  contactItems.forEach((contact) => {
    contact.addEventListener("click", function () {
      if (window.innerWidth < 768) {
        closeSidebar();
      }
      // In a real app, you would load the chat for this contact
      // For demo, just update active contact
      contactItems.forEach((c) => c.classList.remove("active-contact"));
      this.classList.add("active-contact");
    });
  });

  // Functions
  function initChat() {
    // Add sample messages after a delay to simulate chat history
    setTimeout(() => {
      sampleMessages.forEach((msg, index) => {
        setTimeout(() => {
          addMessage(msg.text, msg.incoming, msg.time);
          scrollToBottom();
        }, index * 300);
      });
    }, 1000);
  }

  function sendMessage(e) {
    e.preventDefault();

    const message = messageInput.value.trim();
    if (message === "") return;

    // Add outgoing message
    addMessage(message, false, getCurrentTime());
    scrollToBottom();

    // Clear input
    messageInput.value = "";

    // Simulate reply after a delay
    setTimeout(() => {
      addMessage(
        "Thanks for your message! I'll get back to you soon.",
        true,
        getCurrentTime()
      );
      scrollToBottom();

      // Show typing indicator
      const typingIndicator = document.createElement("div");
      typingIndicator.className = "flex mb-4 typing-indicator";
      typingIndicator.innerHTML = `
                            <div class="flex-shrink-0 mr-3">
                                <div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm">JD</div>
                            </div>
                            <div class="incoming-message px-4 py-2">
                                <div class="flex space-x-1">
                                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.3s"></div>
                                </div>
                            </div>
                        `;
      chatMessages.appendChild(typingIndicator);
      scrollToBottom();

      // Remove typing indicator after delay and add another message
      setTimeout(() => {
        chatMessages.removeChild(typingIndicator);
        addMessage(
          "By the way, did you see the new updates to the project?",
          true,
          getCurrentTime()
        );
        scrollToBottom();
      }, 2000);
    }, 1000);
  }

  function addMessage(text, incoming, time) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `flex mb-4 ${incoming ? "" : "justify-end"} message`;

    if (incoming) {
      messageDiv.innerHTML = `
                            <div class="flex-shrink-0 mr-3">
                                <div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm">JD</div>
                            </div>
                            <div class="flex flex-col items-start">
                                <div class="incoming-message px-4 py-2 max-w-xs">
                                    ${text}
                                </div>
                                <span class="text-xs text-gray-500 mt-1">${time}</span>
                            </div>
                        `;
    } else {
      messageDiv.innerHTML = `
                            <div class="flex flex-col items-end">
                                <div class="outgoing-message px-4 py-2 max-w-xs">
                                    ${text}
                                </div>
                                <span class="text-xs text-gray-500 mt-1">${time} <i class="fas fa-check-double ml-1 text-indigo-400"></i></span>
                            </div>
                        `;
    }

    chatMessages.appendChild(messageDiv);
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function getCurrentTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
  }

  function toggleSidebar() {
    if (window.innerWidth < 768) {
      if (contactsSidebar.classList.contains("mobile-active")) {
        closeSidebar();
      } else {
        openSidebar();
      }
    }
  }

  function openSidebar() {
    contactsSidebar.classList.remove("mobile-inactive");
    contactsSidebar.classList.add("mobile-active");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    contactsSidebar.classList.remove("mobile-active");
    contactsSidebar.classList.add("mobile-inactive");
    overlay.classList.remove("active");
    document.body.style.overflow = "auto";

    // Remove animation class after animation completes
    setTimeout(() => {
      contactsSidebar.classList.remove("mobile-inactive");
    }, 300);
  }

  // Video control functions
  function togglePlayPause() {
    if (sampleVideo.paused) {
      sampleVideo.play();
    } else {
      sampleVideo.pause();
    }
  }

  function updatePlayButton() {
    const icon = playPauseBtn.querySelector("i");
    if (sampleVideo.paused) {
      icon.classList.remove("fa-pause");
      icon.classList.add("fa-play");
    } else {
      icon.classList.remove("fa-play");
      icon.classList.add("fa-pause");
    }
  }

  function updateProgressBar() {
    const value = (sampleVideo.currentTime / sampleVideo.duration) * 100;
    progressBar.value = value;
  }

  function seekVideo() {
    const seekTime = (progressBar.value / 100) * sampleVideo.duration;
    sampleVideo.currentTime = seekTime;
  }

  function toggleMute() {
    sampleVideo.muted = !sampleVideo.muted;
    const icon = muteBtn.querySelector("i");
    if (sampleVideo.muted) {
      icon.classList.remove("fa-volume-up");
      icon.classList.add("fa-volume-mute");
    } else {
      icon.classList.remove("fa-volume-mute");
      icon.classList.add("fa-volume-up");
    }
  }

  // Menu functions
  function toggleMenu() {
    menuDropdown.classList.toggle("active");
  }

  function closeMenu() {
    menuDropdown.classList.remove("active");
  }

  // Close menu when clicking outside
  document.addEventListener("click", function (event) {
    if (
      !menuBtn.contains(event.target) &&
      !menuDropdown.contains(event.target)
    ) {
      closeMenu();
    }
  });

  // Handle window resize
  window.addEventListener("resize", function () {
    if (window.innerWidth >= 768) {
      contactsSidebar.classList.remove("mobile-active", "mobile-inactive");
      overlay.classList.remove("active");
      document.body.style.overflow = "auto";
    }
  });
});
