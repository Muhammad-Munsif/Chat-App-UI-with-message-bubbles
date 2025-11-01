
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

        // Add click event to contact items
        contactItems.forEach((contact) => {
          contact.addEventListener("click", function () {
            if (window.innerWidth < 768) {
              closeSidebar();
            }
            // In a real app, you would load the chat for this contact
            // For demo, just update active contact
            contactItems.forEach(c => c.classList.remove("active-contact"));
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

        // Handle window resize
        window.addEventListener("resize", function () {
          if (window.innerWidth >= 768) {
            contactsSidebar.classList.remove("mobile-active", "mobile-inactive");
            overlay.classList.remove("active");
            document.body.style.overflow = "auto";
          }
        });
      });
    