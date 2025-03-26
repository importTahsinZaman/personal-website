import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import styles from "../styles/Home.module.css";
import themes from "../public/themes.json";

//TO Test:
// npm run dev
//TO DEPLOY:
// npm run build
// firebase deploy

interface ThemeColors {
  "bg-color": string;
  "container-bg": string;
  "font-color": string;
  "primary-color": string;
  "secondary-color": string;
  "accent-color": string;
  "terminal-shadow": string;
}

interface Theme {
  name: string;
  colors: ThemeColors;
}

// Component to maintain focus on the input field
const AutoFocus = ({
  inputRef,
  isMobile,
}: {
  inputRef: React.RefObject<HTMLInputElement>;
  isMobile: boolean;
}) => {
  useEffect(() => {
    // Focus the input when the component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // For non-mobile: Set up an interval to check focus and restore it if lost
    let interval: NodeJS.Timeout | null = null;

    if (!isMobile) {
      interval = setInterval(() => {
        if (document.activeElement !== inputRef.current && inputRef.current) {
          inputRef.current.focus();
        }
      }, 500);
    }

    // Add click listener to refocus (but be less aggressive on mobile)
    const handleClick = () => {
      if (
        inputRef.current &&
        (!isMobile || (isMobile && Math.random() > 0.5))
      ) {
        inputRef.current.focus();
      }
    };

    document.addEventListener("click", handleClick);

    // Clean up
    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener("click", handleClick);
    };
  }, [inputRef, isMobile]);

  return null;
};

export default function Home() {
  const terminal = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [currentTheme, setCurrentTheme] = useState<string>("NeonNight");
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [caretPosition, setCaretPosition] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isPortrait, setIsPortrait] = useState<boolean>(true);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);

    // Detect if device is mobile and orientation
    const checkMobileAndOrientation = () => {
      setIsMobile(
        window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent)
      );
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkMobileAndOrientation();

    // Focus input on load
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // First display the banner (on initial load)
    displayBanner(true);

    // Then force scroll to bottom to ensure the input is visible
    setTimeout(() => {
      forceScrollToBottom();
    }, 100);

    // Apply theme from themes.json
    applyTheme(currentTheme);

    // Add resize and orientation change listeners
    const handleResize = () => {
      checkMobileAndOrientation();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    // Detect keyboard opening on mobile (approximate)
    const handleVisualViewportResize = () => {
      if (isMobile && window.visualViewport) {
        // If the viewport height is significantly less than the window height,
        // we can assume the keyboard is open
        const keyboardThreshold = window.innerHeight * 0.75;
        setIsKeyboardOpen(window.visualViewport.height < keyboardThreshold);
      }
    };

    // Add visualViewport listener for keyboard detection
    if (typeof window !== "undefined" && window.visualViewport) {
      window.visualViewport.addEventListener(
        "resize",
        handleVisualViewportResize
      );
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      if (typeof window !== "undefined" && window.visualViewport) {
        window.visualViewport.removeEventListener(
          "resize",
          handleVisualViewportResize
        );
      }
    };
  }, [isMobile]);

  const applyTheme = (themeName: string) => {
    const theme = themes.themes.find((t: Theme) => t.name === themeName);
    if (theme) {
      Object.entries(theme.colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--${key}`, value);
      });
      setCurrentTheme(themeName);
    }
  };

  const executeCommand = (command: string) => {
    // Don't execute empty commands
    if (!command.trim()) return;

    // Add to command history
    setCommandHistory((prev) => [...prev, command]);
    setHistoryIndex(-1);

    // Show the command in the terminal
    if (terminal.current) {
      let terminal_state = terminal.current.innerHTML;
      terminal_state += renderCommandLine(command);
      terminal.current.innerHTML = terminal_state;
      forceScrollToBottom();
    }

    // Process command
    const lowerCommand = command.trim().toLowerCase();

    switch (lowerCommand) {
      case "help":
        displayHelpMessage();
        break;
      case "clear":
        clearTerminal();
        break;
      case "banner":
        displayBanner(false);
        break;
      case "about":
        displayAboutMessage();
        break;
      case "linkedin":
        window.open(
          "https://www.linkedin.com/in/tahsin-zaman-98761223a/",
          "_blank",
          "noopener,noreferrer"
        );
        addOutput("Opening LinkedIn profile...");
        break;
      case "github":
        window.open(
          "https://github.com/importTahsinZaman",
          "_blank",
          "noopener,noreferrer"
        );
        addOutput("Opening GitHub profile...");
        break;
      case "email":
        displayEmail();
        break;
      case "themes":
        displayThemes();
        break;
      default:
        if (lowerCommand.startsWith("theme ")) {
          const themeName = command.split(" ")[1];
          const foundTheme = themes.themes.find(
            (t: Theme) => t.name.toLowerCase() === themeName.toLowerCase()
          );
          if (foundTheme) {
            applyTheme(foundTheme.name);
            addOutput(`Theme set to ${themeName}`);
          } else {
            addOutput(
              `Theme "${themeName}" not found. Use "themes" to see available themes.`
            );
          }
        } else {
          displayErrorMessage(command);
        }
        break;
    }

    // After processing any command, make sure to scroll
    forceScrollToBottom();
  };

  const addOutput = (content: string) => {
    if (terminal.current) {
      terminal.current.innerHTML += `<div class="${styles.commandResult}">${content}</div>`;
      forceScrollToBottom();
    }
  };

  const displayHelpMessage = () => {
    addOutput(`<div style="margin: 0; padding: 0"><p style="margin: 0; padding: 0;"><strong>Available commands:</strong></p><table class="${styles.infoTable}" style="margin-top: 0;">
    <tr><td>about</td><td>Learn about me</td></tr>
    <tr><td>banner</td><td>Display the welcome banner</td></tr>
    <tr><td>clear</td><td>Clear the terminal</td></tr>
    <tr><td>email</td><td>Show my email address</td></tr>
    <tr><td>github</td><td>Open my GitHub profile</td></tr>
    <tr><td>help</td><td>Show this help message</td></tr>
    <tr><td>linkedin</td><td>Open my LinkedIn profile</td></tr>
    <tr><td>themes</td><td>List available color themes</td></tr>
    <tr><td>theme [name]</td><td>Switch to a different color theme</td></tr>
  </table></div>`);
  };

  const clearTerminal = () => {
    if (terminal.current) {
      terminal.current.innerHTML = "";
    }
  };

  const displayEmail = () => {
    addOutput(`
<div style="margin: 0">
  <p>📧 Email: <a href="mailto:tahsinz21366@gmail.com">tahsinz21366@gmail.com</a></p>
</div>
    `);
  };

  const displayAboutMessage = () => {
    addOutput(`<div style="margin-top: -14px;">
  <p>hi, i'm <strong>tahsin zaman</strong> – a passionate developer and tech enthusiast.</p>
  <p style="margin-top: 4px">i'm currently building the ai workspace for devops over at <a href="https://a37.ai/" target="_blank" rel="noopener noreferrer">a37.ai</a></p>
</div>`);
  };

  const displayThemes = () => {
    let themeButtons = "";

    themes.themes.forEach((theme: Theme) => {
      themeButtons += `<span class="${
        styles.themeToggle
      }" onclick="document.dispatchEvent(new CustomEvent('changeTheme', { detail: '${
        theme.name
      }' }))" style="background-color: ${
        theme.colors["primary-color"]
      }; display: inline-block; width: 14px; height: 14px; margin-right: 6px; border-radius: 50%; cursor: pointer; border: 2px solid ${
        theme.name === currentTheme ? "white" : "transparent"
      }"></span>`;
    });

    addOutput(`<div style="margin-top: -5px; line-height: 0.5;">
  <p style="margin: 0; padding: 0;"><strong>Available themes:</strong></p>
  <p style="margin: -3px 0 0 0; padding: 0;">Current theme: <span style="color: var(--primary-color)">${currentTheme}</span></p>
  <div style="margin-top: -9px; padding: 0;">
    ${themes.themes
      .map(
        (theme: Theme) =>
          `<div style="margin: -1px 0; padding: 0;"><code>theme ${theme.name}</code> - ${theme.name}</div>`
      )
      .join("")}
  </div>
  <p style="margin: -2px 0 0 0;">Click to preview: ${themeButtons}</p>
</div>`);

    // Add theme change event listener
    document.addEventListener("changeTheme", ((e: Event) => {
      const customEvent = e as CustomEvent<string>;
      applyTheme(customEvent.detail);
    }) as EventListener);
  };

  const scrollToBottom = (delay = 0) => {
    if (delay === 0) {
      if (terminal.current) {
        terminal.current.scrollTop = terminal.current.scrollHeight;
      }
    } else {
      setTimeout(() => {
        if (terminal.current) {
          terminal.current.scrollTop = terminal.current.scrollHeight;
        }
      }, delay);
    }
  };

  const displayBanner = (isInitialLoad = false) => {
    const bannerContent = `
<div style="max-width: 100%; overflow-x: auto;">
<pre class="${styles.asciiArt}">
████████╗ █████╗ ██╗  ██╗███████╗██╗███╗   ██╗
╚══██╔══╝██╔══██╗██║  ██║██╔════╝██║████╗  ██║
   ██║   ███████║███████║███████╗██║██╔██╗ ██║
   ██║   ██╔══██║██╔══██║╚════██║██║██║╚██╗██║
   ██║   ██║  ██║██║  ██║███████║██║██║ ╚████║
   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝╚═╝  ╚═══╝
                               
███████╗ █████╗ ███╗   ███╗ █████╗ ███╗   ██╗
╚══███╔╝██╔══██╗████╗ ████║██╔══██╗████╗  ██║
  ███╔╝ ███████║██╔████╔██║███████║██╔██╗ ██║
 ███╔╝  ██╔══██║██║╚██╔╝██║██╔══██║██║╚██╗██║
███████╗██║  ██║██║ ╚═╝ ██║██║  ██║██║ ╚████║
╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝</pre>
</div>
<p style="margin: 2px 0; color: var(--accent-color);">co-Founder and cto at <a href="https://a37.ai/" target="_blank" rel="noopener noreferrer" style="color: var(--accent-color);">a37.ai</a>; mit dropout</p>
<p>Type <span style="color: var(--primary-color)">help</span> to see available commands</p>
    `;

    if (terminal.current) {
      if (isInitialLoad) {
        // On initial load, replace the content
        terminal.current.innerHTML = bannerContent;
      } else {
        // When banner command is executed, append to existing content
        addOutput(bannerContent);
      }

      // Force scroll to bottom after displaying banner
      forceScrollToBottom();
    }
  };

  const displayErrorMessage = (command: string) => {
    addOutput(
      `<p style="margin: 0; padding: 0;">Command not found: <span style="color: var(--secondary-color)">${command}</span>. Try <span style="color: var(--primary-color)">help</span> to see available commands.</p>`
    );
  };

  const renderCommandLine = (text: string) => {
    return `<div class="${styles.newline}"><div class="${styles.prompt}"><span class="${styles.promptUsername}">guest</span><span class="${styles.promptSeparator}">@</span><span class="${styles.promptPath}">tahsinzaman:~$</span></div><span style="margin-left: 3px;">${text}</span></div>`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle arrow up/down for command history
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (
        commandHistory.length > 0 &&
        historyIndex < commandHistory.length - 1
      ) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        e.currentTarget.value =
          commandHistory[commandHistory.length - 1 - newIndex];
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        e.currentTarget.value =
          commandHistory[commandHistory.length - 1 - newIndex];
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        e.currentTarget.value = "";
      }
    }
  };

  // Theme selector component
  const ThemeSelector = () => {
    return (
      <div className={styles.themeSelector}>
        {themes.themes.map((theme: Theme) => (
          <div
            key={theme.name}
            className={`${styles.themeButton} ${
              currentTheme === theme.name ? "active" : ""
            }`}
            style={{
              backgroundColor: theme.colors["primary-color"],
              border:
                currentTheme === theme.name
                  ? "2px solid white"
                  : "2px solid transparent",
            }}
            onClick={() => applyTheme(theme.name)}
            title={theme.name}
          />
        ))}
      </div>
    );
  };

  // More aggressive scroll to bottom function - calls multiple times with increasing delays
  const forceScrollToBottom = () => {
    // Immediate scroll
    if (terminal.current) {
      terminal.current.scrollTop = terminal.current.scrollHeight;
    }

    // And then with delays to ensure it happens after any rendering
    [10, 50, 100, 200].forEach((delay) => {
      setTimeout(() => {
        if (terminal.current) {
          terminal.current.scrollTop = terminal.current.scrollHeight;
        }
      }, delay);
    });
  };

  // Track the caret position in the input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCaretPosition(e.target.selectionStart || 0);
  };

  // Handle click on input to update caret position
  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if (e.currentTarget) {
      setCaretPosition(e.currentTarget.selectionStart || 0);
    }
  };

  // Update caret position on key events
  const handleInputKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCaretPosition(e.currentTarget.selectionStart || 0);

    if (e.key === "Enter") {
      executeCommand(e.currentTarget.value);
      e.currentTarget.value = "";
      setCaretPosition(0);
    }
  };

  // Custom caret component
  const TerminalCaret = () => {
    // Calculate the position of the caret based on the text in the input
    const measureText = (text: string, font: string): number => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (context) {
        context.font = font;
        return context.measureText(text).width;
      }
      return 0;
    };

    const updateCaretPosition = () => {
      if (inputRef.current && caretRef.current) {
        const inputText = inputRef.current.value.substring(0, caretPosition);
        const computedStyle = window.getComputedStyle(inputRef.current);
        const font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;

        let textWidth = measureText(inputText, font);
        // Add padding for better alignment
        textWidth += 5; // 5px is the paddingLeft of input

        // Ensure the caret doesn't go out of bounds
        const inputWidth = inputRef.current.offsetWidth;
        if (textWidth > inputWidth - 10) {
          textWidth = inputWidth - 10;
        }

        caretRef.current.style.left = `${textWidth}px`;
      }
    };

    useEffect(() => {
      updateCaretPosition();

      // Also update on window resize
      const handleResize = () => {
        updateCaretPosition();
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, [caretPosition]);

    return (
      <div
        ref={caretRef}
        className={styles.terminalCaret}
        style={{
          display:
            document.activeElement === inputRef.current ? "block" : "none",
        }}
      />
    );
  };

  // Handle mobile input blur (focus loss)
  const handleInputBlur = () => {
    // On mobile, don't immediately refocus as it can be annoying
    // when trying to scroll or navigate
    if (!isMobile && inputRef.current) {
      setTimeout(() => {
        if (document.activeElement !== inputRef.current && inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  // Handle mobile touch on container to focus input
  const handleContainerTouch = () => {
    if (inputRef.current && isMobile) {
      inputRef.current.focus();
    }
  };

  // Add special event handler for mobile command buttons
  const handleCommandButtonClick = (command: string) => {
    if (inputRef.current) {
      inputRef.current.value = command;
      executeCommand(command);
    }
  };

  // Handle focus for mobile
  const handleInputFocus = () => {
    if (isMobile) {
      // Delay scrolling to bottom to account for keyboard opening
      setTimeout(() => {
        forceScrollToBottom();
      }, 300);
    }
  };

  return (
    <>
      <Head>
        <title>Tahsin Zaman | Terminal</title>
        <meta
          name="description"
          content="Tahsin Zaman's Terminal-themed Personal Website"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
        />
        <meta name="theme-color" content="#161b22" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/logo.png" />
      </Head>
      <main
        className={`${styles.main} ${isKeyboardOpen ? "keyboard-open" : ""}`}
      >
        <div className={styles.container}>
          <div className={styles.terminalHeader}>
            <div className={styles.terminalControls}>
              <div
                className={`${styles.terminalButton} ${styles.closeButton}`}
              ></div>
              <div
                className={`${styles.terminalButton} ${styles.minimizeButton}`}
              ></div>
              <div
                className={`${styles.terminalButton} ${styles.maximizeButton}`}
              ></div>
            </div>
            <div className={styles.terminalTitle}>guest@tahsinzaman:~</div>
            {isMounted && <ThemeSelector />}
          </div>
          <div className={styles.container2} onClick={handleContainerTouch}>
            <div className={styles.terminal} ref={terminal}></div>
            <div className={styles.inputLine}>
              <div className={styles.prompt}>
                <span className={styles.promptUsername}>guest</span>
                <span className={styles.promptSeparator}>@</span>
                <span className={styles.promptPath}>tahsinzaman:~$</span>
              </div>
              <div style={{ position: "relative", flexGrow: 1 }}>
                <input
                  ref={inputRef}
                  className={styles.input}
                  type="text"
                  maxLength={50}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleInputKeyUp}
                  onChange={handleInputChange}
                  onClick={handleInputClick}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  autoCapitalize="none"
                  autoFocus
                />
                {isMounted && <TerminalCaret />}
              </div>
            </div>
          </div>

          {/* Mobile command buttons - only shown on mobile */}
          {isMobile && isMounted && (
            <div
              style={{
                position: "fixed",
                bottom: isKeyboardOpen ? "55%" : "10px",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: "8px",
                zIndex: 100,
                justifyContent: "center",
                flexWrap: "wrap",
                width: "90%",
                maxWidth: "400px",
                backgroundColor: "rgba(0,0,0,0.6)",
                padding: "6px",
                borderRadius: "16px",
                transition: "bottom 0.3s ease",
              }}
            >
              {["help", "about", "github", "themes", "clear"].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => handleCommandButtonClick(cmd)}
                  style={{
                    backgroundColor: "var(--primary-color)",
                    color: "var(--container-bg)",
                    border: "none",
                    borderRadius: "12px",
                    padding: isPortrait ? "8px 12px" : "6px 10px",
                    fontSize: isPortrait ? "14px" : "12px",
                    fontWeight: "bold",
                    opacity: 0.9,
                    touchAction: "manipulation",
                    minHeight: isPortrait ? "36px" : "30px",
                  }}
                >
                  {cmd}
                </button>
              ))}
            </div>
          )}
        </div>
        {isMounted && <AutoFocus inputRef={inputRef} isMobile={isMobile} />}
      </main>
    </>
  );
}
