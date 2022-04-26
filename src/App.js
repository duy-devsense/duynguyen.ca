import { useState, useRef, useEffect } from "react";
import styled from "styled-components";

import { Directory } from "./components/Directory";
import { TerminalMessage } from "./components/TerminalMessage";
import { siteMap } from "./utils/output";
import { scrollToBottom } from "./utils/scroll-to-bottom";

const App = () => {
  const [directory, setDirectory] = useState("");
  const [input, setInput] = useState("");
  const [inputWidth, setInputWidth] = useState(0);
  const [output, setOutput] = useState(siteMap["welcome.txt"].content);
  const [currentFolder, setCurrentFolder] = useState(siteMap);

  const inputElem = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, []);

  const commands = {
    list: {
      description: `List all files and folders in the current directory`,
      function: () => {
        return Object.keys(currentFolder)
          .filter((key) => {
            return key !== "type";
          })
          .map((objectName) => {
            return { type: `message`, content: `${objectName}` };
          });
      },
    },
    cd: {
      description: `Change directory - Syntax: 'cd <directory path>' - Example: 'cd /blog'`,
      function: (inputPath) => {
        if (inputPath === "") {
          setDirectory("");
          setCurrentFolder(siteMap);
          return [];
        }

        // 1. iterate over inputPath
        let localFolder = siteMap;
        const inputPathArr = inputPath.split("/");
        const currentPathArr = directory.split("/");
        currentPathArr.shift();
        let newPathArr = [];

        // 2. for each ".." in the inputPath, remove from currentPath and inputPath
        inputPathArr.forEach((path) => {
          if (path === "..") {
            currentPathArr.pop();
          }
        });

        // remove ".." from input array
        const filteredInputArr = inputPathArr.filter((path) => {
          return path !== "..";
        });

        // 3. construct new path using processed current and input path
        newPathArr = [...currentPathArr, ...filteredInputArr];

        try {
          for (let i = 0; i < newPathArr.length; i++) {
            if (
              localFolder.hasOwnProperty(newPathArr[i]) &&
              localFolder[newPathArr[i]].type === "folder"
            ) {
              localFolder = localFolder[newPathArr[i]];
            } else {
              throw `error`;
            }
          }

          // 3. if folder exist in currentFolder then move into this folder
          setDirectory(["", ...newPathArr].join("/"));
          setCurrentFolder(localFolder);
          return [];
        } catch (error) {
          return [
            {
              type: `error`,
              content: `[ ERROR ] - cd: no such directory: ${inputPath}`,
            },
          ];
        }
      },
    },
    cat: {
      description: `View file content - Syntax: 'cat <file name>' - Example: 'cat README.txt'`,
      function: (fileName) => {
        if (
          currentFolder.hasOwnProperty(fileName) &&
          currentFolder[fileName].type === "file"
        ) {
          return currentFolder[fileName].content;
        } else {
          return [
            {
              type: `error`,
              content: `[ Error ] - cat: no such file: ${fileName}`,
            },
          ];
        }
      },
    },
    clear: {
      description: `Clear console messages`,
      function: () => {
        setOutput([]);
      },
    },
  };

  const resetInput = (e) => {
    e.preventDefault();
    setInput("");
    setInputWidth(`0ch`);
  };

  const displayHelp = () => {
    return Object.keys(commands).map((command) => {
      return {
        type: `message`,
        content: `${command}: ${commands[command].description}`,
      };
    });
  };

  const handleSubmit = (e) => {
    const inputArr = e.target.value.split(" ");
    const command = inputArr.shift();
    const inputParam = inputArr.join("");
    const isHelp = command === "help";
    let outputMessage = "";

    const previousCommand = {
      type: "directory",
      content: `visitor@duynguyen.ca${directory} % ${e.target.value}`,
    };

    resetInput(e);

    if (isHelp) {
      outputMessage = displayHelp();
    } else if (commands.hasOwnProperty(command)) {
      outputMessage = [...commands[command].function(inputParam)];
    } else {
      outputMessage = [
        {
          type: `error`,
          content: `[ ERROR ] - '${command}' is not a valid command. Type 'help' for a list of available commands.`,
        },
      ];
    }

    setOutput([...output, previousCommand, ...outputMessage]);
  };

  const handleInputChange = (e) => {
    e.preventDefault();
    setInput(e.target.value);
    setInputWidth(`${e.target.value.length}ch`);
  };

  return (
    <StyledApp
      className="App"
      onClick={() => {
        inputElem.current.focus();
      }}
    >
      {output.map((message, i) => {
        const { content, type } = message;
        return <TerminalMessage key={i} message={content} type={type} />;
      })}
      <div className="input-container">
        <Directory
          for="input"
          content={`visitor@duynguyen.ca${directory} %  `}
        />
        <StyledTerminalInput
          autoFocus
          ref={inputElem}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSubmit(e);
            }
          }}
          style={{ width: inputWidth }}
        />
      </div>
    </StyledApp>
  );
};

export default App;

const StyledApp = styled.div`
  position: absolute;
  bottom: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  scroll-behavior: smooth;

  max-height: calc(100vh - var(--padding-page) * 2 - var(--margin-page) * 2);
  height: calc(100vh - var(--padding-page) * 2 - var(--margin-page) * 2);
  width: 100%;
`;

const StyledTerminalInput = styled.input`
  @keyframes blinkingCursor {
    50% {
      border-right-color: var(--color-green);
    }
    100% {
      border-right-color: transparent;
    }
  }

  border: 0px transparent;
  display: inline-block;
  animation: blinkingCursor 1s infinite steps(2);
  color: inherit;
  outline: none;
  border-right: 10px solid transparent;
  caret-color: transparent;
`;
