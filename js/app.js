(function () {
  // Zendesk docs:
  // https://developer.zendesk.com/embeddables/docs/widget/core
  // https://developer.zendesk.com/embeddables/docs/widget/chat
  // https://develop.zendesk.com/hc/en-us/articles/360025618474-Quickstart-Web-Widget-JavaScript-APIs

  let zendeskIsLoaded = false;
  let zendeskChatIsActive = false;

  const accentedCharMap = {
    // Examples for commonly used accented characters across various languages
    'á': '𝗮́', 'Á': '𝗔́', 'à': '𝗮̀', 'À': '𝗔̀', 'ä': '𝗮̈', 'Ä': '𝗔̈',
    'å': '𝗮̊', 'Å': '𝗔̊', 'ã': '𝗮̃', 'Ã': '𝗔̃', 'æ': '𝗮𝗲', 'Æ': '𝗔𝗘',
    'ç': '𝗰̧', 'Ç': '𝗖̧', 'é': '𝗲́', 'É': '𝗘́', 'è': '𝗲̀', 'È': '𝗘̀',
    'ë': '𝗲̈', 'Ë': '𝗘̈', 'ê': '𝗲̂', 'Ê': '𝗘̂', 'í': '𝗶́', 'Í': '𝗜́',
    'ì': '𝗶̀', 'Ì': '𝗜̀', 'ï': '𝗶̈', 'Ï': '𝗜̈', 'î': '𝗶̂', 'Î': '𝗜̂',
    'ñ': '𝗻̃', 'Ñ': '𝗡̃', 'ó': '𝗼́', 'Ó': '𝗢́', 'ò': '𝗼̀', 'Ò': '𝗢̀',
    'ö': '𝗼̈', 'Ö': '𝗢̈', 'ô': '𝗼̂', 'Ô': '𝗢̂', 'õ': '𝗼̃', 'Õ': '𝗢̃',
    'ú': '𝘂́', 'Ú': '𝗨́', 'ù': '𝘂̀', 'Ù': '𝗨̀',
    'ü': '𝘂̈', 'Ü': '𝗨̈', 'û': '𝘂̂', 'Û': '𝗨̂',
    // Add more accented characters as needed
  };
  
  function textToBold(text) {
    return text.replace(/[\p{L}\p{N}]/gu, (match) => {
      if (accentedCharMap[match]) {
        return accentedCharMap[match];
      } else {
        const code = match.charCodeAt(0);
        // Handling for basic ASCII letters and numbers
        if (code >= 48 && code <= 57) {  // Numbers 0-9
          return String.fromCodePoint(code + 120734);
        } else if (code >= 65 && code <= 90) {  // Uppercase A-Z
          return String.fromCodePoint(code + 120211);
        } else if (code >= 97 && code <= 122) {  // Lowercase a-z
          return String.fromCodePoint(code + 120205);
        } else {
          // Fallback for characters without a direct mapping or logic
          return match;
        }
      }
    });
  }

  async function formatForm(message) {
    const formData = message.form || null;
    if (!formData) {
      return "";
    }
    const context = await window.kindlyChat.getContext();
    const formFields = formData.fields || [];

    const formValues = formFields
      .map((field) => {
        const value = context[field.slug];
        const label = field.texts.label;
        return `${label}: ${value}`;
      })
      .join("\n");

    const headline = "Submitted form:";
    return headline + "\n" + formValues;
  }

  async function formatChat(messages, hideChatlogHeader) {
    /** Prepare Kindly chat log for Zendesk Chat */
    const firstMessage = messages[0];
    const lastMessage = messages.slice(-1)[0];
    const header =
      "Bot chat history [id: " +
      firstMessage.chat_id +
      "]:\n" +
      "First message: " +
      firstMessage.created.slice(0, -8).replace("T", " ") +
      "\n" +
      "Last message: " +
      lastMessage.created.slice(0, -8).replace("T", " ") +
      "\n" +
      textToBold("Users language: ") +
      firstMessage.chat_language_code +
      "\n";

    const formattedMessages = await Promise.all(
      messages.map(async function (msg) {
        const buttons = (msg.buttons || []).map(function (btn) {
          return '"' + btn.label + '"';
        });
        const formattedButtons = buttons.length ? textToBold("Buttons: ") + "\n" + buttons.join("\n") + "\n" : "";
        const hourAndMinute = textToBold(
          new Date(msg.created).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "europe/oslo",
          })
        );
        const from = msg.from_bot ? "Bot" : "You";
        const formStr = await formatForm(msg); // Wait for formatForm to resolve
        const strippedMessage = msg.message.replace(/(<([^>]+)>)/gi, "");

        return (
          hourAndMinute +
          " " +
          textToBold(from) +
          ":\n" +
          strippedMessage +
          "\n\n" +
          formattedButtons +
          (formStr !== "" ? +"\n\n" + formStr + "\n\n" : "")
        );
      })
    );

    if (hideChatlogHeader) return formattedMessages.join("\n");

    return header + "\n" + formattedMessages.join("\n");
  }

  // Zendesk Chat Widget settings
  // Here we suppress help center, talk and answer bot when kindly chat loaded.
  window.zESettings = {
    webWidget: {
      chat: {
        suppress: false,
        hideWhenOffline: false,
      },
      contactForm: {
        suppress: false,
      },
      helpCenter: {
        suppress: true,
      },
      talk: {
        suppress: true,
      },
      answerBot: {
        suppress: true,
      },
    },
  };

  // Check if manual chat has been started and set state
  const HANDOVER_SCRIPT = document.getElementById("kindly-zendesk-handover") || null;
  const STARTED_MANUAL_CHAT_AT_KEY = "startedManualChatAt";
  const TIMEOUT_MINUTES = HANDOVER_SCRIPT && parseInt(HANDOVER_SCRIPT.getAttribute("data-timeout-minutes")) || 7;

  const startedManualChatAt = localStorage.getItem(STARTED_MANUAL_CHAT_AT_KEY);

  const diffMilliseconds = new Date() - new Date(startedManualChatAt);
  const diffMinutes = diffMilliseconds / 60000; // Minutes in difference

  zendeskChatIsActive = startedManualChatAt && diffMinutes <= TIMEOUT_MINUTES;
  // Check if Kindly should be visible or not
  function onLoad() {
    if (!zendeskChatIsActive) {
      if (startedManualChatAt) {
        localStorage.removeItem(STARTED_MANUAL_CHAT_AT_KEY);
        window.kindlyChat.cancelHandover();
      }
      window.kindlyChat.showBubble();
    } else {
      window.kindlyChat.closeChat();
      window.kindlyChat.hideBubble();
    }
  }

  async function onMessage(newMessage, chatLog) {
    const languageCode = newMessage.chat_language_code;
    const isTakeoverMessageInsideBusinessHours =
      (newMessage.sender === "SYSTEM" &&
        newMessage.system_dialogue_category === "takeover" &&
        newMessage.system_dialogue_message_type === "request") ||
      !!newMessage.handover_request_when_triggered;
    if (!zendeskIsLoaded) {
      if (isTakeoverMessageInsideBusinessHours) {
        // If Zendesk is not loaded at this point, show an error message in chat.
        window.kindlyChat.cancelHandover();
        window.kindlyChat.triggerDialogue("zendesk_chat_not_loaded_" + languageCode);
      }
      return;
    }

    const displayState = zE("webWidget:get", "display");
    if (!isTakeoverMessageInsideBusinessHours || displayState == "chat") {
      // Dont open zendesk chat if either
      // A: outside business hours
      // B: Zendesk chat is already open
      return;
    }

    const handoverScript = document.getElementById("kindly-zendesk-handover");
    const department = handoverScript && handoverScript.dataset.department;

    if (department) {
      const departmentStatus = zE("webWidget:get", "chat:department", department);

      if (departmentStatus && departmentStatus.status !== "online") {
        window.kindlyChat.triggerDialogue("zendesk_handover_closed_" + languageCode);
        return;
      }
    }

    // Close Kindly Chat, open Zendesk Chat
    window.kindlyChat.closeChat();
    window.kindlyChat.hideBubble();
    localStorage.setItem(STARTED_MANUAL_CHAT_AT_KEY, new Date().toISOString());
    zendeskChatIsActive = true;

    zE("webWidget", "show");
    zE("webWidget", "open");

    const hideChatlogHeader = handoverScript && handoverScript.dataset.hideChatlogHeader;
    const chatLogFormatted = await formatChat(chatLog, hideChatlogHeader);
    zE("webWidget", "chat:send", chatLogFormatted);
  }

  // Check every 25 millisecond until Zendesk is loaded
  function whenZendeskAvailable(name, callback) {
    const timer = setInterval(checkZendeskAvailability, 25);

    // Don't run the interval forever
    setTimeout(function () {
      clearInterval(timer);
    }, 30000);

    function checkZendeskAvailability() {
      if (window[name]) {
        clearInterval(timer);
        zendeskIsLoaded = true;
        callback(window[name]);
      }
    }
  }

  whenZendeskAvailable("zE", () => {
    function toggleZendesk() {
      // Check if Zendesk should be visible or not
      if (!zendeskChatIsActive) {
        zE("webWidget", "hide");
        return;
      }

      // If the agent ends the chat, make sure the bubble is visible
      const displayState = zE("webWidget:get", "display");
      if (displayState === "hidden") {
        zendeskChatIsActive = false;
        return;
      }
    }
    toggleZendesk();

    // Hide Zendesk Chat widget and shows bot again
    // attach handler after Zendesk Chat widget has connected
    zE("webWidget:on", "chat:end", function () {
      // Delete manual chat start timestamp
      localStorage.removeItem(STARTED_MANUAL_CHAT_AT_KEY);
      // if agent or user ends chat, imediately show the bot again
      zendeskChatIsActive = false;
      zE("webWidget", "hide");
      window.kindlyChat.showBubble();
      window.kindlyChat.cancelHandover();
    });
  });

  document.addEventListener("kindly:load", (event) => {
    onLoad();
  });

  document.addEventListener("kindly:message", (event) => {
    onMessage(event.detail.newMessage, event.detail.chatLog);
  });
})();
