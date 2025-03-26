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

// Simplified text streaming utility function
const streamTextToElement = (
  element: HTMLElement,
  content: string,
  speed: number = 10,
  onComplete?: () => void
) => {
  const tempDiv = document.createElement("div");

  // Create a temporary container
  const container = document.createElement("div");
  container.innerHTML = content;

  // Append the container to the terminal
  element.appendChild(container);

  // Get all text nodes
  const textNodes: Text[] = [];
  const getTextNodes = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      textNodes.push(node as Text);
    } else {
      node.childNodes.forEach((child) => getTextNodes(child));
    }
  };

  getTextNodes(container);

  // Store original content and clear text
  const originalContents = textNodes.map((node) => node.textContent || "");
  textNodes.forEach((node) => {
    node.textContent = "";
  });

  // Stream text into each node sequentially
  let currentNodeIndex = 0;
  let currentCharIndex = 0;

  const typeNextChar = () => {
    if (currentNodeIndex >= textNodes.length) {
      if (onComplete) onComplete();
      return;
    }

    const currentNode = textNodes[currentNodeIndex];
    const originalText = originalContents[currentNodeIndex];

    if (currentCharIndex < originalText.length) {
      // Add next character
      currentNode.textContent = originalText.substring(0, currentCharIndex + 1);
      currentCharIndex++;
      setTimeout(typeNextChar, speed);
    } else {
      // Move to next node
      currentNodeIndex++;
      currentCharIndex = 0;
      setTimeout(typeNextChar, speed * 2);
    }
  };

  typeNextChar();
};

// ASCII Art streaming utility function for banner - with chunk processing for speed
const streamAsciiArt = (
  element: HTMLElement,
  asciiArt: string,
  chunkSize: number = 20, // Process this many characters at once
  onComplete?: () => void,
  terminalRef?: React.RefObject<HTMLDivElement>
) => {
  // Split ASCII art into rows and create all characters
  const rows = asciiArt.trim().split("\n");
  const totalRows = rows.length;

  // Create pre element to contain the ASCII art
  const pre = document.createElement("pre");
  pre.className = styles.asciiArt;
  element.appendChild(pre);

  // Create an empty display grid
  const displayGrid: string[][] = [];
  for (let i = 0; i < totalRows; i++) {
    displayGrid.push(new Array(rows[i].length).fill(" "));
  }

  // Flatten all characters into a single array for left-to-right streaming
  const allChars: { char: string; row: number; col: number }[] = [];

  rows.forEach((row, rowIndex) => {
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const char = row.charAt(colIndex);
      if (char !== " ") {
        // Only include non-space characters for efficiency
        allChars.push({ char, row: rowIndex, col: colIndex });
      }
    }
  });

  // Stream characters in chunks using requestAnimationFrame for better performance
  let charIndex = 0;

  const streamNextChunk = () => {
    if (charIndex >= allChars.length) {
      if (onComplete) onComplete();
      return;
    }

    // Process a chunk of characters at once for speed
    const endIndex = Math.min(charIndex + chunkSize, allChars.length);

    // Update multiple characters in a single frame
    for (let i = charIndex; i < endIndex; i++) {
      const { char, row, col } = allChars[i];
      displayGrid[row][col] = char;
    }

    // Update the display with all changes at once
    let displayText = "";
    displayGrid.forEach((displayRow) => {
      displayText += displayRow.join("") + "\n";
    });

    pre.innerHTML = displayText;

    // Scroll to ensure visibility
    if (terminalRef?.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }

    // Update the index for next chunk
    charIndex = endIndex;

    // Use requestAnimationFrame for better performance
    if (charIndex < allChars.length) {
      requestAnimationFrame(streamNextChunk);
    } else if (onComplete) {
      onComplete();
    }
  };

  // Start the animation
  requestAnimationFrame(streamNextChunk);
};

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
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

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

    // Don't allow command execution during streaming
    if (isStreaming) return;

    // Add to command history
    setCommandHistory((prev) => [...prev, command]);
    setHistoryIndex(-1);

    // Show the command in the terminal
    if (terminal.current) {
      // Add command line immediately (don't stream the command itself)
      const commandLine = renderCommandLine(command);
      terminal.current.innerHTML += commandLine;
      forceScrollToBottom();

      // Process command after displaying the command line
      setTimeout(() => {
        // Process command
        const lowerCommand = command.trim().toLowerCase();
        processCommand(lowerCommand, command);
      }, 100);
    }
  };

  const processCommand = (lowerCommand: string, originalCommand: string) => {
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
          const themeName = originalCommand.split(" ")[1];
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
          displayErrorMessage(originalCommand);
        }
        break;
    }
  };

  const addOutput = (content: string) => {
    if (terminal.current) {
      setIsStreaming(true);
      const div = document.createElement("div");
      div.className = styles.commandResult;
      div.style.margin = "12px 0 4px 0";
      terminal.current.appendChild(div);

      streamTextToElement(div, content, 5, () => {
        setIsStreaming(false);
        forceScrollToBottom();
      });
    }
  };

  const displayHelpMessage = () => {
    if (terminal.current) {
      setIsStreaming(true);

      const helpContent = `<p style="margin: 0 0 4px 0; padding: 0;"><strong>Available commands:</strong></p><table class="${styles.infoTable}" style="margin: 0;">
      <tr><td>about</td><td>Learn about me</td></tr>
      <tr><td>banner</td><td>Display the welcome banner</td></tr>
      <tr><td>clear</td><td>Clear the terminal</td></tr>
      <tr><td>email</td><td>Show my email address</td></tr>
      <tr><td>github</td><td>Open my GitHub profile</td></tr>
      <tr><td>help</td><td>Show this help message</td></tr>
      <tr><td>linkedin</td><td>Open my LinkedIn profile</td></tr>
      <tr><td>themes</td><td>List available color themes</td></tr>
      <tr><td>theme [name]</td><td>Switch to a different color theme</td></tr>
      </table>`;

      const div = document.createElement("div");
      div.style.margin = "12px 0 4px 0";
      div.style.padding = "0";
      terminal.current.appendChild(div);

      streamTextToElement(div, helpContent, 3, () => {
        setIsStreaming(false);
        forceScrollToBottom();
      });
    }
  };

  const clearTerminal = () => {
    if (terminal.current) {
      terminal.current.innerHTML = "";
      setIsStreaming(false);
    }
  };

  const displayEmail = () => {
    if (terminal.current) {
      setIsStreaming(true);

      const emailContent = `<p>📧 Email: <a href="mailto:tahsinz21366@gmail.com">tahsinz21366@gmail.com</a></p>`;

      const div = document.createElement("div");
      div.style.margin = "12px 0 4px 0";
      terminal.current.appendChild(div);

      streamTextToElement(div, emailContent, 5, () => {
        setIsStreaming(false);
        forceScrollToBottom();
      });
    }
  };

  const displayAboutMessage = () => {
    if (terminal.current) {
      setIsStreaming(true);

      const aboutContent = `<p>hi, i'm <strong>tahsin zaman</strong> – a passionate founder and developer</p>
      <p style="margin-top: 3px">i'm currently building forge, the ai workspace for devops over at <a href="https://a37.ai/" target="_blank" rel="noopener noreferrer">a37.ai</a></p>`;

      const div = document.createElement("div");
      div.style.margin = "12px 0 0 0";
      terminal.current.appendChild(div);

      streamTextToElement(div, aboutContent, 5, () => {
        setIsStreaming(false);
        forceScrollToBottom();
      });
    }
  };

  const displayThemes = () => {
    if (terminal.current) {
      setIsStreaming(true);

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

      const themesContent = `<p style="margin: 0; padding: 0;"><strong>Available themes:</strong></p>
      <p style="margin: 3px 0 0 0; padding: 0;">Current theme: <span style="color: var(--primary-color)">${currentTheme}</span></p>
      <div style="margin-top: 3px; padding: 0;">
        ${themes.themes
          .map(
            (theme: Theme) =>
              `<div style="margin: 2px 0; padding: 0;"><code>theme ${theme.name}</code> - ${theme.name}</div>`
          )
          .join("")}
      </div>
      <p style="margin: 3px 0 0 0;">Click to preview: ${themeButtons}</p>`;

      const div = document.createElement("div");
      div.style.margin = "12px 0 0 0";
      div.style.lineHeight = "1.2";
      terminal.current.appendChild(div);

      streamTextToElement(div, themesContent, 3, () => {
        setIsStreaming(false);
        forceScrollToBottom();

        // Add theme change event listener
        document.addEventListener("changeTheme", ((e: Event) => {
          const customEvent = e as CustomEvent<string>;
          applyTheme(customEvent.detail);
        }) as EventListener);
      });
    }
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
    if (terminal.current) {
      if (isInitialLoad) {
        // On initial load, clear the content first
        terminal.current.innerHTML = "";
      }

      setIsStreaming(true);

      // Create container for the banner
      const bannerContainer = document.createElement("div");
      bannerContainer.style.margin = "0";
      bannerContainer.style.padding = "0";
      terminal.current.appendChild(bannerContainer);

      // Create container for ASCII art
      const asciiArtContainer = document.createElement("div");
      asciiArtContainer.style.maxWidth = "100%";
      asciiArtContainer.style.overflowX = "auto";
      asciiArtContainer.style.margin = "0";
      asciiArtContainer.style.padding = "0";
      bannerContainer.appendChild(asciiArtContainer);

      // ASCII art content
      const asciiArt = `████████╗ █████╗ ██╗  ██╗███████╗██╗███╗   ██╗
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
╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝`;

      // Use the new chunked streaming approach - process 20 characters per frame
      streamAsciiArt(
        asciiArtContainer,
        asciiArt,
        3, // Process 3 characters per animation frame (50% slower than before)
        () => {
          // Stream the text below the ASCII art once ASCII art streaming is complete
          const textContainer = document.createElement("div");
          textContainer.style.margin = "8px 0 0 0";
          bannerContainer.appendChild(textContainer);

          const bannerText = `<p style="margin: 0 0 4px 0; color: var(--accent-color);">co-founder and cto at <a href="https://a37.ai/" target="_blank" rel="noopener noreferrer" style="color: var(--accent-color);">a37.ai</a>; mit dropout</p>
        <p style="margin: 0;">Type <span style="color: var(--primary-color)">help</span> to see available commands</p>`;

          streamTextToElement(textContainer, bannerText, 8, () => {
            setIsStreaming(false);
            forceScrollToBottom();
          });
        },
        terminal
      );
    }
  };

  const displayErrorMessage = (command: string) => {
    if (terminal.current) {
      setIsStreaming(true);

      const errorContainer = document.createElement("p");
      errorContainer.style.margin = "12px 0 4px 0";
      errorContainer.style.padding = "0";
      terminal.current.appendChild(errorContainer);

      const errorContent = `Command not found: <span style="color: var(--secondary-color)">${command}</span>. Try <span style="color: var(--primary-color)">help</span> to see available commands.`;

      streamTextToElement(errorContainer, errorContent, 10, () => {
        setIsStreaming(false);
        forceScrollToBottom();
      });
    }
  };

  const renderCommandLine = (text: string) => {
    return `<div class="${styles.newline}" style="margin-bottom: 15px;"><div class="${styles.prompt}"><span class="${styles.promptUsername}">guest</span><span class="${styles.promptSeparator}">@</span><span class="${styles.promptPath}">tahsinzaman:~$</span></div><span style="margin-left: 3px;">${text}</span></div>`;
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

    if (e.key === "Enter" && !isStreaming) {
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
