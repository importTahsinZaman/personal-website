import Head from "next/head";
import { useEffect, useRef } from "react";
import styles from "../styles/Home.module.css";

import reactElementToJSXString from "react-element-to-jsx-string";

import themes from "../public/themes.json";

export default function Home() {
  const terminal = useRef(null);

  const executeCommand = (command: string) => {
    let terminal_state = terminal.current.innerHTML;
    terminal_state += newLineTextAsString(command);
    terminal.current.innerHTML = terminal_state;

    switch (command) {
      case "help":
        displayHelpMessage();
        break;
      case "clear":
        clearTerminal();
        break;
      case "banner":
        displayBanner();
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
        break;
      case "projects":
        window.open(
          "https://github.com/importTahsinZaman",
          "_blank",
          "noopener,noreferrer"
        );
        break;
      case "github":
        window.open(
          "https://github.com/importTahsinZaman",
          "_blank",
          "noopener,noreferrer"
        );
        break;
      case "repo":
        window.open(
          "https://github.com/importTahsinZaman/personal-website",
          "_blank",
          "noopener,noreferrer"
        );
        break;
      case "email":
        displayEmail();
        break;
      default:
        displayErrorMessage(command);
        break;
    }
  };

  const displayHelpMessage = () => {
    let terminal_state = terminal.current.innerHTML;
    terminal_state += `<p>Available commands:</p>`;
    terminal_state += `<p>about, banner, email, github, help, linkedin, projects, repo, whoami</p>`;
    terminal.current.innerHTML = terminal_state;
  };

  const clearTerminal = () => {
    terminal.current.innerHTML = "";
  };

  function delay(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  const displayEmail = () => {
    let terminal_state = terminal.current.innerHTML;
    terminal_state += `<p>tahsinz21366@gmail.com</p>`;
    terminal.current.innerHTML = terminal_state;
  };

  const displayAboutMessage = () => {
    const terminalDiv = document.getElementById("terminal");
    let elem = document.createElement("img");
    elem.src = "./self.jpg";
    elem.width = 400;
    terminalDiv.appendChild(elem);

    let terminal_state = terminal.current.innerHTML;
    terminal_state += `<p>Tahsin is ...</p>`;
    terminal.current.innerHTML = terminal_state;
  };

  const displayBanner = () => {
    let terminal_state = terminal.current.innerHTML;
    let pointer = 0;
    const addBannerLine = (pointer: number) => {
      terminal_state += `<pre style="font-size:12px">${banner[pointer]}</pre>`;
      terminal.current.innerHTML = terminal_state;
    };
    while (pointer < banner.length) {
      addBannerLine(pointer);
      pointer += 1;
    }
    const addBanner2Line = (pointer: number) => {
      terminal_state += `<pre style="font-size:7.5px">${banner2[pointer]}</pre>`;
      terminal.current.innerHTML = terminal_state;
    };
    pointer = 0;
    while (pointer < banner2.length) {
      addBanner2Line(pointer);
      pointer += 1;
    }
    terminal_state += `</br>`;
    terminal_state += `<p>Welcome!</p>`;
    terminal_state += `<p>For a list of available commands, type 'help'.</p>`;
    terminal_state += `<p>As this site is still a work in progress, most commands do not yet work</p>`;
    terminal.current.innerHTML = terminal_state;
  };

  const displayErrorMessage = (command: string) => {
    let terminal_state = terminal.current.innerHTML;
    terminal_state += `<p>Command not found: ${command}. Try 'help' to get started</p>`;
    terminal.current.innerHTML = terminal_state;
  };

  const newLineText = (text: string) => {
    return (
      <div style={{ display: "flex" }}>
        <p style={{ color: "var(--primary-color)" }}>guest</p>
        <p>@</p>
        <p style={{ color: "var(--secondary-color)" }}>tahsinzaman.dev:</p>
        <pre>$ ~ </pre>
        <p>{text}</p>
      </div>
    );
  };

  const newLineTextAsString = (text: string) => {
    return `
      <div style="display:flex; margin-top:5px; margin-bottom:5px">
        <p style="color: var(--primary-color)">guest</p>
        <p>@</p>
        <p style="color: var(--secondary-color)">tahsinzaman.dev:</p>
        <p>
          <pre>$ ~ </pre>
        </p>
        <p>${text}</p>
      </div>
    `;
  };

  const banner = [
    ``,
    `                           .,,uod8B8bou,,.`,
    `              ..,uod8BBBBBBBBBBBBBBBBRPFT?l!i:.`,
    `         ,=m8BBBBBBBBBBBBBBBRPFT?!||||||||||||||`,
    `         !...:!TVBBBRPFT||||||||||!!^^""'   ||||`,
    `         !.......:!?|||||!!^^""'            ||||`,
    `         !.........||||                     ||||`,
    `         !.........||||                     ||||`,
    `         !.........||||                     ||||`,
    `         !.........||||                     ||||`,
    `         !.........||||                     ||||`,
    `         !.........||||                     ||||`,
    `          .........||||                    ,||||`,
    `          .;.......||||               _.-!!|||||`,
    `   .,uodWBBBBb.....||||       _.-!!|||||||||!:'`,
    ` YBBBBBBBBBBBBBBb..!|||:..-!!|||||||!iof68BBBBBb`,
    ` ..YBBBBBBBBBBBBBBb!!||||||||!iof68BBBBBBRPFT?!::    `,
    `     ........::::::::::::::::;iof688888888888888888888b.      `,
    `       ......:::::::::;iof688888888888888888888888888888b.`,
    `         ....:::;iof688888888888888888888888888888888899fT!`,
    `           ..::!8888888888888888888888888888888899fT|!^"'`,
    `             ' !!988888888888888888888888899fT|!^"'`,
    `                 !!8888888888888888899fT|!^"'`,
    `                   !988888888899fT|!^"'`,
  ];

  const banner2 = [
    `████████╗█████╗  ██╗  ██╗███████╗██╗███╗   ██╗    ███████╗ █████╗ ███╗   ███╗ █████╗ ███╗   ██╗`,
    `╚══██╔══╝██╔══██╗██║  ██║██╔════╝██║████╗  ██║    ╚══███╔╝██╔══██╗████╗ ████║██╔══██╗████╗  ██║`,
    `   ██║   ███████║███████║███████╗██║██╔██╗ ██║      ███╔╝ ███████║██╔████╔██║███████║██╔██╗ ██║`,
    `   ██║   ██╔══██║██╔══██║╚════██║██║██║╚██╗██║     ███╔╝  ██╔══██║██║╚██╔╝██║██╔══██║██║╚██╗██║`,
    `   ██║   ██║  ██║██║  ██║███████║██║██║ ╚████║    ███████╗██║  ██║██║ ╚═╝ ██║██║  ██║██║ ╚████║`,
    `   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝╚═╝  ╚═══╝    ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝`,
  ];

  useEffect(() => {
    displayBanner();
  });
  return (
    <>
      <Head>
        <title>Tahsin Zaman</title>
        <meta name="description" content="Tahsin Zaman's Personal Website" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo.png" />
      </Head>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.container2}>
            <div className={styles.terminal} ref={terminal} id={"terminal"}>
              {newLineText("banner")}
            </div>
            <div className={styles.newline}>
              {newLineText("")}
              <input
                className={styles.input}
                rows={1}
                maxLength={50}
                onKeyUp={(e) => {
                  if (e.key === "Enter") {
                    executeCommand(e.target.value);
                    e.target.value = "";
                  }
                }}
              ></input>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
